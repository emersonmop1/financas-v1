import { Request, Response, NextFunction } from 'express';

export function performanceLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log quando a requisição é recebida
  console.log(`📨 ${req.method} ${req.path}`);

  // Interceptar o fim da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;

    // Colorir baseado na duração
    let emoji = '🟢';
    if (duration > 100) emoji = '🟡';
    if (duration > 500) emoji = '🔴';

    console.log(`${emoji} ${req.method} ${req.path} - ${duration}ms`);

    return originalSend.call(this, data);
  };

  next();
}