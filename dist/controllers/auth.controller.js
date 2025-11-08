"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const zod_1 = require("zod");
const auth_service_1 = require("../services/auth.service");
const authService = new auth_service_1.AuthService();
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
    name: zod_1.z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Email inválido'),
    password: zod_1.z.string().min(1, 'Senha é obrigatória'),
});
class AuthController {
    async register(req, res) {
        try {
            const data = registerSchema.parse(req.body);
            const result = await authService.register(data);
            return res.status(201).json(result);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async login(req, res) {
        try {
            const data = loginSchema.parse(req.body);
            const result = await authService.login(data);
            return res.json(result);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getProfile(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const user = await authService.getProfile(req.userId);
            return res.json(user);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(404).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map