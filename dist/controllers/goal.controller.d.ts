import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class GoalController {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    findAll(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    findById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    addProgress(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getStats(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=goal.controller.d.ts.map