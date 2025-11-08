import { Response } from 'express';
import { ReportExpandedService } from '../services/reportExpanded.service';
import { AuthRequest } from '../types';

const reportExpandedService = new ReportExpandedService();

export class ReportExpandedController {
  async getCashFlowForecast(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const months = req.query.months ? parseInt(req.query.months as string) : 3;

      const forecast = await reportExpandedService.getCashFlowForecast(req.userId, months);

      return res.json(forecast);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async detectAnomalies(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const threshold = req.query.threshold ? parseFloat(req.query.threshold as string) : 2.0;

      const anomalies = await reportExpandedService.detectAnomalies(req.userId, threshold);

      return res.json(anomalies);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getYoYComparison(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const year1 = req.query.year1 ? parseInt(req.query.year1 as string) : new Date().getFullYear() - 1;
      const year2 = req.query.year2 ? parseInt(req.query.year2 as string) : new Date().getFullYear();

      const comparison = await reportExpandedService.getYoYComparison(req.userId, year1, year2);

      return res.json(comparison);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getBudgetPerformance(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const month = req.query.month ? parseInt(req.query.month as string) : new Date().getMonth() + 1;
      const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();

      const performance = await reportExpandedService.getBudgetPerformance(req.userId, month, year);

      return res.json(performance);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getIncomeDistribution(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), 0, 1);

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const distribution = await reportExpandedService.getIncomeDistribution(
        req.userId,
        startDate,
        endDate
      );

      return res.json(distribution);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }

  async getSavingsRate(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : new Date(new Date().getFullYear(), 0, 1);

      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : new Date();

      const savingsRate = await reportExpandedService.getSavingsRate(
        req.userId,
        startDate,
        endDate
      );

      return res.json(savingsRate);
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      throw error;
    }
  }
}
