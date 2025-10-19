import { Response } from 'express';
import { z } from 'zod';
import { GoalService } from '../services/goal.service';
import { AuthRequest } from '../types';

const goalService = new GoalService();

const createGoalSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  targetAmount: z.number().positive('Valor meta deve ser positivo'),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().transform((val) => new Date(val)).optional(),
});

const updateGoalSchema = z.object({
  name: z.string().min(1).optional(),
  targetAmount: z.number().positive().optional(),
  currentAmount: z.number().min(0).optional(),
  deadline: z.string().transform((val) => new Date(val)).optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

const addProgressSchema = z.object({
  amount: z.number().positive('Valor deve ser positivo'),
});

export class GoalController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createGoalSchema.parse(req.body);
      const goal = await goalService.create(req.userId, data);
      return res.status(201).json(goal);
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

      const status = req.query.status as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | undefined;
      const goals = await goalService.findAll(req.userId, status);
      return res.json(goals);
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
      const goal = await goalService.findById(id, req.userId);
      return res.json(goal);
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
      const data = updateGoalSchema.parse(req.body);
      const goal = await goalService.update(id, req.userId, data);
      return res.json(goal);
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
      await goalService.delete(id, req.userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async addProgress(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const { amount } = addProgressSchema.parse(req.body);
      const goal = await goalService.addProgress(id, req.userId, amount);
      return res.json(goal);
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

      const stats = await goalService.getStats(req.userId);
      return res.json(stats);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
