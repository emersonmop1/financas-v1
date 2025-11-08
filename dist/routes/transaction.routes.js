"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const transaction_controller_1 = require("../controllers/transaction.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const transactionController = new transaction_controller_1.TransactionController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.post('/', (req, res) => transactionController.create(req, res));
router.get('/', (req, res) => transactionController.findAll(req, res));
router.get('/stats', (req, res) => transactionController.getStats(req, res));
router.get('/:id', (req, res) => transactionController.findById(req, res));
router.put('/:id', (req, res) => transactionController.update(req, res));
router.delete('/:id', (req, res) => transactionController.delete(req, res));
exports.default = router;
//# sourceMappingURL=transaction.routes.js.map