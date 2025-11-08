import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const budgetController = new BudgetController();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/budgets - Lista todos os orçamentos (com filtros opcionais)
router.get('/', (req, res) => budgetController.getAll(req, res));

// GET /api/budgets/spending?month=1&year=2025 - Lista orçamentos com gastos reais
router.get('/spending', (req, res) => budgetController.getWithSpending(req, res));

// GET /api/budgets/summary?month=1&year=2025 - Resumo geral do período
router.get('/summary', (req, res) => budgetController.getSummary(req, res));

// GET /api/budgets/:id - Busca orçamento por ID
router.get('/:id', (req, res) => budgetController.getById(req, res));

// POST /api/budgets - Cria novo orçamento
router.post('/', (req, res) => budgetController.create(req, res));

// PUT /api/budgets/:id - Atualiza orçamento
router.put('/:id', (req, res) => budgetController.update(req, res));

// DELETE /api/budgets/:id - Remove orçamento
router.delete('/:id', (req, res) => budgetController.delete(req, res));

export default router;
