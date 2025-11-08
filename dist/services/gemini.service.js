"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiService = exports.GeminiService = void 0;
const generative_ai_1 = require("@google/generative-ai");
// Inicializar Gemini
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
class GeminiService {
    /**
     * Analisa fatura de cartão de crédito usando Gemini 1.5 Flash
     */
    async analyzeCreditCardStatement(pdfBuffer) {
        try {
            console.log('🤖 Iniciando análise com Gemini 1.5 Flash...');
            // Converter PDF para base64
            const base64Pdf = pdfBuffer.toString('base64');
            // Usar modelo Gemini 1.5 Pro Latest (suporta PDF nativo)
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-pro-latest',
            });
            // Prompt otimizado para análise de faturas
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
            // Enviar para Gemini
            const result = await model.generateContent([
                {
                    inlineData: {
                        data: base64Pdf,
                        mimeType: 'application/pdf',
                    },
                },
                prompt,
            ]);
            const response = result.response;
            let text = response.text();
            console.log('📥 Resposta recebida do Gemini');
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
            console.error('❌ Erro ao analisar com Gemini:', error);
            throw new Error(`Falha na análise: ${error.message}`);
        }
    }
    /**
     * Valida se a API Key do Gemini está configurada
     */
    static isConfigured() {
        return !!process.env.GEMINI_API_KEY;
    }
}
exports.GeminiService = GeminiService;
exports.geminiService = new GeminiService();
//# sourceMappingURL=gemini.service.js.map