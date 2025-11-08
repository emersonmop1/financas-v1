"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const reportController = new report_controller_1.ReportController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.get('/expenses-by-category', (req, res) => reportController.getExpensesByCategory(req, res));
router.get('/monthly-evolution', (req, res) => reportController.getMonthlyEvolution(req, res));
router.get('/monthly-comparison', (req, res) => reportController.getMonthlyComparison(req, res));
router.get('/top-expense-categories', (req, res) => reportController.getTopExpenseCategories(req, res));
exports.default = router;
//# sourceMappingURL=report.routes.js.map