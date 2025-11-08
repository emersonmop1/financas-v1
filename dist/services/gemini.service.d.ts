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
export declare class GeminiService {
    /**
     * Analisa fatura de cartão de crédito usando Gemini 1.5 Flash
     */
    analyzeCreditCardStatement(pdfBuffer: Buffer): Promise<AnalysisResult>;
    /**
     * Valida se a API Key do Gemini está configurada
     */
    static isConfigured(): boolean;
}
export declare const geminiService: GeminiService;
export {};
//# sourceMappingURL=gemini.service.d.ts.map