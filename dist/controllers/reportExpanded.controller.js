"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExpandedController = void 0;
const reportExpanded_service_1 = require("../services/reportExpanded.service");
const reportExpandedService = new reportExpanded_service_1.ReportExpandedService();
class ReportExpandedController {
    async getCashFlowForecast(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const months = req.query.months ? parseInt(req.query.months) : 3;
            const forecast = await reportExpandedService.getCashFlowForecast(req.userId, months);
            return res.json(forecast);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async detectAnomalies(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const threshold = req.query.threshold ? parseFloat(req.query.threshold) : 2.0;
            const anomalies = await reportExpandedService.detectAnomalies(req.userId, threshold);
            return res.json(anomalies);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getYoYComparison(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const year1 = req.query.year1 ? parseInt(req.query.year1) : new Date().getFullYear() - 1;
            const year2 = req.query.year2 ? parseInt(req.query.year2) : new Date().getFullYear();
            const comparison = await reportExpandedService.getYoYComparison(req.userId, year1, year2);
            return res.json(comparison);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getBudgetPerformance(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const month = req.query.month ? parseInt(req.query.month) : new Date().getMonth() + 1;
            const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
            const performance = await reportExpandedService.getBudgetPerformance(req.userId, month, year);
            return res.json(performance);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getIncomeDistribution(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(new Date().getFullYear(), 0, 1);
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date();
            const distribution = await reportExpandedService.getIncomeDistribution(req.userId, startDate, endDate);
            return res.json(distribution);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
    async getSavingsRate(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const startDate = req.query.startDate
                ? new Date(req.query.startDate)
                : new Date(new Date().getFullYear(), 0, 1);
            const endDate = req.query.endDate
                ? new Date(req.query.endDate)
                : new Date();
            const savingsRate = await reportExpandedService.getSavingsRate(req.userId, startDate, endDate);
            return res.json(savingsRate);
        }
        catch (error) {
            if (error instanceof Error) {
                return res.status(400).json({ error: error.message });
            }
            throw error;
        }
    }
}
exports.ReportExpandedController = ReportExpandedController;
//# sourceMappingURL=reportExpanded.controller.js.map