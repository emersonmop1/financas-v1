import { Router } from 'express';
import { investmentController } from '../controllers/investment.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// CRUD de investimentos
router.post('/', investmentController.create.bind(investmentController));
router.get('/', investmentController.findAll.bind(investmentController));
router.get('/stats', investmentController.getStats.bind(investmentController));
router.get('/:id', investmentController.findById.bind(investmentController));
router.put('/:id', investmentController.update.bind(investmentController));
router.delete('/:id', investmentController.delete.bind(investmentController));

// Ação de venda
router.post('/:id/sell', investmentController.sell.bind(investmentController));

export default router;
