import { Response } from 'express';
import { BankStatementService } from '../services/bankStatement.service';
import { AuthRequest } from '../types';

const bankStatementService = new BankStatementService();

export class BankStatementController {
  async preview(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { content, format } = req.body;

      if (!content || !format) {
        return res.status(400).json({
          error: 'Conteúdo e formato são obrigatórios',
        });
      }

      if (!['OFX', 'CSV'].includes(format)) {
        return res.status(400).json({
          error: 'Formato deve ser OFX ou CSV',
        });
      }

      const transactions = bankStatementService.previewTransactions(
        content,
        format as 'OFX' | 'CSV'
      );

      return res.json({
        count: transactions.length,
        transactions,
      });
    } catch (error) {
      console.error('Error in preview:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async import(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { content, format, accountId, categoryId } = req.body;

      if (!content || !format || !accountId || !categoryId) {
        return res.status(400).json({
          error: 'Conteúdo, formato, conta e categoria são obrigatórios',
        });
      }

      if (!['OFX', 'CSV'].includes(format)) {
        return res.status(400).json({
          error: 'Formato deve ser OFX ou CSV',
        });
      }

      // Parse das transações
      const transactions = bankStatementService.previewTransactions(
        content,
        format as 'OFX' | 'CSV'
      );

      // Importar transações
      const result = await bankStatementService.importTransactions(
        req.userId,
        accountId,
        transactions,
        categoryId
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in import:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getUnreconciled(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { accountId } = req.query;

      if (!accountId) {
        return res.status(400).json({
          error: 'ID da conta é obrigatório',
        });
      }

      const transactions = await bankStatementService.getUnreconciledTransactions(
        req.userId,
        accountId as string
      );

      return res.json(transactions);
    } catch (error) {
      console.error('Error in getUnreconciled:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async reconcile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { transactionIds } = req.body;

      if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
        return res.status(400).json({
          error: 'IDs das transações são obrigatórios',
        });
      }

      const result = await bankStatementService.reconcileTransactions(
        req.userId,
        transactionIds
      );

      return res.json(result);
    } catch (error) {
      console.error('Error in reconcile:', error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
