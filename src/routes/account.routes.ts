import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const accountController = new AccountController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/', (req, res) => accountController.create(req, res));
router.get('/', (req, res) => accountController.findAll(req, res));
router.get('/balance', (req, res) => accountController.getTotalBalance(req, res));
router.get('/:id', (req, res) => accountController.findById(req, res));
router.put('/:id', (req, res) => accountController.update(req, res));
router.delete('/:id', (req, res) => accountController.delete(req, res));

export default router;
