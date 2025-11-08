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
}
export declare class InvoiceService {
    /**
     * Analisa PDF da fatura e retorna preview sem salvar no banco
     */
    previewInvoice(pdfBuffer: Buffer, userId: string): Promise<InvoicePreviewData>;
    /**
     * Salva fatura e transações no banco de dados após confirmação do usuário
     */
    confirmInvoice(userId: string, data: ConfirmInvoiceData): Promise<{
        success: boolean;
        invoiceId: string;
        transactionsCount: number;
    }>;
    /**
     * Busca histórico de faturas importadas
     */
    getHistory(userId: string): Promise<{
        id: string;
        creditCard: {
            name: string;
            last4: string | null;
        };
        period: string;
        totalAmount: number;
        transactionsCount: number;
        importedAt: Date;
        dueDate: Date;
    }[]>;
    /**
     * Busca detalhes de uma fatura específica
     */
    getInvoiceDetails(invoiceId: string, userId: string): Promise<{
        transactions: ({
            category: {
                id: string;
                name: string;
                createdAt: Date;
                userId: string | null;
                type: import(".prisma/client").$Enums.CategoryType;
                color: string;
                icon: string;
                isDefault: boolean;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            type: import(".prisma/client").$Enums.TransactionType;
            date: Date;
            description: string;
            amount: Prisma.Decimal;
            isPaid: boolean;
            installments: number | null;
            installmentNum: number | null;
            isInternational: boolean;
            originalCurrency: string | null;
            originalAmount: Prisma.Decimal | null;
            notes: string | null;
            accountId: string | null;
            categoryId: string;
            creditCardId: string | null;
            invoiceId: string | null;
        })[];
        creditCard: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            limit: Prisma.Decimal;
            closingDay: number;
            dueDay: number;
            cardNumberLast4: string | null;
            cardholderName: string | null;
            cardBrand: string | null;
            isActive: boolean;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        creditCardId: string;
        statementMonth: number;
        statementYear: number;
        closingDate: Date;
        dueDate: Date;
        totalAmount: Prisma.Decimal;
        importedAt: Date;
    }>;
}
export declare const invoiceService: InvoiceService;
export {};
//# sourceMappingURL=invoice.service.d.ts.map