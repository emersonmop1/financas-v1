import prisma from '../config/database';
import { InvestmentType, InvestmentStatus, Prisma } from '@prisma/client';

interface CreateInvestmentDTO {
  type: InvestmentType;
  name: string;
  description?: string;
  ticker?: string;
  quantity: number;
  purchasePrice: number;
  currentPrice?: number;
  purchaseDate: Date;
  broker?: string;
  notes?: string;
}

interface UpdateInvestmentDTO {
  type?: InvestmentType;
  name?: string;
  description?: string;
  ticker?: string;
  quantity?: number;
  purchasePrice?: number;
  currentPrice?: number;
  purchaseDate?: Date;
  saleDate?: Date;
  salePrice?: number;
  broker?: string;
  notes?: string;
  status?: InvestmentStatus;
}

export class InvestmentService {
  async create(userId: string, data: CreateInvestmentDTO) {
    const investment = await prisma.investment.create({
      data: {
        userId,
        type: data.type,
        name: data.name,
        description: data.description,
        ticker: data.ticker,
        quantity: new Prisma.Decimal(data.quantity),
        purchasePrice: new Prisma.Decimal(data.purchasePrice),
        currentPrice: data.currentPrice ? new Prisma.Decimal(data.currentPrice) : null,
        purchaseDate: data.purchaseDate,
        broker: data.broker,
        notes: data.notes,
        status: 'ACTIVE',
      },
    });

    return this.formatInvestment(investment);
  }

  async findAll(userId: string, status?: InvestmentStatus) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const investments = await prisma.investment.findMany({
      where,
      orderBy: [{ status: 'asc' }, { purchaseDate: 'desc' }],
    });

    return investments.map(this.formatInvestment);
  }

  async findById(id: string, userId: string) {
    const investment = await prisma.investment.findFirst({
      where: { id, userId },
    });

    if (!investment) {
      throw new Error('Investimento não encontrado');
    }

    return this.formatInvestment(investment);
  }

  async update(id: string, userId: string, data: UpdateInvestmentDTO) {
    // Verificar se o investimento pertence ao usuário
    await this.findById(id, userId);

    const updateData: any = { ...data };

    // Converter valores numéricos para Decimal
    if (data.quantity !== undefined) {
      updateData.quantity = new Prisma.Decimal(data.quantity);
    }
    if (data.purchasePrice !== undefined) {
      updateData.purchasePrice = new Prisma.Decimal(data.purchasePrice);
    }
    if (data.currentPrice !== undefined) {
      updateData.currentPrice = new Prisma.Decimal(data.currentPrice);
    }
    if (data.salePrice !== undefined) {
      updateData.salePrice = new Prisma.Decimal(data.salePrice);
    }

    const investment = await prisma.investment.update({
      where: { id },
      data: updateData,
    });

    return this.formatInvestment(investment);
  }

  async delete(id: string, userId: string) {
    // Verificar se o investimento pertence ao usuário
    await this.findById(id, userId);

    await prisma.investment.delete({
      where: { id },
    });
  }

  async sell(id: string, userId: string, salePrice: number, saleDate: Date) {
    // Verificar se o investimento pertence ao usuário
    await this.findById(id, userId);

    const investment = await prisma.investment.update({
      where: { id },
      data: {
        salePrice: new Prisma.Decimal(salePrice),
        saleDate,
        status: 'SOLD',
      },
    });

    return this.formatInvestment(investment);
  }

  async getStats(userId: string) {
    const investments = await prisma.investment.findMany({
      where: { userId, status: 'ACTIVE' },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + Number(inv.quantity) * Number(inv.purchasePrice),
      0
    );

    const currentValue = investments.reduce((sum, inv) => {
      const price = inv.currentPrice ? Number(inv.currentPrice) : Number(inv.purchasePrice);
      return sum + Number(inv.quantity) * price;
    }, 0);

    const profit = currentValue - totalInvested;
    const profitPercentage = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;

    // Agrupar por tipo
    const byType: Record<string, { count: number; totalInvested: number; currentValue: number }> = {};

    investments.forEach((inv) => {
      const invested = Number(inv.quantity) * Number(inv.purchasePrice);
      const current = Number(inv.quantity) * (inv.currentPrice ? Number(inv.currentPrice) : Number(inv.purchasePrice));

      if (!byType[inv.type]) {
        byType[inv.type] = { count: 0, totalInvested: 0, currentValue: 0 };
      }

      byType[inv.type].count++;
      byType[inv.type].totalInvested += invested;
      byType[inv.type].currentValue += current;
    });

    // Contar ativos e vendidos
    const allInvestments = await prisma.investment.findMany({
      where: { userId },
    });
    const activeCount = allInvestments.filter(i => i.status === 'ACTIVE').length;
    const soldCount = allInvestments.filter(i => i.status === 'SOLD').length;

    // Formatar byType para o formato esperado pelo frontend
    const formattedByType: Record<string, { invested: number; currentValue: number; profit: number; count: number }> = {};
    Object.entries(byType).forEach(([type, data]) => {
      formattedByType[type] = {
        invested: data.totalInvested,
        currentValue: data.currentValue,
        profit: data.currentValue - data.totalInvested,
        count: data.count,
      };
    });

    return {
      totalInvested,
      totalCurrentValue: currentValue,
      totalProfit: profit,
      totalProfitPercentage: profitPercentage,
      byType: formattedByType,
      activeCount,
      soldCount,
    };
  }

  private formatInvestment(investment: any) {
    const invested = Number(investment.quantity) * Number(investment.purchasePrice);
    const currentPrice = investment.currentPrice ? Number(investment.currentPrice) : Number(investment.purchasePrice);
    const currentValue = Number(investment.quantity) * currentPrice;
    const profit = currentValue - invested;
    const profitPercentage = invested > 0 ? (profit / invested) * 100 : 0;

    return {
      ...investment,
      quantity: Number(investment.quantity),
      purchasePrice: Number(investment.purchasePrice),
      currentPrice: investment.currentPrice ? Number(investment.currentPrice) : null,
      salePrice: investment.salePrice ? Number(investment.salePrice) : null,
      // Campos calculados
      invested,
      currentValue,
      profit,
      profitPercentage,
    };
  }
}

export const investmentService = new InvestmentService();
