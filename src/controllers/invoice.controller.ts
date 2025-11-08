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
        return res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
      }

      // Verificar tipo de arquivo
      if (req.file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Apenas arquivos PDF são permitidos' });
      }

      console.log(`📄 Processando fatura: ${req.file.originalname} (${(req.file.size / 1024).toFixed(2)} KB)`);

      // Analisar fatura
      const preview = await invoiceService.previewInvoice(req.file.buffer, req.userId);

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
}
