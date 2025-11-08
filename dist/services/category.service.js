"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryService = void 0;
const database_1 = __importDefault(require("../config/database"));
class CategoryService {
    async findAll(userId) {
        // Buscar categorias padrão e do usuário
        const categories = await database_1.default.category.findMany({
            where: {
                OR: [{ userId }, { isDefault: true }],
            },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        return categories;
    }
    async findByType(userId, type) {
        const categories = await database_1.default.category.findMany({
            where: {
                OR: [{ userId }, { isDefault: true }],
                type,
            },
            orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
        });
        return categories;
    }
    async create(userId, data) {
        const category = await database_1.default.category.create({
            data: {
                userId,
                name: data.name,
                type: data.type,
                color: data.color || '#3B82F6',
                icon: data.icon || '💰',
                isDefault: false,
            },
        });
        return category;
    }
    async update(id, userId, data) {
        // Verificar se a categoria existe e pertence ao usuário
        const category = await database_1.default.category.findFirst({
            where: { id, userId },
        });
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        if (category.isDefault) {
            throw new Error('Não é possível editar categorias padrão');
        }
        const updatedCategory = await database_1.default.category.update({
            where: { id },
            data: {
                name: data.name,
                color: data.color,
                icon: data.icon,
            },
        });
        return updatedCategory;
    }
    async delete(id, userId) {
        // Não permitir deletar categorias padrão
        const category = await database_1.default.category.findFirst({
            where: { id, userId },
        });
        if (!category) {
            throw new Error('Categoria não encontrada');
        }
        if (category.isDefault) {
            throw new Error('Não é possível deletar categorias padrão');
        }
        // Verificar se existem transações usando esta categoria
        const transactionCount = await database_1.default.transaction.count({
            where: { categoryId: id },
        });
        if (transactionCount > 0) {
            throw new Error(`Não é possível deletar esta categoria pois existem ${transactionCount} transações vinculadas a ela`);
        }
        await database_1.default.category.delete({
            where: { id },
        });
    }
}
exports.CategoryService = CategoryService;
//# sourceMappingURL=category.service.js.map