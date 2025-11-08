"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gptService = exports.GPTService = void 0;
const openai_1 = __importDefault(require("openai"));
// Inicializar OpenAI
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY || '',
});
class GPTService {
    /**
     * Analisa fatura de cartão de crédito usando GPT-4o
     */
    async analyzeCreditCardStatement(pdfBuffer) {
        try {
            console.log('🤖 Iniciando análise com GPT-4o...');
            // Converter PDF para base64
            const base64Pdf = pdfBuffer.toString('base64');
            // Prompt otimizado para GPT-4o
            const prompt = `Você é um especialista em análise de faturas de cartão de crédito brasileiras.

TAREFA: Analise esta fatura e extraia TODAS as transações em formato JSON.

CATEGORIAS DISPONÍVEIS:
1. Alimentação - restaurantes, delivery, supermercado, padaria, açougue
2. Transporte - uber, 99, combustível, estacionamento, pedágio
3. Moradia - aluguel, condomínio, luz, água, gás, internet
4. Lazer - streaming (Netflix, Spotify), cinema, jogos, viagens
5. Compras - roupas, eletrônicos, e-commerce (Amazon, Mercado Livre)
6. Saúde - farmácia, médico, dentista, academia, exames
7. Serviços - assinaturas, telefone, seguros, manutenção
8. Educação - cursos, livros, mensalidade escolar
9. Outros - transações que não se encaixam nas categorias acima

INSTRUÇÕES:
- Extraia data, descrição e valor de cada transação
- Categorize automaticamente baseado na descrição
- Todas as transações são EXPENSE (despesas de cartão)
- Valores devem ser números positivos (ex: 123.45)
- Datas no formato YYYY-MM-DD
- Ignore totais, saldos, juros e encargos
- Retorne APENAS o JSON, sem markdown ou explicações

FORMATO JSON:
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "UBER *TRIP",
      "amount": 25.50,
      "category": "Transporte",
      "type": "EXPENSE"
    }
  ]
}`;
            // Enviar para GPT-4o
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: prompt,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:application/pdf;base64,${base64Pdf}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 4096,
                temperature: 0.1,
            });
            console.log('📥 Resposta recebida do GPT-4o');
            // Extrair texto da resposta
            let text = response.choices[0]?.message?.content || '{}';
            // Limpar markdown se houver
            text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            // Parse JSON
            const data = JSON.parse(text);
            const transactions = data.transactions || [];
            // Calcular resumo
            const total = transactions.reduce((sum, t) => sum + t.amount, 0);
            const byCategory = {};
            transactions.forEach(t => {
                byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
            });
            console.log(`✅ ${transactions.length} transações extraídas`);
            console.log(`💰 Total: R$ ${total.toFixed(2)}`);
            console.log(`📊 Tokens usados: ${response.usage?.total_tokens || 0}`);
            return {
                transactions,
                summary: {
                    total,
                    count: transactions.length,
                    byCategory,
                },
            };
        }
        catch (error) {
            console.error('❌ Erro ao analisar com GPT-4o:', error);
            // Tratamento de erros específicos
            if (error.status === 429) {
                throw new Error('Rate limit excedido. Tente novamente em alguns segundos.');
            }
            else if (error.status === 401) {
                throw new Error('API Key do OpenAI inválida. Configure OPENAI_API_KEY no .env');
            }
            throw new Error(`Falha na análise: ${error.message}`);
        }
    }
    /**
     * Valida se a API Key do GPT está configurada
     */
    static isConfigured() {
        return !!process.env.OPENAI_API_KEY;
    }
}
exports.GPTService = GPTService;
exports.gptService = new GPTService();
//# sourceMappingURL=gpt.service.js.map