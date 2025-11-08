import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const categoryController = new CategoryController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.get('/', (req, res) => categoryController.findAll(req, res));
router.post('/', (req, res) => categoryController.create(req, res));
router.put('/:id', (req, res) => categoryController.update(req, res));
router.delete('/:id', (req, res) => categoryController.delete(req, res));

export default router;
