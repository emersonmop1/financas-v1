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
export declare class ClaudeService {
    /**
     * Analisa fatura de cartão de crédito usando Claude Sonnet 4.5
     * Extrai todas as informações: cartões, transações, valores, categorias
     */
    analyzeInvoicePDF(pdfBuffer: Buffer, userId: string): Promise<InvoiceAnalysisResult>;
    /**
     * Valida se a API Key do Claude está configurada
     */
    static isConfigured(): boolean;
}
export declare const claudeService: ClaudeService;
export {};
//# sourceMappingURL=claude.service.d.ts.map