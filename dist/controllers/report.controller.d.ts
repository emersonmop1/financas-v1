import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class ReportController {
    getExpensesByCategory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getMonthlyEvolution(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getMonthlyComparison(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTopExpenseCategories(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=report.controller.d.ts.map