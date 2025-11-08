import { Router } from 'express';
import { RecurringTransactionController } from '../controllers/recurringTransaction.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const recurringTransactionController = new RecurringTransactionController();

router.use(authMiddleware);

router.get('/', (req, res) => recurringTransactionController.getAll(req, res));
router.get('/:id', (req, res) => recurringTransactionController.getById(req, res));
router.get('/:id/logs', (req, res) => recurringTransactionController.getExecutionLogs(req, res));
router.post('/', (req, res) => recurringTransactionController.create(req, res));
router.post('/:id/trigger', (req, res) => recurringTransactionController.triggerExecution(req, res));
router.put('/:id', (req, res) => recurringTransactionController.update(req, res));
router.patch('/:id/toggle', (req, res) => recurringTransactionController.toggleActive(req, res));
router.delete('/:id', (req, res) => recurringTransactionController.delete(req, res));

export default router;
