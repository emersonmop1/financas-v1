import { Router } from 'express';
import multer from 'multer';
import { InvoiceController } from '../controllers/invoice.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const invoiceController = new InvoiceController();

// Configuração do multer para upload de PDF
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos PDF são permitidos'));
    }
  },
});

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// POST /api/invoices/preview - Upload e análise de PDF
router.post('/preview', upload.single('file'), (req, res) => invoiceController.preview(req, res));

// POST /api/invoices/confirm - Confirmar e salvar fatura
router.post('/confirm', (req, res) => invoiceController.confirm(req, res));

// GET /api/invoices/history - Histórico de faturas
router.get('/history', (req, res) => invoiceController.history(req, res));

// GET /api/invoices/:id - Detalhes de uma fatura
router.get('/:id', (req, res) => invoiceController.getDetails(req, res));

export default router;
