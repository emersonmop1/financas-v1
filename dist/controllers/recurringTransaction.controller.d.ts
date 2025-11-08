import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class RecurringTransactionController {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getAll(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    toggleActive(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    triggerExecution(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getExecutionLogs(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=recurringTransaction.controller.d.ts.map