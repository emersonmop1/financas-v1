"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceController = void 0;
const zod_1 = require("zod");
const invoice_service_1 = require("../services/invoice.service");
const confirmInvoiceSchema = zod_1.z.object({
    creditCardId: zod_1.z.string().uuid('ID do cartão inválido'),
    invoiceData: zod_1.z.object({
        dueDate: zod_1.z.string(),
        closingDate: zod_1.z.string(),
        totalAmount: zod_1.z.number().positive(),
        cards: zod_1.z.array(zod_1.z.object({
            last4Digits: zod_1.z.string(),
            holderName: zod_1.z.string(),
            totalAmount: zod_1.z.number(),
            transactions: zod_1.z.array(zod_1.z.object({
                date: zod_1.z.string(),
                description: zod_1.z.string(),
                amount: zod_1.z.number().positive(),
                category: zod_1.z.string(),
                installments: zod_1.z.number().nullable(),
                isInternational: zod_1.z.boolean(),
            })),
            internationalTransactions: zod_1.z.array(zod_1.z.object({
                date: zod_1.z.string(),
                description: zod_1.z.string(),
                amount: zod_1.z.number().positive(),
                category: zod_1.z.string(),
                installments: zod_1.z.number().nullable(),
                isInternational: zod_1.z.boolean(),
            })),
        })),
    }),
});
class InvoiceController {
    /**
     * POST /api/invoices/preview
     * Upload de PDF e análise prévia sem salvar
     */
    async preview(req, res) {
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
            const preview = await invoice_service_1.invoiceService.previewInvoice(req.file.buffer, req.userId);
            return res.json(preview);
        }
        catch (error) {
            console.error('Erro no preview:', error);
            return res.status(400).json({ error: error.message || 'Erro ao processar fatura' });
        }
    }
    /**
     * POST /api/invoices/confirm
     * Confirma e salva fatura no banco de dados
     */
    async confirm(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const data = confirmInvoiceSchema.parse(req.body);
            const result = await invoice_service_1.invoiceService.confirmInvoice(req.userId, data);
            return res.status(201).json({
                success: true,
                message: `Fatura importada com sucesso! ${result.transactionsCount} transações adicionadas.`,
                invoiceId: result.invoiceId,
                transactionsCount: result.transactionsCount,
            });
        }
        catch (error) {
            console.error('Erro ao confirmar fatura:', error);
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ error: 'Dados inválidos', details: error.errors });
            }
            return res.status(400).json({ error: error.message || 'Erro ao salvar fatura' });
        }
    }
    /**
     * GET /api/invoices/history
     * Retorna histórico de faturas importadas
     */
    async history(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const invoices = await invoice_service_1.invoiceService.getHistory(req.userId);
            return res.json(invoices);
        }
        catch (error) {
            console.error('Erro ao buscar histórico:', error);
            return res.status(400).json({ error: error.message || 'Erro ao buscar histórico' });
        }
    }
    /**
     * GET /api/invoices/:id
     * Retorna detalhes de uma fatura específica
     */
    async getDetails(req, res) {
        try {
            if (!req.userId) {
                return res.status(401).json({ error: 'Não autorizado' });
            }
            const { id } = req.params;
            const invoice = await invoice_service_1.invoiceService.getInvoiceDetails(id, req.userId);
            return res.json(invoice);
        }
        catch (error) {
            console.error('Erro ao buscar detalhes:', error);
            return res.status(404).json({ error: error.message || 'Fatura não encontrada' });
        }
    }
}
exports.InvoiceController = InvoiceController;
//# sourceMappingURL=invoice.controller.js.map