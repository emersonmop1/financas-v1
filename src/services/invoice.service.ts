import prisma from '../config/database';
import { openaiService } from './openai.service';
import { claudeService } from './claude.service';
import { Prisma } from '@prisma/client';

interface InvoicePreviewData {
  invoice: {
    dueDate: string;
    closingDate: string;
    totalAmount: number;
    cards: Array<{
      last4Digits: string;
      holderName: string;
      totalAmount: number;
      transactions: Array<{
        date: string;
        description: string;
        amount: number;
        category: string;
        installments: number | null;
        isInternational: boolean;
      }>;
      internationalTransactions: Array<{
        date: string;
        description: string;
        amount: number;
        category: string;
        installments: number | null;
        isInternational: boolean;
      }>;
    }>;
  };
  summary: {
    byCategory: Record<string, number>;
  };
  duplicateWarning?: {
    exists: boolean;
    message?: string;
    invoiceId?: string;
  };
}

interface ConfirmInvoiceData {
  creditCardId: string;
  invoiceData: InvoicePreviewData['invoice'];
  customMonth?: number;
  customYear?: number;
}

export class InvoiceService {
  /**
   * Analisa arquivo da fatura (PDF, Excel ou CSV) e retorna preview sem salvar no banco
   */
  async previewInvoice(
    fileBuffer: Buffer,
    userId: string,
    mimeType: string = 'application/pdf',
    fileName: string = 'invoice.pdf'
  ): Promise<InvoicePreviewData> {
    try {
      // Tentar usar OpenAI primeiro (mais rápido e preciso)
      // Se falhar, usar Claude como fallback
      let analysisResult;
      if (mimeType === 'application/pdf') {
        try {
          // Verificar se OpenAI está configurado
          if (openaiService.isConfigured()) {
            console.log('🚀 Tentando análise com OpenAI GPT-4...');
            analysisResult = await openaiService.analyzeInvoicePDF(fileBuffer, userId);
          } else {
            throw new Error('OpenAI não configurado');
          }
        } catch (error: any) {
          console.log('⚠️ OpenAI falhou, usando Claude como fallback:', error.message);
          analysisResult = await claudeService.analyzeInvoicePDF(fileBuffer, userId);
        }
      } else {
        // Para Excel/CSV, usar Claude
        throw new Error('Por favor, use um arquivo PDF. Suporte para Excel/CSV em breve.');
      }

      // Para cada cartão, verificar se já existe fatura importada
      const duplicateChecks = await Promise.all(
        analysisResult.invoice.cards.map(async card => {
          // Tentar encontrar cartão do usuário pelos últimos 4 dígitos
          const creditCard = await prisma.creditCard.findFirst({
            where: {
              userId,
              cardNumberLast4: card.last4Digits,
            },
          });

          if (!creditCard) {
            return null;
          }

          // Extrair mês/ano da data de fechamento
          const closingDate = new Date(analysisResult.invoice.closingDate);
          const month = closingDate.getMonth() + 1;
          const year = closingDate.getFullYear();

          // Verificar se já existe invoice para este cartão/período
          const existingInvoice = await prisma.invoice.findFirst({
            where: {
              userId,
              creditCardId: creditCard.id,
              statementMonth: month,
              statementYear: year,
            },
          });

          return existingInvoice
            ? {
                card: card.last4Digits,
                invoiceId: existingInvoice.id,
                month,
                year,
              }
            : null;
        })
      );

      const duplicates = duplicateChecks.filter(Boolean);

      const result: InvoicePreviewData = {
        ...analysisResult,
        duplicateWarning: duplicates.length > 0
          ? {
              exists: true,
              message: `Já existe fatura importada para o(s) cartão(ões): ${duplicates.map(d => `final ${d!.card} (${d!.month}/${d!.year})`).join(', ')}`,
              invoiceId: duplicates[0]!.invoiceId,
            }
          : { exists: false },
      };

      return result;
    } catch (error: any) {
      console.error('Erro ao gerar preview da fatura:', error);
      throw error;
    }
  }

  /**
   * Salva fatura e transações no banco de dados após confirmação do usuário
   */
  async confirmInvoice(userId: string, data: ConfirmInvoiceData): Promise<{ success: boolean; invoiceId: string; transactionsCount: number }> {
    try {
      // Buscar ou criar cartão de crédito
      const { creditCardId, invoiceData } = data;

      // Verificar se o cartão pertence ao usuário
      const creditCard = await prisma.creditCard.findFirst({
        where: {
          id: creditCardId,
          userId,
        },
      });

      if (!creditCard) {
        throw new Error('Cartão de crédito não encontrado ou não pertence ao usuário');
      }

      // Extrair mês/ano da data de fechamento
      const closingDate = new Date(invoiceData.closingDate);
      const month = closingDate.getMonth() + 1;
      const year = closingDate.getFullYear();

      // Verificar duplicata novamente
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          userId,
          creditCardId,
          statementMonth: month,
          statementYear: year,
        },
      });

      if (existingInvoice) {
        throw new Error(`Fatura já importada para ${month}/${year}`);
      }

      // Buscar mapeamento de categorias por nome
      const allTransactions = invoiceData.cards.flatMap(card => [
        ...card.transactions,
        ...card.internationalTransactions,
      ]);

      const uniqueCategoryNames = [...new Set(allTransactions.map(t => t.category))];

      const categories = await prisma.category.findMany({
        where: {
          OR: [{ userId }, { isDefault: true }],
          name: { in: uniqueCategoryNames },
        },
      });

      const categoryMap = new Map(categories.map(c => [c.name, c.id]));

      // Criar invoice e transações em uma transação do banco
      const result = await prisma.$transaction(async tx => {
        // Criar invoice
        const invoice = await tx.invoice.create({
          data: {
            userId,
            creditCardId,
            statementMonth: month,
            statementYear: year,
            closingDate: new Date(invoiceData.closingDate),
            dueDate: new Date(invoiceData.dueDate),
            totalAmount: new Prisma.Decimal(invoiceData.totalAmount),
          },
        });

        // Criar transações
        const transactions = allTransactions.map(t => {
          const categoryId = categoryMap.get(t.category);
          if (!categoryId) {
            throw new Error(`Categoria "${t.category}" não encontrada`);
          }

          // Se customMonth e customYear foram fornecidos, usar data customizada
          let transactionDate: Date;
          if (data.customMonth && data.customYear) {
            // Manter o dia da transação original, mas usar mês/ano customizado
            const originalDate = new Date(t.date);
            const day = originalDate.getDate();
            transactionDate = new Date(data.customYear, data.customMonth - 1, day);
          } else {
            transactionDate = new Date(t.date);
          }

          return {
            invoiceId: invoice.id,
            creditCardId,
            categoryId,
            description: t.description,
            amount: new Prisma.Decimal(t.amount),
            date: transactionDate,
            type: 'EXPENSE' as const,
            isPaid: false, // Fatura ainda não paga
            installments: t.installments,
            installmentNum: 1, // Primeira parcela (se parcelado)
            isInternational: t.isInternational,
          };
        });

        await tx.transaction.createMany({
          data: transactions,
        });

        return {
          invoiceId: invoice.id,
          transactionsCount: transactions.length,
        };
      });

      return {
        success: true,
        ...result,
      };
    } catch (error: any) {
      console.error('Erro ao confirmar fatura:', error);
      throw error;
    }
  }

  /**
   * Busca histórico de faturas importadas
   */
  async getHistory(userId: string) {
    const invoices = await prisma.invoice.findMany({
      where: { userId },
      include: {
        creditCard: {
          select: {
            name: true,
            cardNumberLast4: true,
          },
        },
        _count: {
          select: {
            transactions: true,
          },
        },
      },
      orderBy: {
        importedAt: 'desc',
      },
    });

    return invoices.map(inv => ({
      id: inv.id,
      creditCard: {
        name: inv.creditCard.name,
        last4: inv.creditCard.cardNumberLast4,
      },
      period: `${inv.statementMonth.toString().padStart(2, '0')}/${inv.statementYear}`,
      totalAmount: Number(inv.totalAmount),
      transactionsCount: inv._count.transactions,
      importedAt: inv.importedAt,
      dueDate: inv.dueDate,
    }));
  }

  /**
   * Busca detalhes de uma fatura específica
   */
  async getInvoiceDetails(invoiceId: string, userId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
      include: {
        creditCard: true,
        transactions: {
          include: {
            category: true,
          },
          orderBy: {
            date: 'asc',
          },
        },
      },
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada');
    }

    return invoice;
  }

  /**
   * Deleta uma fatura e todas as suas transações
   */
  async deleteInvoice(invoiceId: string, userId: string) {
    // Verificar se a fatura pertence ao usuário
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      throw new Error('Fatura não encontrada ou não pertence ao usuário');
    }

    // Deletar fatura (as transações serão deletadas automaticamente via CASCADE)
    await prisma.invoice.delete({
      where: {
        id: invoiceId,
      },
    });

    return { success: true, message: 'Fatura deletada com sucesso' };
  }
}

export const invoiceService = new InvoiceService();
