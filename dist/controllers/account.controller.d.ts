import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class AccountController {
    create(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    findAll(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    findById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    update(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    delete(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getTotalBalance(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=account.controller.d.ts.map