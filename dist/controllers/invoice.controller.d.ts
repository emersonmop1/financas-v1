import { Response } from 'express';
import { AuthRequest } from '../types';
export declare class InvoiceController {
    /**
     * POST /api/invoices/preview
     * Upload de PDF e análise prévia sem salvar
     */
    preview(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * POST /api/invoices/confirm
     * Confirma e salva fatura no banco de dados
     */
    confirm(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/invoices/history
     * Retorna histórico de faturas importadas
     */
    history(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
    /**
     * GET /api/invoices/:id
     * Retorna detalhes de uma fatura específica
     */
    getDetails(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=invoice.controller.d.ts.map