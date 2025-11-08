interface ImportResult {
    success: number;
    failed: number;
    errors: string[];
}
interface PreviewTransaction {
    date: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    suggestedCategoryId: string;
    suggestedCategoryName: string;
    confidence: 'high' | 'medium' | 'low';
}
interface PreviewResult {
    transactions: PreviewTransaction[];
    totalCount: number;
    errors: string[];
}
export declare class ImportService {
    importFromCSV(userId: string, accountId: string, categoryId: string, fileBuffer: Buffer, filename: string): Promise<ImportResult>;
    importFromXLSX(userId: string, accountId: string, categoryId: string, fileBuffer: Buffer, filename: string): Promise<ImportResult>;
    private parseRow;
    private parseRowWithMapping;
    private parseDate;
    private parseType;
    private importTransactions;
    getImportHistory(userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.ImportStatus;
        filename: string;
        rowsImported: number;
        errorMessage: string | null;
        processedAt: Date | null;
    }[]>;
    /**
     * Preview de importação CSV com IA (não salva no banco)
     */
    previewFromCSV(userId: string, accountId: string | undefined, creditCardId: string | undefined, fileBuffer: Buffer, filename: string): Promise<PreviewResult>;
    /**
     * Preview de importação XLSX com IA (não salva no banco)
     */
    previewFromXLSX(userId: string, accountId: string | undefined, creditCardId: string | undefined, fileBuffer: Buffer, filename: string): Promise<PreviewResult>;
    /**
     * Gera preview com categorização por IA
     */
    private generatePreview;
    /**
     * Confirma e salva as transações após revisão
     */
    confirmImport(userId: string, accountId: string | undefined, creditCardId: string | undefined, transactions: Array<{
        date: string;
        description: string;
        amount: number;
        type: 'INCOME' | 'EXPENSE';
        categoryId: string;
    }>, filename: string): Promise<ImportResult>;
}
export {};
//# sourceMappingURL=import.service.d.ts.map