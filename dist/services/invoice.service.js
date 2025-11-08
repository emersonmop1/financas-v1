"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.invoiceService = exports.InvoiceService = void 0;
const database_1 = __importDefault(require("../config/database"));
const claude_service_1 = require("./claude.service");
const client_1 = require("@prisma/client");
class InvoiceService {
    /**
     * Analisa PDF da fatura e retorna preview sem salvar no banco
     */
    async previewInvoice(pdfBuffer, userId) {
        try {
            // Analisar com Claude
            const analysisResult = await claude_service_1.claudeService.analyzeInvoicePDF(pdfBuffer, userId);
            // Para cada cartão, verificar se já existe fatura importada
            const duplicateChecks = await Promise.all(analysisResult.invoice.cards.map(async (card) => {
                // Tentar encontrar cartão do usuário pelos últimos 4 dígitos
                const creditCard = await database_1.default.creditCard.findFirst({
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
                const existingInvoice = await database_1.default.invoice.findFirst({
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
            }));
            const duplicates = duplicateChecks.filter(Boolean);
            const result = {
                ...analysisResult,
                duplicateWarning: duplicates.length > 0
                    ? {
                        exists: true,
                        message: `Já existe fatura importada para o(s) cartão(ões): ${duplicates.map(d => `final ${d.card} (${d.month}/${d.year})`).join(', ')}`,
                        invoiceId: duplicates[0].invoiceId,
                    }
                    : { exists: false },
            };
            return result;
        }
        catch (error) {
            console.error('Erro ao gerar preview da fatura:', error);
            throw error;
        }
    }
    /**
     * Salva fatura e transações no banco de dados após confirmação do usuário
     */
    async confirmInvoice(userId, data) {
        try {
            // Buscar ou criar cartão de crédito
            const { creditCardId, invoiceData } = data;
            // Verificar se o cartão pertence ao usuário
            const creditCard = await database_1.default.creditCard.findFirst({
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
            const existingInvoice = await database_1.default.invoice.findFirst({
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
            const categories = await database_1.default.category.findMany({
                where: {
                    OR: [{ userId }, { isDefault: true }],
                    name: { in: uniqueCategoryNames },
                },
            });
            const categoryMap = new Map(categories.map(c => [c.name, c.id]));
            // Criar invoice e transações em uma transação do banco
            const result = await database_1.default.$transaction(async (tx) => {
                // Criar invoice
                const invoice = await tx.invoice.create({
                    data: {
                        userId,
                        creditCardId,
                        statementMonth: month,
                        statementYear: year,
                        closingDate: new Date(invoiceData.closingDate),
                        dueDate: new Date(invoiceData.dueDate),
                        totalAmount: new client_1.Prisma.Decimal(invoiceData.totalAmount),
                    },
                });
                // Criar transações
                const transactions = allTransactions.map(t => {
                    const categoryId = categoryMap.get(t.category);
                    if (!categoryId) {
                        throw new Error(`Categoria "${t.category}" não encontrada`);
                    }
                    return {
                        invoiceId: invoice.id,
                        creditCardId,
                        categoryId,
                        description: t.description,
                        amount: new client_1.Prisma.Decimal(t.amount),
                        date: new Date(t.date),
                        type: 'EXPENSE',
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
        }
        catch (error) {
            console.error('Erro ao confirmar fatura:', error);
            throw error;
        }
    }
    /**
     * Busca histórico de faturas importadas
     */
    async getHistory(userId) {
        const invoices = await database_1.default.invoice.findMany({
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
    async getInvoiceDetails(invoiceId, userId) {
        const invoice = await database_1.default.invoice.findFirst({
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
}
exports.InvoiceService = InvoiceService;
exports.invoiceService = new InvoiceService();
//# sourceMappingURL=invoice.service.js.map