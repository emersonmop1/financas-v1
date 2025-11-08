"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const progressManager_service_1 = require("../services/progressManager.service");
const auth_1 = require("../config/auth");
const router = (0, express_1.Router)();
// SSE endpoint para progresso de importação
// Aceita token via query parameter para compatibilidade com EventSource
router.get('/import/:jobId', (req, res) => {
    const { jobId } = req.params;
    const token = req.query.token;
    // Verificar autenticação via query parameter
    if (!token) {
        res.status(401).json({ error: 'Token não fornecido' });
        return;
    }
    try {
        (0, auth_1.verifyToken)(token);
    }
    catch (error) {
        res.status(401).json({ error: 'Token inválido' });
        return;
    }
    // Configurar SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Enviar progresso inicial se job existe
    const existingJob = progressManager_service_1.progressManager.getJob(jobId);
    if (existingJob) {
        res.write(`data: ${JSON.stringify(existingJob)}\n\n`);
    }
    // Listener para atualizações de progresso
    const progressListener = (progress) => {
        res.write(`data: ${JSON.stringify(progress)}\n\n`);
        // Se completou ou deu erro, fechar conexão após enviar
        if (progress.status === 'completed' || progress.status === 'error') {
            setTimeout(() => {
                res.end();
            }, 1000);
        }
    };
    progressManager_service_1.progressManager.on(`progress-${jobId}`, progressListener);
    // Limpar listener quando cliente desconectar
    req.on('close', () => {
        progressManager_service_1.progressManager.removeListener(`progress-${jobId}`, progressListener);
    });
});
exports.default = router;
//# sourceMappingURL=progress.routes.js.map