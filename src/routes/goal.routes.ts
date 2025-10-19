import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const goalController = new GoalController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/', (req, res) => goalController.create(req, res));
router.get('/', (req, res) => goalController.findAll(req, res));
router.get('/stats', (req, res) => goalController.getStats(req, res));
router.get('/:id', (req, res) => goalController.findById(req, res));
router.put('/:id', (req, res) => goalController.update(req, res));
router.delete('/:id', (req, res) => goalController.delete(req, res));
router.post('/:id/add-progress', (req, res) => goalController.addProgress(req, res));

export default router;
