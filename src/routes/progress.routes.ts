import { Router, Response, Request } from 'express';
import { progressManager } from '../services/progressManager.service';
import { AuthRequest } from '../types';
import { verifyToken } from '../config/auth';

const router = Router();

// SSE endpoint para progresso de importação
// Aceita token via query parameter para compatibilidade com EventSource
router.get('/import/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params;
  const token = req.query.token as string;

  // Verificar autenticação via query parameter
  if (!token) {
    res.status(401).json({ error: 'Token não fornecido' });
    return;
  }

  try {
    verifyToken(token);
  } catch (error) {
    res.status(401).json({ error: 'Token inválido' });
    return;
  }

  // Configurar SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Enviar progresso inicial se job existe
  const existingJob = progressManager.getJob(jobId);
  if (existingJob) {
    res.write(`data: ${JSON.stringify(existingJob)}\n\n`);
  }

  // Listener para atualizações de progresso
  const progressListener = (progress: any) => {
    res.write(`data: ${JSON.stringify(progress)}\n\n`);

    // Se completou ou deu erro, fechar conexão após enviar
    if (progress.status === 'completed' || progress.status === 'error') {
      setTimeout(() => {
        res.end();
      }, 1000);
    }
  };

  progressManager.on(`progress-${jobId}`, progressListener);

  // Limpar listener quando cliente desconectar
  req.on('close', () => {
    progressManager.removeListener(`progress-${jobId}`, progressListener);
  });
});

export default router;
