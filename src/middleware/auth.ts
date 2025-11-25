import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../config/auth';
import { AuthRequest, JWTPayload } from '../types';

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log(`⚠️ Auth rejected (no token): ${Date.now() - start}ms`);
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2) {
    console.log(`⚠️ Auth rejected (malformed): ${Date.now() - start}ms`);
    return res.status(401).json({ error: 'Token malformatado' });
  }

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme)) {
    console.log(`⚠️ Auth rejected (scheme): ${Date.now() - start}ms`);
    return res.status(401).json({ error: 'Token malformatado' });
  }

  try {
    const decoded = jwt.verify(token, authConfig.jwt.secret) as JWTPayload;
    req.userId = decoded.userId;
    console.log(`✅ Auth OK: ${Date.now() - start}ms`);
    return next();
  } catch (err) {
    console.log(`⚠️ Auth rejected (invalid token): ${Date.now() - start}ms`);
    return res.status(401).json({ error: 'Token inválido' });
  }
};
