"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const account_controller_1 = require("../controllers/account.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const accountController = new account_controller_1.AccountController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.post('/', (req, res) => accountController.create(req, res));
router.get('/', (req, res) => accountController.findAll(req, res));
router.get('/balance', (req, res) => accountController.getTotalBalance(req, res));
router.get('/:id', (req, res) => accountController.findById(req, res));
router.put('/:id', (req, res) => accountController.update(req, res));
router.delete('/:id', (req, res) => accountController.delete(req, res));
exports.default = router;
//# sourceMappingURL=account.routes.js.map