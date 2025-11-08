import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class ImportController {
    uploadFile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    getHistory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    previewFile(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    confirmImport(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=import.controller.d.ts.map