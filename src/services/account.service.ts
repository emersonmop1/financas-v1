import prisma from '../config/database';
import { AccountType } from '@prisma/client';

interface CreateAccountDTO {
  name: string;
  type: AccountType;
  balance?: number;
  currency?: string;
}

interface UpdateAccountDTO {
  name?: string;
  type?: AccountType;
  balance?: number;
  currency?: string;
}

export class AccountService {
  async create(userId: string, data: CreateAccountDTO) {
    const account = await prisma.account.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        balance: data.balance || 0,
        currency: data.currency || 'BRL',
      },
    });

    return account;
  }

  async findAll(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts;
  }

  async findById(id: string, userId: string) {
    const account = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new Error('Conta não encontrada');
    }

    return account;
  }

  async update(id: string, userId: string, data: UpdateAccountDTO) {
    // Verificar se a conta pertence ao usuário
    await this.findById(id, userId);

    const account = await prisma.account.update({
      where: { id },
      data,
    });

    return account;
  }

  async delete(id: string, userId: string) {
    // Verificar se a conta pertence ao usuário
    await this.findById(id, userId);

    await prisma.account.delete({
      where: { id },
    });
  }

  async getTotalBalance(userId: string) {
    const accounts = await prisma.account.findMany({
      where: { userId },
    });

    const total = accounts.reduce(
      (sum, account) => sum + Number(account.balance),
      0
    );

    return total;
  }
}
