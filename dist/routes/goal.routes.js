"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const goal_controller_1 = require("../controllers/goal.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const goalController = new goal_controller_1.GoalController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.post('/', (req, res) => goalController.create(req, res));
router.get('/', (req, res) => goalController.findAll(req, res));
router.get('/stats', (req, res) => goalController.getStats(req, res));
router.get('/:id', (req, res) => goalController.findById(req, res));
router.put('/:id', (req, res) => goalController.update(req, res));
router.delete('/:id', (req, res) => goalController.delete(req, res));
router.post('/:id/add-progress', (req, res) => goalController.addProgress(req, res));
exports.default = router;
//# sourceMappingURL=goal.routes.js.map