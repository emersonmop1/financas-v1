"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const invoice_controller_1 = require("../controllers/invoice.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const invoiceController = new invoice_controller_1.InvoiceController();
// Configuração do multer para upload de PDF
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos PDF são permitidos'));
        }
    },
});
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// POST /api/invoices/preview - Upload e análise de PDF
router.post('/preview', upload.single('file'), (req, res) => invoiceController.preview(req, res));
// POST /api/invoices/confirm - Confirmar e salvar fatura
router.post('/confirm', (req, res) => invoiceController.confirm(req, res));
// GET /api/invoices/history - Histórico de faturas
router.get('/history', (req, res) => invoiceController.history(req, res));
// GET /api/invoices/:id - Detalhes de uma fatura
router.get('/:id', (req, res) => invoiceController.getDetails(req, res));
exports.default = router;
//# sourceMappingURL=invoice.routes.js.map