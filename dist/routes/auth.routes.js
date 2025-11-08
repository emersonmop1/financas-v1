"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
router.post('/register', (req, res) => authController.register(req, res));
router.post('/login', (req, res) => authController.login(req, res));
router.get('/profile', auth_1.authMiddleware, (req, res) => authController.getProfile(req, res));
exports.default = router;
//# sourceMappingURL=auth.routes.js.map