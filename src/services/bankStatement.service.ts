import prisma from '../config/database';
import { TransactionType } from '@prisma/client';

interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  bankReference?: string;
}

interface ImportResult {
  imported: number;
  duplicates: number;
  errors: string[];
  transactions: ParsedTransaction[];
}

export class BankStatementService {
  /**
   * Parseia arquivo OFX (Open Financial Exchange)
   */
  parseOFX(content: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];

    // Regex para encontrar transações no OFX
    const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = stmtTrnRegex.exec(content)) !== null) {
      const trnContent = match[1];

      // Extrair campos
      const trnType = this.extractOFXField(trnContent, 'TRNTYPE');
      const datePosted = this.extractOFXField(trnContent, 'DTPOSTED');
      const amount = this.extractOFXField(trnContent, 'TRNAMT');
      const fitId = this.extractOFXField(trnContent, 'FITID');
      const memo = this.extractOFXField(trnContent, 'MEMO') ||
                   this.extractOFXField(trnContent, 'NAME') ||
                   'Sem descrição';

      if (datePosted && amount) {
        // Parse da data OFX (formato: YYYYMMDDHHMMSS ou YYYYMMDD)
        const year = parseInt(datePosted.substring(0, 4));
        const month = parseInt(datePosted.substring(4, 6)) - 1;
        const day = parseInt(datePosted.substring(6, 8));
        const date = new Date(year, month, day);

        // Parse do valor
        const numAmount = parseFloat(amount.replace(',', '.'));

        transactions.push({
          date,
          description: memo.trim(),
          amount: Math.abs(numAmount),
          type: numAmount >= 0 ? 'INCOME' : 'EXPENSE',
          bankReference: fitId || undefined,
        });
      }
    }

    return transactions;
  }

  private extractOFXField(content: string, field: string): string | null {
    const regex = new RegExp(`<${field}>([^<\\r\\n]+)`, 'i');
    const match = content.match(regex);
    return match ? match[1].trim() : null;
  }

  /**
   * Parseia arquivo CSV de extrato
   * Formato esperado: Data,Descrição,Valor (ou Data;Descrição;Valor)
   */
  parseCSV(content: string, hasHeader: boolean = true): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    const lines = content.split('\n').filter(line => line.trim());

    // Detectar separador
    const separator = lines[0].includes(';') ? ';' : ',';

    // Pular header se necessário
    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV respeitando aspas
      const fields = this.parseCSVLine(line, separator);

      if (fields.length >= 3) {
        // Tentar diferentes formatos de data
        const date = this.parseDate(fields[0]);
        const description = fields[1].replace(/^["']|["']$/g, '').trim();
        const amount = parseFloat(
          fields[2]
            .replace(/[R$\s"']/g, '')
            .replace('.', '')
            .replace(',', '.')
        );

        if (date && !isNaN(amount) && description) {
          transactions.push({
            date,
            description,
            amount: Math.abs(amount),
            type: amount >= 0 ? 'INCOME' : 'EXPENSE',
          });
        }
      }
    }

    return transactions;
  }

  private parseCSVLine(line: string, separator: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === separator && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private parseDate(dateStr: string): Date | null {
    const cleaned = dateStr.replace(/["']/g, '').trim();

    // Formato DD/MM/YYYY ou DD-MM-YYYY
    let match = cleaned.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (match) {
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    }

    // Formato YYYY-MM-DD
    match = cleaned.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (match) {
      return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
    }

    return null;
  }

  /**
   * Importa transações parseadas para o banco
   */
  async importTransactions(
    userId: string,
    accountId: string,
    transactions: ParsedTransaction[],
    defaultCategoryId: string
  ): Promise<ImportResult> {
    const result: ImportResult = {
      imported: 0,
      duplicates: 0,
      errors: [],
      transactions: [],
    };

    // Verificar se a conta pertence ao usuário
    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      result.errors.push('Conta não encontrada');
      return result;
    }

    // Verificar se a categoria existe
    const category = await prisma.category.findFirst({
      where: {
        id: defaultCategoryId,
        OR: [{ userId }, { isDefault: true }],
      },
    });

    if (!category) {
      result.errors.push('Categoria padrão não encontrada');
      return result;
    }

    // Importar cada transação
    for (const trn of transactions) {
      try {
        // Verificar duplicata por bankReference
        if (trn.bankReference) {
          const existing = await prisma.transaction.findFirst({
            where: {
              accountId,
              bankReference: trn.bankReference,
            },
          });

          if (existing) {
            result.duplicates++;
            continue;
          }
        }

        // Criar transação
        await prisma.$transaction(async (tx) => {
          const transaction = await tx.transaction.create({
            data: {
              accountId,
              categoryId: defaultCategoryId,
              description: trn.description,
              amount: trn.amount,
              date: trn.date,
              type: trn.type,
              isPaid: true,
              isReconciled: false,
              bankReference: trn.bankReference,
              tags: ['importado'],
            },
          });

          // Atualizar saldo da conta
          const balanceChange = trn.type === 'INCOME' ? trn.amount : -trn.amount;
          await tx.account.update({
            where: { id: accountId },
            data: {
              balance: {
                increment: balanceChange,
              },
            },
          });

          result.imported++;
          result.transactions.push(trn);
        });
      } catch (error) {
        result.errors.push(`Erro ao importar: ${trn.description} - ${error}`);
      }
    }

    return result;
  }

  /**
   * Preview das transações antes de importar
   */
  previewTransactions(
    content: string,
    format: 'OFX' | 'CSV'
  ): ParsedTransaction[] {
    if (format === 'OFX') {
      return this.parseOFX(content);
    } else {
      return this.parseCSV(content);
    }
  }

  /**
   * Busca transações não conciliadas de uma conta
   */
  async getUnreconciledTransactions(userId: string, accountId: string) {
    return await prisma.transaction.findMany({
      where: {
        accountId,
        account: { userId },
        isReconciled: false,
      },
      include: {
        category: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Marca transações como conciliadas
   */
  async reconcileTransactions(userId: string, transactionIds: string[]) {
    // Verificar se todas pertencem ao usuário
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        OR: [
          { account: { userId } },
          { creditCard: { userId } },
        ],
      },
    });

    if (transactions.length !== transactionIds.length) {
      throw new Error('Algumas transações não foram encontradas');
    }

    // Marcar como conciliadas
    await prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
      },
      data: {
        isReconciled: true,
      },
    });

    return { count: transactionIds.length };
  }
}
