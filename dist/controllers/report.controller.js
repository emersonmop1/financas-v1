"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("../services/report.service");
const reportService = new report_service_1.ReportService();
class ReportController {
    async getExpensesByCategory(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            let startDate;
            let endDate;
            if (req.query.startDate) {
                startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                endDate = new Date(req.query.endDate);
            }
            const data = await reportService.getExpensesByCategory(req.userId, startDate, endDate);
            return res.json(data);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getMonthlyEvolution(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = await reportService.getMonthlyEvolution(req.userId);
            return res.json(data);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getMonthlyComparison(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = await reportService.getMonthlyComparison(req.userId);
            return res.json(data);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getTopExpenseCategories(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            let startDate;
            let endDate;
            if (req.query.startDate) {
                startDate = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                endDate = new Date(req.query.endDate);
            }
            const data = await reportService.getTopExpenseCategories(req.userId, limit, startDate, endDate);
            return res.json(data);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.ReportController = ReportController;
//# sourceMappingURL=report.controller.js.map