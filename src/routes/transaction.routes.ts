import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const transactionController = new TransactionController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/', (req, res) => transactionController.create(req, res));
router.get('/', (req, res) => transactionController.findAll(req, res));
router.get('/stats', (req, res) => transactionController.getStats(req, res));
router.get('/:id', (req, res) => transactionController.findById(req, res));
router.put('/:id', (req, res) => transactionController.update(req, res));
router.delete('/:id', (req, res) => transactionController.delete(req, res));

export default router;
