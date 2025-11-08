"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recurringTransaction_controller_1 = require("../controllers/recurringTransaction.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const recurringTransactionController = new recurringTransaction_controller_1.RecurringTransactionController();
router.use(auth_1.authMiddleware);
router.get('/', (req, res) => recurringTransactionController.getAll(req, res));
router.get('/:id', (req, res) => recurringTransactionController.getById(req, res));
router.get('/:id/logs', (req, res) => recurringTransactionController.getExecutionLogs(req, res));
router.post('/', (req, res) => recurringTransactionController.create(req, res));
router.post('/:id/trigger', (req, res) => recurringTransactionController.triggerExecution(req, res));
router.put('/:id', (req, res) => recurringTransactionController.update(req, res));
router.patch('/:id/toggle', (req, res) => recurringTransactionController.toggleActive(req, res));
router.delete('/:id', (req, res) => recurringTransactionController.delete(req, res));
exports.default = router;
//# sourceMappingURL=recurringTransaction.routes.js.map