import { Response } from 'express';
import { z } from 'zod';
import { investmentService } from '../services/investment.service';
import { AuthRequest } from '../types';

const createInvestmentSchema = z.object({
  type: z.enum(['STOCK', 'FUND', 'FIXED_INCOME', 'CRYPTO', 'REAL_ESTATE', 'OTHER']),
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  ticker: z.string().optional(),
  quantity: z.number().positive('Quantidade deve ser positiva'),
  purchasePrice: z.number().positive('Preço de compra deve ser positivo'),
  currentPrice: z.number().positive().optional(),
  purchaseDate: z.string().transform((val) => new Date(val)),
  broker: z.string().optional(),
  notes: z.string().optional(),
});

const updateInvestmentSchema = z.object({
  type: z.enum(['STOCK', 'FUND', 'FIXED_INCOME', 'CRYPTO', 'REAL_ESTATE', 'OTHER']).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  ticker: z.string().optional(),
  quantity: z.number().positive().optional(),
  purchasePrice: z.number().positive().optional(),
  currentPrice: z.number().positive().optional(),
  purchaseDate: z.string().transform((val) => new Date(val)).optional(),
  saleDate: z.string().transform((val) => new Date(val)).optional(),
  salePrice: z.number().positive().optional(),
  broker: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['ACTIVE', 'SOLD', 'CANCELLED']).optional(),
});

const sellInvestmentSchema = z.object({
  salePrice: z.number().positive('Preço de venda deve ser positivo'),
  saleDate: z.string().transform((val) => new Date(val)),
});

export class InvestmentController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createInvestmentSchema.parse(req.body);
      const investment = await investmentService.create(req.userId, data);

      return res.status(201).json(investment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Erro ao criar investimento' });
    }
  }

  async findAll(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const status = req.query.status as string | undefined;
      const investments = await investmentService.findAll(
        req.userId,
        status as any
      );

      return res.json(investments);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao buscar investimentos' });
    }
  }

  async findById(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const investment = await investmentService.findById(id, req.userId);

      return res.json(investment);
    } catch (error: any) {
      return res.status(404).json({ error: error.message || 'Investimento não encontrado' });
    }
  }

  async update(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const data = updateInvestmentSchema.parse(req.body);
      const investment = await investmentService.update(id, req.userId, data);

      return res.json(investment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Erro ao atualizar investimento' });
    }
  }

  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      await investmentService.delete(id, req.userId);

      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao deletar investimento' });
    }
  }

  async sell(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const data = sellInvestmentSchema.parse(req.body);
      const investment = await investmentService.sell(id, req.userId, data.salePrice, data.saleDate);

      return res.json(investment);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Erro ao vender investimento' });
    }
  }

  async getStats(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const stats = await investmentService.getStats(req.userId);

      return res.json(stats);
    } catch (error: any) {
      return res.status(400).json({ error: error.message || 'Erro ao buscar estatísticas' });
    }
  }
}

export const investmentController = new InvestmentController();
