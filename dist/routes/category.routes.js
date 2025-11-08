"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("../controllers/category.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const categoryController = new category_controller_1.CategoryController();
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
router.get('/', (req, res) => categoryController.findAll(req, res));
router.post('/', (req, res) => categoryController.create(req, res));
router.put('/:id', (req, res) => categoryController.update(req, res));
router.delete('/:id', (req, res) => categoryController.delete(req, res));
exports.default = router;
//# sourceMappingURL=category.routes.js.map