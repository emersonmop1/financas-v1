import { Router } from 'express';
import { BankStatementController } from '../controllers/bankStatement.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const bankStatementController = new BankStatementController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// POST /api/bank-statement/preview - Preview das transações antes de importar
router.post('/preview', (req, res) => bankStatementController.preview(req, res));

// POST /api/bank-statement/import - Importa as transações
router.post('/import', (req, res) => bankStatementController.import(req, res));

// GET /api/bank-statement/unreconciled?accountId=xxx - Lista transações não conciliadas
router.get('/unreconciled', (req, res) => bankStatementController.getUnreconciled(req, res));

// POST /api/bank-statement/reconcile - Marca transações como conciliadas
router.post('/reconcile', (req, res) => bankStatementController.reconcile(req, res));

export default router;
