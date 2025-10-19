import { Router } from 'express';
import multer from 'multer';
import { ImportController } from '../controllers/import.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();
const importController = new ImportController();

// Configurar multer para armazenar arquivo em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.originalname.toLowerCase().substring(
      file.originalname.lastIndexOf('.')
    );

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos CSV e XLSX são permitidos'));
    }
  },
});

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Rota antiga (mantida para compatibilidade)
router.post('/upload', upload.single('file'), (req, res) =>
  importController.uploadFile(req, res)
);

// Novas rotas com IA
router.post('/preview', upload.single('file'), (req, res) =>
  importController.previewFile(req, res)
);
router.post('/confirm', (req, res) => importController.confirmImport(req, res));

router.get('/history', (req, res) => importController.getHistory(req, res));

export default router;
