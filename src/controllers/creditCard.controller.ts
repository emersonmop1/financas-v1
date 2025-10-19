import { Response } from 'express';
import { z } from 'zod';
import { CreditCardService } from '../services/creditCard.service';
import { AuthRequest } from '../types';

const creditCardService = new CreditCardService();

const createCreditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  limit: z.number().positive('Limite deve ser positivo'),
  closingDay: z.number().int().min(1).max(31, 'Dia de fechamento inválido'),
  dueDay: z.number().int().min(1).max(31, 'Dia de vencimento inválido'),
});

const updateCreditCardSchema = z.object({
  name: z.string().min(1).optional(),
  limit: z.number().positive().optional(),
  closingDay: z.number().int().min(1).max(31).optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
});

export class CreditCardController {
  async create(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = createCreditCardSchema.parse(req.body);
      const creditCard = await creditCardService.create(req.userId, data);
      return res.status(201).json(creditCard);
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

      const creditCards = await creditCardService.findAll(req.userId);
      return res.json(creditCards);
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
      const creditCard = await creditCardService.findById(id, req.userId);
      return res.json(creditCard);
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
      const data = updateCreditCardSchema.parse(req.body);
      const creditCard = await creditCardService.update(id, req.userId, data);
      return res.json(creditCard);
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
      await creditCardService.delete(id, req.userId);
      return res.status(204).send();
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getCurrentBill(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;
      const bill = await creditCardService.getCurrentBillTransactions(
        id,
        req.userId
      );
      return res.json(bill);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
