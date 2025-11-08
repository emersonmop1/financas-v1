"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.claudeService = exports.ClaudeService = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const database_1 = __importDefault(require("../config/database"));
// Inicializar Claude
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
class ClaudeService {
    /**
     * Analisa fatura de cartão de crédito usando Claude Sonnet 4.5
     * Extrai todas as informações: cartões, transações, valores, categorias
     */
    async analyzeInvoicePDF(pdfBuffer, userId) {
        try {
            console.log('🤖 Iniciando análise de fatura com Claude Sonnet 4.5...');
            // Buscar categorias do usuário para categorização inteligente
            const userCategories = await database_1.default.category.findMany({
                where: {
                    OR: [{ userId }, { isDefault: true }],
                    type: 'EXPENSE', // Faturas de cartão são sempre despesas
                },
                select: {
                    name: true,
                },
            });
            const categoriesList = userCategories.map(c => c.name).join(', ');
            // Converter PDF para base64
            const base64Pdf = pdfBuffer.toString('base64');
            // Prompt otimizado para extração completa de faturas
            const prompt = `Você é um especialista em análise de faturas de cartão de crédito brasileiras.

TAREFA: Analise esta fatura e extraia TODAS as informações em formato JSON estruturado.

CATEGORIAS DISPONÍVEIS PARA USAR:
${categoriesList}

INSTRUÇÕES DE EXTRAÇÃO:

1. INFORMAÇÕES DA FATURA:
   - Data de vencimento
   - Data de fechamento (se disponível)
   - Valor total da fatura

2. PARA CADA CARTÃO NA FATURA:
   - Últimos 4 dígitos do cartão
   - Nome do titular
   - Total do cartão
   - Tipo (principal ou adicional)

3. PARA CADA TRANSAÇÃO:
   - Data (formato YYYY-MM-DD)
   - Descrição do estabelecimento (limpar códigos, manter nome legível)
   - Valor (número positivo, ex: 123.45)
   - Categoria (escolher da lista acima - se não souber, use "Outros")
   - Parcelamento (se houver indicação como "2x", "3x", extrair o número)
   - Internacional (true se for transação internacional, false caso contrário)

4. SEPARAR transações nacionais e internacionais por cartão

5. REGRAS:
   - Ignore totais, saldos anteriores, juros, encargos
   - Valores sempre positivos
   - Categorize baseado no estabelecimento
   - Se estabelecimento indicar luxo (GUCCI, VALENTINO, etc), adicione ao nome da categoria
   - Parcelamentos: extrair número (ex: "2x" = 2, "3x" = 3)

FORMATO JSON EXATO (retorne APENAS JSON, sem markdown):

{
  "invoice": {
    "dueDate": "2025-02-15",
    "closingDate": "2025-01-15",
    "totalAmount": 38967.12,
    "cards": [
      {
        "last4Digits": "1574",
        "holderName": "Rodolfo",
        "totalAmount": 27596.76,
        "transactions": [
          {
            "date": "2024-05-08",
            "description": "KAZA ESTILO",
            "amount": 524.00,
            "category": "Vestuário",
            "installments": null,
            "isInternational": false
          },
          {
            "date": "2025-01-02",
            "description": "Wellhub Gympass",
            "amount": 399.90,
            "category": "Academia",
            "installments": 2,
            "isInternational": false
          }
        ],
        "internationalTransactions": [
          {
            "date": "2024-12-15",
            "description": "TOLLFREEFORWARDING",
            "amount": 89.46,
            "category": "Serviços",
            "installments": 2,
            "isInternational": true
          }
        ]
      }
    ]
  }
}`;
            // Enviar para Claude Sonnet 4.5
            const message = await anthropic.messages.create({
                model: 'claude-sonnet-4-5-20250929',
                max_tokens: 16384,
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'document',
                                source: {
                                    type: 'base64',
                                    media_type: 'application/pdf',
                                    data: base64Pdf,
                                },
                            },
                            {
                                type: 'text',
                                text: prompt,
                            },
                        ],
                    },
                ],
            });
            console.log('📥 Resposta recebida do Claude');
            // Extrair texto da resposta
            let text = '';
            for (const block of message.content) {
                if (block.type === 'text') {
                    text += block.text;
                }
            }
            // Limpar markdown se houver
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            // Parse JSON
            const data = JSON.parse(text);
            // Calcular resumo por categoria
            const byCategory = {};
            data.invoice.cards.forEach(card => {
                const allTransactions = [...card.transactions, ...card.internationalTransactions];
                allTransactions.forEach(t => {
                    byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
                });
            });
            // Adicionar summary
            data.summary = { byCategory };
            // Estatísticas
            const totalTransactions = data.invoice.cards.reduce((sum, card) => sum + card.transactions.length + card.internationalTransactions.length, 0);
            console.log(`✅ ${totalTransactions} transações extraídas de ${data.invoice.cards.length} cartão(ões)`);
            console.log(`💰 Total da fatura: R$ ${data.invoice.totalAmount.toFixed(2)}`);
            console.log(`📊 Tokens usados: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);
            console.log(`💵 Custo estimado: $${((message.usage.input_tokens * 3 + message.usage.output_tokens * 15) / 1000000).toFixed(4)}`);
            return data;
        }
        catch (error) {
            console.error('❌ Erro ao analisar com Claude:', error);
            // Tratamento de erros específicos do Claude
            if (error.status === 429) {
                throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
            }
            else if (error.status === 401) {
                throw new Error('API Key do Claude inválida. Configure ANTHROPIC_API_KEY no .env');
            }
            else if (error.message?.includes('tokens')) {
                throw new Error('Documento muito grande. Tente um PDF menor.');
            }
            else if (error instanceof SyntaxError) {
                throw new Error('Erro ao processar resposta do Claude. Tente novamente.');
            }
            throw new Error(`Falha na análise: ${error.message}`);
        }
    }
    /**
     * Valida se a API Key do Claude está configurada
     */
    static isConfigured() {
        return !!process.env.ANTHROPIC_API_KEY;
    }
}
exports.ClaudeService = ClaudeService;
exports.claudeService = new ClaudeService();
//# sourceMappingURL=claude.service.js.map