import { Response } from 'express';
import { ImportService } from '../services/import.service';
import { AuthRequest } from '../types';

const importService = new ImportService();

export class ImportController {
  async uploadFile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const { accountId, categoryId } = req.body;

      if (!accountId || !categoryId) {
        return res.status(400).json({ error: 'Conta e categoria são obrigatórias' });
      }

      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

      let result;

      if (fileExtension === 'csv') {
        result = await importService.importFromCSV(
          req.userId,
          accountId,
          categoryId,
          req.file.buffer,
          req.file.originalname
        );
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        result = await importService.importFromXLSX(
          req.userId,
          accountId,
          categoryId,
          req.file.buffer,
          req.file.originalname
        );
      } else {
        return res.status(400).json({
          error: 'Formato de arquivo não suportado. Use CSV ou XLSX',
        });
      }

      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const history = await importService.getImportHistory(req.userId);
      return res.json(history);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async previewFile(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const { accountId, creditCardId } = req.body;

      if (!accountId && !creditCardId) {
        return res.status(400).json({ error: 'Conta ou cartão de crédito é obrigatório' });
      }

      if (accountId && creditCardId) {
        return res.status(400).json({ error: 'Informe apenas conta OU cartão, não ambos' });
      }

      const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();

      let result;

      if (fileExtension === 'csv') {
        result = await importService.previewFromCSV(
          req.userId,
          accountId,
          creditCardId,
          req.file.buffer,
          req.file.originalname
        );
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        result = await importService.previewFromXLSX(
          req.userId,
          accountId,
          creditCardId,
          req.file.buffer,
          req.file.originalname
        );
      } else {
        return res.status(400).json({
          error: 'Formato de arquivo não suportado. Use CSV ou XLSX',
        });
      }

      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async confirmImport(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { accountId, creditCardId, transactions, filename } = req.body;

      if ((!accountId && !creditCardId) || !transactions || !filename) {
        return res.status(400).json({
          error: 'Conta/cartão, transações e nome do arquivo são obrigatórios',
        });
      }

      if (accountId && creditCardId) {
        return res.status(400).json({ error: 'Informe apenas conta OU cartão, não ambos' });
      }

      if (!Array.isArray(transactions) || transactions.length === 0) {
        return res.status(400).json({ error: 'Nenhuma transação para importar' });
      }

      const result = await importService.confirmImport(
        req.userId,
        accountId,
        creditCardId,
        transactions,
        filename
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
