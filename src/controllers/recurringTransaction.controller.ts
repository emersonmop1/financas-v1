import { Response } from 'express';
import { RecurringTransactionService } from '../services/recurringTransaction.service';
import { schedulerService } from '../services/scheduler.service';
import { AuthRequest } from '../types';

const recurringTransactionService = new RecurringTransactionService();

export class RecurringTransactionController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const recurringTransaction = await recurringTransactionService.create(req.userId, req.body);

      return res.status(201).json(recurringTransaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getAll(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const includeInactive = req.query.includeInactive === 'true';
      const recurringTransactions = await recurringTransactionService.getAll(
        req.userId,
        includeInactive
      );

      return res.json(recurringTransactions);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getById(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const recurringTransaction = await recurringTransactionService.getById(req.userId, id);

      return res.json(recurringTransaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
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
      const recurringTransaction = await recurringTransactionService.update(
        req.userId,
        id,
        req.body
      );

      return res.json(recurringTransaction);
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
      await recurringTransactionService.delete(req.userId, id);

      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async toggleActive(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const recurringTransaction = await recurringTransactionService.toggleActive(
        req.userId,
        id
      );

      return res.json(recurringTransaction);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async triggerExecution(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;

      // Verify user owns this recurring transaction
      await recurringTransactionService.getById(req.userId, id);

      // Execute the recurring transaction
      await schedulerService.executeRecurringTransaction(id);

      return res.json({
        message: 'Transação recorrente executada com sucesso',
        executedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getExecutionLogs(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;

      // Verify user owns this recurring transaction
      await recurringTransactionService.getById(req.userId, id);

      // Get execution logs
      const logs = await schedulerService.getExecutionLogs(id);

      return res.json(logs);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
