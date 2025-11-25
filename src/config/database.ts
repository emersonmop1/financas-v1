import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['error'], // Desabilitar query logging para melhor performance
});

export default prisma;
