"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const zod_1 = require("zod");
const category_service_1 = require("../services/category.service");
const categoryService = new category_service_1.CategoryService();
const createCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório'),
    type: zod_1.z.enum(['INCOME', 'EXPENSE']),
    color: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
const updateCategorySchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Nome é obrigatório').optional(),
    color: zod_1.z.string().optional(),
    icon: zod_1.z.string().optional(),
});
class CategoryController {
    async findAll(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const type = req.query.type;
            const categories = type
                ? await categoryService.findByType(req.userId, type)
                : await categoryService.findAll(req.userId);
            return res.json(categories);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async create(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = createCategorySchema.parse(req.body);
            const category = await categoryService.create(req.userId, data);
            return res.status(201).json(category);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async update(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const data = updateCategorySchema.parse(req.body);
            const category = await categoryService.update(id, req.userId, data);
            return res.json(category);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async delete(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            await categoryService.delete(id, req.userId);
            return res.status(204).send();
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.CategoryController = CategoryController;
//# sourceMappingURL=category.controller.js.map