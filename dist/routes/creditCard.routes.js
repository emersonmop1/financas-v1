"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const creditCard_controller_1 = require("../controllers/creditCard.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const creditCardController = new creditCard_controller_1.CreditCardController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.post('/', (req, res) => creditCardController.create(req, res));
router.get('/', (req, res) => creditCardController.findAll(req, res));
router.get('/:id', (req, res) => creditCardController.findById(req, res));
router.get('/:id/current-bill', (req, res) => creditCardController.getCurrentBill(req, res));
router.put('/:id', (req, res) => creditCardController.update(req, res));
router.delete('/:id', (req, res) => creditCardController.delete(req, res));
exports.default = router;
//# sourceMappingURL=creditCard.routes.js.map