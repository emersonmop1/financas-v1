interface Transaction {
    date: string;
    description: string;
    amount: number;
    category: string;
    type: 'INCOME' | 'EXPENSE';
}
interface AnalysisResult {
    transactions: Transaction[];
    summary: {
        total: number;
        count: number;
        byCategory: Record<string, number>;
    };
}
export declare class GPTService {
    /**
     * Analisa fatura de cartão de crédito usando GPT-4o
     */
    analyzeCreditCardStatement(pdfBuffer: Buffer): Promise<AnalysisResult>;
    /**
     * Valida se a API Key do GPT está configurada
     */
    static isConfigured(): boolean;
}
export declare const gptService: GPTService;
export {};
//# sourceMappingURL=gpt.service.d.ts.map