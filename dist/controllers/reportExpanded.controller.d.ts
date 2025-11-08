import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class ReportExpandedController {
    getCashFlowForecast(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    detectAnomalies(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getYoYComparison(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getBudgetPerformance(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getIncomeDistribution(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getSavingsRate(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=reportExpanded.controller.d.ts.map