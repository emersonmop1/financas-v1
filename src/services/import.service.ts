import prisma from '../config/database';
import csvParser from 'csv-parser';
import * as XLSX from 'xlsx';
import { Readable } from 'stream';
import { TransactionType } from '@prisma/client';
import { AIService } from './ai.service';

interface ImportRow {
  date: string;
  description: string;
  amount: number;
  type?: 'INCOME' | 'EXPENSE';
}

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

export class ImportService {
  async importFromCSV(
    userId: string,
    accountId: string,
    categoryId: string,
    fileBuffer: Buffer,
    filename: string
  ): Promise<ImportResult> {
    const rows: ImportRow[] = [];
    const errors: string[] = [];

    // Criar registro de importação
    const importRecord = await prisma.import.create({
      data: {
        userId,
        filename,
        status: 'PROCESSING',
      },
    });

    try {
      // Parse CSV
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(fileBuffer.toString());

        stream
          .pipe(csvParser())
          .on('data', (row) => {
            try {
              const parsedRow = this.parseRow(row);
              rows.push(parsedRow);
            } catch (err) {
              errors.push(`Erro ao processar linha: ${err}`);
            }
          })
          .on('end', resolve)
          .on('error', reject);
      });

      // Importar transações
      const result = await this.importTransactions(
        userId,
        accountId,
        categoryId,
        rows,
        errors
      );

      // Atualizar status
      await prisma.import.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          rowsImported: result.success,
          processedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      // Atualizar com erro
      await prisma.import.update({
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

  async importFromXLSX(
    userId: string,
    accountId: string,
    categoryId: string,
    fileBuffer: Buffer,
    filename: string
  ): Promise<ImportResult> {
    const errors: string[] = [];

    // Criar registro de importação
    const importRecord = await prisma.import.create({
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

      const rows: ImportRow[] = [];

      data.forEach((row: any) => {
        try {
          const parsedRow = this.parseRow(row);
          rows.push(parsedRow);
        } catch (err) {
          errors.push(`Erro ao processar linha: ${err}`);
        }
      });

      // Importar transações
      const result = await this.importTransactions(
        userId,
        accountId,
        categoryId,
        rows,
        errors
      );

      // Atualizar status
      await prisma.import.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          rowsImported: result.success,
          processedAt: new Date(),
        },
      });

      return result;
    } catch (err: any) {
      // Atualizar com erro
      await prisma.import.update({
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

  private parseRow(row: any): ImportRow {
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

  private parseRowWithMapping(
    row: any,
    mapping: { dateColumn: string; descriptionColumn: string; amountColumn: string; typeColumn?: string }
  ): ImportRow {
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

  private parseDate(dateValue: any): string {
    // Tentar diferentes formatos de data
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (err) {
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

  private parseType(typeValue: any, amount: any): 'INCOME' | 'EXPENSE' {
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

  private async importTransactions(
    userId: string,
    accountId: string,
    categoryId: string,
    rows: ImportRow[],
    errors: string[]
  ): Promise<ImportResult> {
    let success = 0;
    let failed = 0;

    // Verificar se conta pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    // Verificar se categoria existe
    const category = await prisma.category.findFirst({
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
        await prisma.$transaction(async (tx) => {
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
          const balanceChange =
            (row.type || 'EXPENSE') === 'INCOME' ? row.amount : -row.amount;

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
      } catch (err: any) {
        failed++;
        errors.push(`Erro ao importar "${row.description}": ${err.message}`);
      }
    }

    return { success, failed, errors };
  }

  async getImportHistory(userId: string) {
    const imports = await prisma.import.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return imports;
  }

  /**
   * Preview de importação CSV com IA (não salva no banco)
   */
  async previewFromCSV(
    userId: string,
    accountId: string | undefined,
    creditCardId: string | undefined,
    fileBuffer: Buffer,
    filename: string
  ): Promise<PreviewResult> {
    const errors: string[] = [];
    const allRows: any[] = [];

    try {
      // Parse CSV - coletar todas as linhas
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(fileBuffer.toString());

        stream
          .pipe(csvParser())
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
        const account = await prisma.account.findFirst({
          where: { id: accountId, userId },
        });
        if (!account) {
          throw new Error('Conta não encontrada');
        }
      } else if (creditCardId) {
        const creditCard = await prisma.creditCard.findFirst({
          where: { id: creditCardId, userId },
        });
        if (!creditCard) {
          throw new Error('Cartão de crédito não encontrado');
        }
      }

      // Processar com IA diretamente
      if (AIService.isConfigured()) {
        try {
          const aiService = new AIService();

          console.log(`Processando ${allRows.length} linhas com IA...`);

          // IA processa dados brutos diretamente
          const transactions = await aiService.processRawFileData(userId, allRows);

          return {
            transactions,
            totalCount: transactions.length,
            errors: transactions.length === 0 ? ['Nenhuma transação válida encontrada no arquivo'] : errors,
          };
        } catch (aiError: any) {
          console.error('Erro ao processar com IA:', aiError);
          throw new Error(`Erro ao processar arquivo: ${aiError.message}`);
        }
      } else {
        throw new Error('IA não configurada. Configure OPENAI_API_KEY no arquivo .env');
      }
    } catch (err: any) {
      throw new Error(`Erro ao processar CSV: ${err.message}`);
    }
  }

  /**
   * Preview de importação XLSX com IA (não salva no banco)
   */
  async previewFromXLSX(
    userId: string,
    accountId: string | undefined,
    creditCardId: string | undefined,
    fileBuffer: Buffer,
    filename: string
  ): Promise<PreviewResult> {
    const errors: string[] = [];

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
        const account = await prisma.account.findFirst({
          where: { id: accountId, userId },
        });
        if (!account) {
          throw new Error('Conta não encontrada');
        }
      } else if (creditCardId) {
        const creditCard = await prisma.creditCard.findFirst({
          where: { id: creditCardId, userId },
        });
        if (!creditCard) {
          throw new Error('Cartão de crédito não encontrado');
        }
      }

      // Processar com IA diretamente
      if (AIService.isConfigured()) {
        try {
          const aiService = new AIService();

          console.log(`Processando ${data.length} linhas com IA...`);

          // IA processa dados brutos diretamente
          const transactions = await aiService.processRawFileData(userId, data);

          return {
            transactions,
            totalCount: transactions.length,
            errors: transactions.length === 0 ? ['Nenhuma transação válida encontrada no arquivo'] : errors,
          };
        } catch (aiError: any) {
          console.error('Erro ao processar com IA:', aiError);
          throw new Error(`Erro ao processar arquivo: ${aiError.message}`);
        }
      } else {
        throw new Error('IA não configurada. Configure OPENAI_API_KEY no arquivo .env');
      }
    } catch (err: any) {
      throw new Error(`Erro ao processar XLSX: ${err.message}`);
    }
  }

  /**
   * Gera preview com categorização por IA
   */
  private async generatePreview(
    userId: string,
    accountId: string,
    rows: ImportRow[],
    errors: string[]
  ): Promise<PreviewResult> {
    // Verificar se conta pertence ao usuário
    const account = await prisma.account.findFirst({
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
    let categorizedTransactions: PreviewTransaction[];

    if (AIService.isConfigured()) {
      const aiService = new AIService();
      categorizedTransactions = await aiService.categorizeTransactions(userId, rows);
    } else {
      // Fallback: usar categoria padrão
      const defaultCategory = await prisma.category.findFirst({
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
        confidence: 'low' as const,
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
  async confirmImport(
    userId: string,
    accountId: string | undefined,
    creditCardId: string | undefined,
    transactions: Array<{
      date: string;
      description: string;
      amount: number;
      type: 'INCOME' | 'EXPENSE';
      categoryId: string;
    }>,
    filename: string
  ): Promise<ImportResult> {
    const errors: string[] = [];

    // Criar registro de importação
    const importRecord = await prisma.import.create({
      data: {
        userId,
        filename,
        status: 'PROCESSING',
      },
    });

    try {
      // Verificar se conta ou cartão pertence ao usuário
      if (accountId) {
        const account = await prisma.account.findFirst({
          where: { id: accountId, userId },
        });
        if (!account) {
          throw new Error('Conta não encontrada');
        }
      } else if (creditCardId) {
        const creditCard = await prisma.creditCard.findFirst({
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
          const category = await prisma.category.findFirst({
            where: {
              id: transaction.categoryId,
              OR: [{ userId }, { isDefault: true }],
            },
          });

          if (!category) {
            throw new Error('Categoria inválida');
          }

          await prisma.$transaction(async (tx) => {
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
              const balanceChange =
                transaction.type === 'INCOME' ? transaction.amount : -transaction.amount;

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
        } catch (err: any) {
          failed++;
          errors.push(`Erro ao importar "${transaction.description}": ${err.message}`);
        }
      }

      // Atualizar status
      await prisma.import.update({
        where: { id: importRecord.id },
        data: {
          status: 'COMPLETED',
          rowsImported: success,
          processedAt: new Date(),
        },
      });

      return { success, failed, errors };
    } catch (err: any) {
      // Atualizar com erro
      await prisma.import.update({
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
