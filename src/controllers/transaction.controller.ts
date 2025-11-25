import { Response } from 'express';
import { z } from 'zod';
import { TransactionService } from '../services/transaction.service';
import { AuthRequest } from '../types';

const transactionService = new TransactionService();

const createTransactionSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string(),
  creditCardId: z.string().uuid().optional(),
  description: z.string().min(1, 'Descrição é obrigatória'),
  amount: z.number().positive('Valor deve ser positivo'),
  date: z.string().transform((val) => new Date(val)),
  type: z.enum(['INCOME', 'EXPENSE']),
  isPaid: z.boolean().optional(),
  installments: z.number().int().positive().optional(),
  installmentNum: z.number().int().positive().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isReconciled: z.boolean().optional(),
  bankReference: z.string().optional(),
});

const updateTransactionSchema = z.object({
  accountId: z.string().uuid().optional(),
  categoryId: z.string().optional(),
  creditCardId: z.string().uuid().optional(),
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  date: z.string().transform((val) => new Date(val)).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  isPaid: z.boolean().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  isReconciled: z.boolean().optional(),
  bankReference: z.string().optional(),
});

export class TransactionController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createTransactionSchema.parse(req.body);
      const transaction = await transactionService.create(req.userId, data);
      return res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const filters: any = {};

      if (req.query.accountId) {
        filters.accountId = req.query.accountId as string;
      }
      if (req.query.categoryId) {
        filters.categoryId = req.query.categoryId as string;
      }
      if (req.query.type) {
        filters.type = req.query.type as 'INCOME' | 'EXPENSE';
      }
      if (req.query.isPaid) {
        filters.isPaid = req.query.isPaid === 'true';
      }
      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const transactions = await transactionService.findAll(req.userId, filters);
      return res.json(transactions);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async findById(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const transaction = await transactionService.findById(id, req.userId);
      return res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(404).json({ error: error.message });
      }
      throw error;
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const data = updateTransactionSchema.parse(req.body);
      const transaction = await transactionService.update(id, req.userId, data);
      return res.json(transaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      await transactionService.delete(id, req.userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const stats = await transactionService.getStats(req.userId, startDate, endDate);
      return res.json(stats);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async deleteAll(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const result = await transactionService.deleteAll(req.userId);
      return res.json(result);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
