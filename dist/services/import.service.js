"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportService = void 0;
const database_1 = __importDefault(require("../config/database"));
const csv_parser_1 = __importDefault(require("csv-parser"));
const XLSX = __importStar(require("xlsx"));
const stream_1 = require("stream");
const ai_service_1 = require("./ai.service");
class ImportService {
    async importFromCSV(userId, accountId, categoryId, fileBuffer, filename) {
        const rows = [];
        const errors = [];
        // Criar registro de importação
        const importRecord = await database_1.default.import.create({
            data: {
                userId,
                filename,
                status: 'PROCESSING',
            },
        });
        try {
            // Parse CSV
            await new Promise((resolve, reject) => {
                const stream = stream_1.Readable.from(fileBuffer.toString());
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => {
                    try {
                        const parsedRow = this.parseRow(row);
                        rows.push(parsedRow);
                    }
                    catch (err) {
                        errors.push(`Erro ao processar linha: ${err}`);
                    }
                })
                    .on('end', resolve)
                    .on('error', reject);
            });
            // Importar transações
            const result = await this.importTransactions(userId, accountId, categoryId, rows, errors);
            // Atualizar status
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'COMPLETED',
                    rowsImported: result.success,
                    processedAt: new Date(),
                },
            });
            return result;
        }
        catch (err) {
            // Atualizar com erro
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'FAILED',
                    errorMessage: err.message,
                    processedAt: new Date(),
                },
            });
            throw err;
        }
    }
    async importFromXLSX(userId, accountId, categoryId, fileBuffer, filename) {
        const errors = [];
        // Criar registro de importação
        const importRecord = await database_1.default.import.create({
            data: {
                userId,
                filename,
                status: 'PROCESSING',
            },
        });
        try {
            // Parse XLSX
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            const rows = [];
            data.forEach((row) => {
                try {
                    const parsedRow = this.parseRow(row);
                    rows.push(parsedRow);
                }
                catch (err) {
                    errors.push(`Erro ao processar linha: ${err}`);
                }
            });
            // Importar transações
            const result = await this.importTransactions(userId, accountId, categoryId, rows, errors);
            // Atualizar status
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'COMPLETED',
                    rowsImported: result.success,
                    processedAt: new Date(),
                },
            });
            return result;
        }
        catch (err) {
            // Atualizar com erro
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'FAILED',
                    errorMessage: err.message,
                    processedAt: new Date(),
                },
            });
            throw err;
        }
    }
    parseRow(row) {
        // Tentar identificar campos comuns
        const date = row.date || row.Data || row.DATE || row.data;
        const description = row.description || row.Descrição || row.Descricao || row.DESCRIPTION || row.descricao;
        const amount = row.amount || row.Valor || row.valor || row.AMOUNT;
        const type = row.type || row.Tipo || row.tipo || row.TYPE;
        if (!date || !description || !amount) {
            throw new Error('Campos obrigatórios faltando (date, description, amount)');
        }
        return {
            date: this.parseDate(date),
            description: String(description),
            amount: Math.abs(parseFloat(String(amount).replace(',', '.'))),
            type: this.parseType(type, amount),
        };
    }
    parseRowWithMapping(row, mapping) {
        const date = row[mapping.dateColumn];
        const description = row[mapping.descriptionColumn];
        const amount = row[mapping.amountColumn];
        const type = mapping.typeColumn ? row[mapping.typeColumn] : null;
        if (!date || !description || amount === undefined || amount === null) {
            throw new Error(`Campos obrigatórios faltando (date, description, amount). Valores encontrados: date=${date}, description=${description}, amount=${amount}`);
        }
        return {
            date: this.parseDate(date),
            description: String(description),
            amount: Math.abs(parseFloat(String(amount).replace(',', '.'))),
            type: this.parseType(type, amount),
        };
    }
    parseDate(dateValue) {
        // Tentar diferentes formatos de data
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }
        catch (err) {
            // Tentar formato dd/mm/yyyy
            const parts = String(dateValue).split('/');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                const date = new Date(`${year}-${month}-${day}`);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
            }
        }
        throw new Error(`Formato de data inválido: ${dateValue}`);
    }
    parseType(typeValue, amount) {
        if (typeValue) {
            const typeStr = String(typeValue).toLowerCase();
            if (typeStr.includes('receita') || typeStr.includes('income') || typeStr.includes('entrada')) {
                return 'INCOME';
            }
            if (typeStr.includes('despesa') || typeStr.includes('expense') || typeStr.includes('saida')) {
                return 'EXPENSE';
            }
        }
        // Se não tiver tipo, usar o sinal do valor
        const numAmount = parseFloat(String(amount).replace(',', '.'));
        return numAmount >= 0 ? 'EXPENSE' : 'INCOME';
    }
    async importTransactions(userId, accountId, categoryId, rows, errors) {
        let success = 0;
        let failed = 0;
        // Verificar se conta pertence ao usuário
        const account = await database_1.default.account.findFirst({
            where: { id: accountId, userId },
        });
        if (!account) {
            throw new Error('Conta não encontrada');
        }
        // Verificar se categoria existe
        const category = await database_1.default.category.findFirst({
            where: {
                id: categoryId,
                OR: [{ userId }, { isDefault: true }],
            },
        });
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        for (const row of rows) {
            try {
                await database_1.default.$transaction(async (tx) => {
                    // Criar transação
                    await tx.transaction.create({
                        data: {
                            accountId,
                            categoryId,
                            description: row.description,
                            amount: row.amount,
                            date: new Date(row.date),
                            type: row.type || 'EXPENSE',
                            isPaid: true,
                        },
                    });
                    // Atualizar saldo
                    const balanceChange = (row.type || 'EXPENSE') === 'INCOME' ? row.amount : -row.amount;
                    await tx.account.update({
                        where: { id: accountId },
                        data: {
                            balance: {
                                increment: balanceChange,
                            },
                        },
                    });
                });
                success++;
            }
            catch (err) {
                failed++;
                errors.push(`Erro ao importar "${row.description}": ${err.message}`);
            }
        }
        return { success, failed, errors };
    }
    async getImportHistory(userId) {
        const imports = await database_1.default.import.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return imports;
    }
    /**
     * Preview de importação CSV com IA (não salva no banco)
     */
    async previewFromCSV(userId, accountId, creditCardId, fileBuffer, filename) {
        const errors = [];
        const allRows = [];
        try {
            // Parse CSV - coletar todas as linhas
            await new Promise((resolve, reject) => {
                const stream = stream_1.Readable.from(fileBuffer.toString());
                stream
                    .pipe((0, csv_parser_1.default)())
                    .on('data', (row) => {
                    allRows.push(row);
                })
                    .on('end', resolve)
                    .on('error', reject);
            });
            if (allRows.length === 0) {
                throw new Error('Arquivo vazio ou sem dados válidos');
            }
            // Verificar se conta ou cartão pertence ao usuário
            if (accountId) {
                const account = await database_1.default.account.findFirst({
                    where: { id: accountId, userId },
                });
                if (!account) {
                    throw new Error('Conta não encontrada');
                }
            }
            else if (creditCardId) {
                const creditCard = await database_1.default.creditCard.findFirst({
                    where: { id: creditCardId, userId },
                });
                if (!creditCard) {
                    throw new Error('Cartão de crédito não encontrado');
                }
            }
            // Processar com IA diretamente
            if (ai_service_1.AIService.isConfigured()) {
                try {
                    const aiService = new ai_service_1.AIService();
                    console.log(`Processando ${allRows.length} linhas com IA...`);
                    // IA processa dados brutos diretamente
                    const transactions = await aiService.processRawFileData(userId, allRows);
                    return {
                        transactions,
                        totalCount: transactions.length,
                        errors: transactions.length === 0 ? ['Nenhuma transação válida encontrada no arquivo'] : errors,
                    };
                }
                catch (aiError) {
                    console.error('Erro ao processar com IA:', aiError);
                    throw new Error(`Erro ao processar arquivo: ${aiError.message}`);
                }
            }
            else {
                throw new Error('IA não configurada. Configure OPENAI_API_KEY no arquivo .env');
            }
        }
        catch (err) {
            throw new Error(`Erro ao processar CSV: ${err.message}`);
        }
    }
    /**
     * Preview de importação XLSX com IA (não salva no banco)
     */
    async previewFromXLSX(userId, accountId, creditCardId, fileBuffer, filename) {
        const errors = [];
        try {
            // Parse XLSX
            const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(worksheet);
            if (data.length === 0) {
                throw new Error('Arquivo vazio ou sem dados válidos');
            }
            // Verificar se conta ou cartão pertence ao usuário
            if (accountId) {
                const account = await database_1.default.account.findFirst({
                    where: { id: accountId, userId },
                });
                if (!account) {
                    throw new Error('Conta não encontrada');
                }
            }
            else if (creditCardId) {
                const creditCard = await database_1.default.creditCard.findFirst({
                    where: { id: creditCardId, userId },
                });
                if (!creditCard) {
                    throw new Error('Cartão de crédito não encontrado');
                }
            }
            // Processar com IA diretamente
            if (ai_service_1.AIService.isConfigured()) {
                try {
                    const aiService = new ai_service_1.AIService();
                    console.log(`Processando ${data.length} linhas com IA...`);
                    // IA processa dados brutos diretamente
                    const transactions = await aiService.processRawFileData(userId, data);
                    return {
                        transactions,
                        totalCount: transactions.length,
                        errors: transactions.length === 0 ? ['Nenhuma transação válida encontrada no arquivo'] : errors,
                    };
                }
                catch (aiError) {
                    console.error('Erro ao processar com IA:', aiError);
                    throw new Error(`Erro ao processar arquivo: ${aiError.message}`);
                }
            }
            else {
                throw new Error('IA não configurada. Configure OPENAI_API_KEY no arquivo .env');
            }
        }
        catch (err) {
            throw new Error(`Erro ao processar XLSX: ${err.message}`);
        }
    }
    /**
     * Gera preview com categorização por IA
     */
    async generatePreview(userId, accountId, rows, errors) {
        // Verificar se conta pertence ao usuário
        const account = await database_1.default.account.findFirst({
            where: { id: accountId, userId },
        });
        if (!account) {
            throw new Error('Conta não encontrada');
        }
        if (rows.length === 0) {
            return {
                transactions: [],
                totalCount: 0,
                errors: errors.length > 0 ? errors : ['Nenhuma transação válida encontrada'],
            };
        }
        // Usar IA para categorizar se disponível
        let categorizedTransactions;
        if (ai_service_1.AIService.isConfigured()) {
            const aiService = new ai_service_1.AIService();
            categorizedTransactions = await aiService.categorizeTransactions(userId, rows);
        }
        else {
            // Fallback: usar categoria padrão
            const defaultCategory = await database_1.default.category.findFirst({
                where: {
                    OR: [{ userId }, { isDefault: true }],
                    type: 'EXPENSE',
                },
            });
            categorizedTransactions = rows.map((row) => ({
                ...row,
                type: row.type || 'EXPENSE',
                suggestedCategoryId: defaultCategory?.id || '',
                suggestedCategoryName: defaultCategory?.name || 'Outros',
                confidence: 'low',
            }));
        }
        return {
            transactions: categorizedTransactions,
            totalCount: categorizedTransactions.length,
            errors,
        };
    }
    /**
     * Confirma e salva as transações após revisão
     */
    async confirmImport(userId, accountId, creditCardId, transactions, filename) {
        const errors = [];
        // Criar registro de importação
        const importRecord = await database_1.default.import.create({
            data: {
                userId,
                filename,
                status: 'PROCESSING',
            },
        });
        try {
            // Verificar se conta ou cartão pertence ao usuário
            if (accountId) {
                const account = await database_1.default.account.findFirst({
                    where: { id: accountId, userId },
                });
                if (!account) {
                    throw new Error('Conta não encontrada');
                }
            }
            else if (creditCardId) {
                const creditCard = await database_1.default.creditCard.findFirst({
                    where: { id: creditCardId, userId },
                });
                if (!creditCard) {
                    throw new Error('Cartão de crédito não encontrado');
                }
            }
            let success = 0;
            let failed = 0;
            // Importar cada transação
            for (const transaction of transactions) {
                try {
                    // Verificar se categoria existe
                    const category = await database_1.default.category.findFirst({
                        where: {
                            id: transaction.categoryId,
                            OR: [{ userId }, { isDefault: true }],
                        },
                    });
                    if (!category) {
                        throw new Error('Categoria inválida');
                    }
                    await database_1.default.$transaction(async (tx) => {
                        // Criar transação
                        await tx.transaction.create({
                            data: {
                                accountId,
                                creditCardId,
                                categoryId: transaction.categoryId,
                                description: transaction.description,
                                amount: transaction.amount,
                                date: new Date(transaction.date),
                                type: transaction.type,
                                isPaid: true,
                            },
                        });
                        // Atualizar saldo apenas se for conta (não cartão)
                        if (accountId) {
                            const balanceChange = transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;
                            await tx.account.update({
                                where: { id: accountId },
                                data: {
                                    balance: {
                                        increment: balanceChange,
                                    },
                                },
                            });
                        }
                    });
                    success++;
                }
                catch (err) {
                    failed++;
                    errors.push(`Erro ao importar "${transaction.description}": ${err.message}`);
                }
            }
            // Atualizar status
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'COMPLETED',
                    rowsImported: success,
                    processedAt: new Date(),
                },
            });
            return { success, failed, errors };
        }
        catch (err) {
            // Atualizar com erro
            await database_1.default.import.update({
                where: { id: importRecord.id },
                data: {
                    status: 'FAILED',
                    errorMessage: err.message,
                    processedAt: new Date(),
                },
            });
            throw err;
        }
    }
}
exports.ImportService = ImportService;
//# sourceMappingURL=import.service.js.map