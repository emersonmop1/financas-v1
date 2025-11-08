"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const auth_1 = require("../config/auth");
class AuthService {
    async register(data) {
        // Verificar se usuário já existe
        const existingUser = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (existingUser) {
            throw new Error('Email já cadastrado');
        }
        // Hash da senha
        const hashedPassword = await bcrypt_1.default.hash(data.password, 10);
        // Criar usuário
        const user = await database_1.default.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
            },
        });
        // Gerar token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, auth_1.authConfig.jwt.secret, {
            expiresIn: auth_1.authConfig.jwt.expiresIn,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }
    async login(data) {
        // Buscar usuário
        const user = await database_1.default.user.findUnique({
            where: { email: data.email },
        });
        if (!user) {
            throw new Error('Credenciais inválidas');
        }
        // Verificar senha
        const isValidPassword = await bcrypt_1.default.compare(data.password, user.password);
        if (!isValidPassword) {
            throw new Error('Credenciais inválidas');
        }
        // Gerar token
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, auth_1.authConfig.jwt.secret, {
            expiresIn: auth_1.authConfig.jwt.expiresIn,
        });
        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
        };
    }
    async getProfile(userId) {
        const user = await database_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        if (!user) {
            throw new Error('Usuário não encontrado');
        }
        return user;
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map