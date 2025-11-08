interface Transaction {
    date: string;
    description: string;
    amount: number;
    type?: 'INCOME' | 'EXPENSE';
}
interface CategorizedTransaction extends Transaction {
    suggestedCategoryId: string;
    suggestedCategoryName: string;
    confidence: 'high' | 'medium' | 'low';
}
export declare class AIService {
    /**
     * Processa arquivo bruto diretamente e extrai transações
     * Não depende de colunas específicas - a IA identifica tudo
     */
    processRawFileData(userId: string, rawData: any[]): Promise<CategorizedTransaction[]>;
    /**
     * Processa um lote de dados brutos
     */
    private processRawBatch;
    /**
     * Constrói prompt para processamento de dados brutos
     */
    private buildRawDataPrompt;
    /**
     * Parseia resposta da IA de dados brutos
     */
    private parseRawAIResponse;
    /**
     * Categoriza transações usando GPT-4 (método antigo mantido para compatibilidade)
     */
    categorizeTransactions(userId: string, transactions: Transaction[]): Promise<CategorizedTransaction[]>;
    /**
     * Categoriza um lote de transações
     */
    private categorizeBatch;
    /**
     * Constrói o prompt para o GPT
     */
    private buildPrompt;
    /**
     * Parseia a resposta da IA e mescla com transações originais
     */
    private parseAIResponse;
    /**
     * Categorização fallback em caso de erro
     */
    private getFallbackCategories;
    /**
     * Valida se a API Key está configurada
     */
    static isConfigured(): boolean;
}
export {};
//# sourceMappingURL=ai.service.d.ts.map