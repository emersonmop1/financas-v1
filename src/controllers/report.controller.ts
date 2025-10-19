import { Response } from 'express';
import { ReportService } from '../services/report.service';
import { AuthRequest } from '../types';

const reportService = new ReportService();

export class ReportController {
  async getExpensesByCategory(req: AuthRequest, res: Response) {
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

      const data = await reportService.getExpensesByCategory(
        req.userId,
        startDate,
        endDate
      );
      return res.json(data);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getMonthlyEvolution(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = await reportService.getMonthlyEvolution(req.userId);
      return res.json(data);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getMonthlyComparison(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = await reportService.getMonthlyComparison(req.userId);
      return res.json(data);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getTopExpenseCategories(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

      let startDate: Date | undefined;
      let endDate: Date | undefined;

      if (req.query.startDate) {
        startDate = new Date(req.query.startDate as string);
      }
      if (req.query.endDate) {
        endDate = new Date(req.query.endDate as string);
      }

      const data = await reportService.getTopExpenseCategories(
        req.userId,
        limit,
        startDate,
        endDate
      );
      return res.json(data);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
