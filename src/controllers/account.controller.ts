import { Response } from 'express';
import { z } from 'zod';
import { AccountService } from '../services/account.service';
import { AuthRequest } from '../types';

const accountService = new AccountService();

const createAccountSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH']),
  balance: z.number().optional(),
  currency: z.string().optional(),
});

const updateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT', 'CASH']).optional(),
  balance: z.number().optional(),
  currency: z.string().optional(),
});

export class AccountController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createAccountSchema.parse(req.body);
      const account = await accountService.create(req.userId, data);
      return res.status(201).json(account);
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

      const accounts = await accountService.findAll(req.userId);
      return res.json(accounts);
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
      const account = await accountService.findById(id, req.userId);
      return res.json(account);
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
      const data = updateAccountSchema.parse(req.body);
      const account = await accountService.update(id, req.userId, data);
      return res.json(account);
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
      await accountService.delete(id, req.userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getTotalBalance(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const total = await accountService.getTotalBalance(req.userId);
      return res.json({ total });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
