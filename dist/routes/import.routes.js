"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const import_controller_1 = require("../controllers/import.controller");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
const importController = new import_controller_1.ImportController();
// Configurar multer para armazenar arquivo em memória
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
        const allowedExtensions = ['.csv', '.xlsx', '.xls'];
        const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
        if (allowedExtensions.includes(fileExtension)) {
            cb(null, true);
        }
        else {
            cb(new Error('Apenas arquivos CSV e XLSX são permitidos'));
        }
    },
});
// Todas as rotas requerem autenticação
router.use(auth_1.authMiddleware);
// Rota antiga (mantida para compatibilidade)
router.post('/upload', upload.single('file'), (req, res) => importController.uploadFile(req, res));
// Novas rotas com IA
router.post('/preview', upload.single('file'), (req, res) => importController.previewFile(req, res));
router.post('/confirm', (req, res) => importController.confirmImport(req, res));
router.get('/history', (req, res) => importController.getHistory(req, res));
exports.default = router;
//# sourceMappingURL=import.routes.js.map