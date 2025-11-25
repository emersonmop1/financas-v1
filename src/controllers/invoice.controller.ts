import { Response } from 'express';
import { z } from 'zod';
import { invoiceService } from '../services/invoice.service';
import { AuthRequest } from '../types';

const confirmInvoiceSchema = z.object({
  creditCardId: z.string().uuid('ID do cartão inválido'),
  invoiceData: z.object({
    dueDate: z.string(),
    closingDate: z.string(),
    totalAmount: z.number().positive(),
    cards: z.array(
      z.object({
        last4Digits: z.string(),
        holderName: z.string(),
        totalAmount: z.number(),
        transactions: z.array(
          z.object({
            date: z.string(),
            description: z.string(),
            amount: z.number().positive(),
            category: z.string(),
            installments: z.number().nullable(),
            isInternational: z.boolean(),
          })
        ),
        internationalTransactions: z.array(
          z.object({
            date: z.string(),
            description: z.string(),
            amount: z.number().positive(),
            category: z.string(),
            installments: z.number().nullable(),
            isInternational: z.boolean(),
          })
        ),
      })
    ),
  }),
  customMonth: z.number().int().min(1).max(12).optional(),
  customYear: z.number().int().min(2000).max(2100).optional(),
});

export class InvoiceController {
  /**
   * POST /api/invoices/preview
   * Upload de PDF e análise prévia sem salvar
   */
  async preview(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      // Verificar se há arquivo
      if (!req.file) {
        return res.status(400).json({ error: 'Arquivo é obrigatório' });
      }

      // Tipos de arquivo aceitos
      const allowedMimeTypes = [
        'application/pdf',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel.sheet.macroEnabled.12',
      ];

      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ error: 'Apenas arquivos PDF, Excel (.xlsx, .xls, .xlsm) e CSV são permitidos' });
      }

      console.log(`📄 Processando fatura: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

      // Analisar fatura (PDF ou Excel/CSV)
      const preview = await invoiceService.previewInvoice(
        req.file.buffer,
        req.userId,
        req.file.mimetype,
        req.file.originalname
      );

      return res.json(preview);
    } catch (error: any) {
      console.error('Erro no preview:', error);
      return res.status(400).json({ error: error.message || 'Erro ao processar fatura' });
    }
  }

  /**
   * POST /api/invoices/confirm
   * Confirma e salva fatura no banco de dados
   */
  async confirm(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const data = confirmInvoiceSchema.parse(req.body);

      const result = await invoiceService.confirmInvoice(req.userId, data);

      return res.status(201).json({
        success: true,
        message: `Fatura importada com sucesso! ${result.transactionsCount} transações adicionadas.`,
        invoiceId: result.invoiceId,
        transactionsCount: result.transactionsCount,
      });
    } catch (error: any) {
      console.error('Erro ao confirmar fatura:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
      }
      return res.status(400).json({ error: error.message || 'Erro ao salvar fatura' });
    }
  }

  /**
   * GET /api/invoices/history
   * Retorna histórico de faturas importadas
   */
  async history(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const invoices = await invoiceService.getHistory(req.userId);

      return res.json(invoices);
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      return res.status(400).json({ error: error.message || 'Erro ao buscar histórico' });
    }
  }

  /**
   * GET /api/invoices/:id
   * Retorna detalhes de uma fatura específica
   */
  async getDetails(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;

      const invoice = await invoiceService.getInvoiceDetails(id, req.userId);

      return res.json(invoice);
    } catch (error: any) {
      console.error('Erro ao buscar detalhes:', error);
      return res.status(404).json({ error: error.message || 'Fatura não encontrada' });
    }
  }

  /**
   * DELETE /api/invoices/:id
   * Deleta uma fatura e todas as suas transações
   */
  async delete(req: AuthRequest, res: Response) {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { id } = req.params;

      const result = await invoiceService.deleteInvoice(id, req.userId);

      return res.json(result);
    } catch (error: any) {
      console.error('Erro ao deletar fatura:', error);
      return res.status(400).json({ error: error.message || 'Erro ao deletar fatura' });
    }
  }
}
