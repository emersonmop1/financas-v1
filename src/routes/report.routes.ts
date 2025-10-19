import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const reportController = new ReportController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/expenses-by-category', (req, res) =>
  reportController.getExpensesByCategory(req, res)
);
router.get('/monthly-evolution', (req, res) =>
  reportController.getMonthlyEvolution(req, res)
);
router.get('/monthly-comparison', (req, res) =>
  reportController.getMonthlyComparison(req, res)
);
router.get('/top-expense-categories', (req, res) =>
  reportController.getTopExpenseCategories(req, res)
);

export default router;
