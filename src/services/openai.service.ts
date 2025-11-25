import OpenAI from 'openai';
import prisma from '../config/database';

// Inicializar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  timeout: 30000, // 30 segundos
  maxRetries: 2,
});

interface InvoiceTransaction {
  date: string;
  description: string;
  amount: number;
  category: string;
  installments: number | null;
  isInternational: boolean;
}

interface InvoiceCard {
  last4Digits: string;
  holderName: string;
  totalAmount: number;
  transactions: InvoiceTransaction[];
  internationalTransactions: InvoiceTransaction[];
}

interface InvoiceAnalysisResult {
  invoice: {
    dueDate: string;
    closingDate: string;
    totalAmount: number;
    cards: InvoiceCard[];
  };
  summary: {
    byCategory: Record<string, number>;
  };
}

export class OpenAIService {
  /**
   * Analisa fatura de cartão de crédito usando GPT-4 Vision
   * Mais rápido e preciso que Claude para PDFs
   */
  async analyzeInvoicePDF(pdfBuffer: Buffer, userId: string): Promise<InvoiceAnalysisResult> {
    try {
      const startTime = Date.now();
      console.log('🚀 Iniciando análise de fatura com GPT-4...');

      // Buscar categorias do usuário
      const userCategories = await prisma.category.findMany({
        where: {
          OR: [{ userId }, { isDefault: true }],
          type: 'EXPENSE',
        },
        select: {
          name: true,
        },
      });

      const categoriesList = userCategories.map(c => c.name).join(', ');

      // Converter PDF para base64
      const base64Pdf = pdfBuffer.toString('base64');

      // Prompt otimizado para GPT-4
      const prompt = `Analise esta fatura de cartão de crédito brasileira e extraia TODAS as informações.

CATEGORIAS DISPONÍVEIS: ${categoriesList}

REGRAS IMPORTANTES:
1. DÉBITOS (compras/gastos): valores POSITIVOS - inclua TODAS
2. CRÉDITOS (pagamentos/estornos): valores NEGATIVOS - mantenha negativo
3. Identifique corretamente: vencimento, fechamento, últimos 4 dígitos, titular
4. Categorize cada transação usando as categorias fornecidas
5. Marque transações internacionais quando houver IOF ou moeda estrangeira
6. Extraia parcelas quando indicado (2/12, 3x, etc)

FORMATO DE SAÍDA - Retorne APENAS este JSON (sem markdown):
{
  "invoice": {
    "dueDate": "YYYY-MM-DD",
    "closingDate": "YYYY-MM-DD",
    "totalAmount": 0.00,
    "cards": [{
      "last4Digits": "1234",
      "holderName": "Nome",
      "totalAmount": 0.00,
      "transactions": [
        {
          "date": "YYYY-MM-DD",
          "description": "Estabelecimento",
          "amount": 123.45,
          "category": "Categoria",
          "installments": null,
          "isInternational": false
        }
      ],
      "internationalTransactions": []
    }]
  }
}`;

      // Chamar GPT-4 Vision
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:application/pdf;base64,${base64Pdf}`,
                  detail: "high"
                }
              }
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || '{}';

      // Parse JSON
      const data: InvoiceAnalysisResult = JSON.parse(responseText);

      // Calcular resumo por categoria
      const byCategory: Record<string, number> = {};

      data.invoice.cards.forEach(card => {
        const allTransactions = [...card.transactions, ...card.internationalTransactions];
        allTransactions.forEach(t => {
          // Apenas somar débitos (positivos) ao resumo
          if (t.amount > 0) {
            byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
          }
        });
      });

      data.summary = { byCategory };

      // Estatísticas
      const totalTransactions = data.invoice.cards.reduce(
        (sum, card) => sum + card.transactions.length + card.internationalTransactions.length,
        0
      );

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ ${totalTransactions} transações extraídas em ${elapsed}s`);
      console.log(`💰 Total da fatura: R$ ${data.invoice.totalAmount.toFixed(2)}`);
      console.log(`📊 Modelo: ${completion.model}`);
      console.log(`🎯 Tokens: ${completion.usage?.total_tokens || 'N/A'}`);

      return data;
    } catch (error: any) {
      console.error('❌ Erro ao analisar com GPT-4:', error);

      // Tratamento de erros
      if (error.status === 429) {
        throw new Error('Limite de requisições excedido. Tente novamente em alguns segundos.');
      } else if (error.status === 401) {
        throw new Error('API Key da OpenAI inválida. Configure OPENAI_API_KEY no .env');
      } else if (error.message?.includes('maximum')) {
        throw new Error('Documento muito grande. Tente um PDF menor.');
      }

      throw new Error(`Erro na análise: ${error.message}`);
    }
  }

  /**
   * Verifica se a API Key está configurada
   */
  isConfigured(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }
}

export const openaiService = new OpenAIService();