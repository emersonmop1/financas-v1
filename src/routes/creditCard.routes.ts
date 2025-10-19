import { Router } from 'express';
import { CreditCardController } from '../controllers/creditCard.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const creditCardController = new CreditCardController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

router.post('/', (req, res) => creditCardController.create(req, res));
router.get('/', (req, res) => creditCardController.findAll(req, res));
router.get('/:id', (req, res) => creditCardController.findById(req, res));
router.get('/:id/current-bill', (req, res) =>
  creditCardController.getCurrentBill(req, res)
);
router.put('/:id', (req, res) => creditCardController.update(req, res));
router.delete('/:id', (req, res) => creditCardController.delete(req, res));

export default router;
