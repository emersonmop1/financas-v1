import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class BudgetController {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAll(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getWithSpending(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getSummary(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=budget.controller.d.ts.map