import prisma from '../config/database';
import { GoalStatus, GoalType, GoalPeriod } from '@prisma/client';

interface CreateGoalDTO {
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount?: number;
  categoryId?: string;
  period: GoalPeriod;
  startDate?: Date;
  deadline?: Date;
  description?: string;
  icon?: string;
  color?: string;
}

interface UpdateGoalDTO {
  name?: string;
  type?: GoalType;
  targetAmount?: number;
  currentAmount?: number;
  categoryId?: string;
  period?: GoalPeriod;
  startDate?: Date;
  deadline?: Date;
  description?: string;
  icon?: string;
  color?: string;
  status?: GoalStatus;
}

export class GoalService {
  async create(userId: string, data: CreateGoalDTO) {
    const goal = await prisma.goal.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        targetAmount: data.targetAmount,
        currentAmount: data.currentAmount || 0,
        categoryId: data.categoryId,
        period: data.period,
        startDate: data.startDate && !isNaN(data.startDate.getTime()) ? data.startDate : undefined,
        deadline: data.deadline && !isNaN(data.deadline.getTime()) ? data.deadline : undefined,
        description: data.description,
        icon: data.icon,
        color: data.color,
        status: 'ACTIVE',
      },
      include: {
        category: true,
      },
    });

    return goal;
  }

  async findAll(userId: string, status?: GoalStatus) {
    const where: any = { userId };

    if (status) {
      where.status = status;
    }

    const goals = await prisma.goal.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
    });

    // Adicionar progresso calculado
    return goals.map((goal) => ({
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      progress: this.calculateProgress(
        Number(goal.currentAmount),
        Number(goal.targetAmount)
      ),
    }));
  }

  async findById(id: string, userId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id, userId },
      include: {
        category: true,
      },
    });

    if (!goal) {
      throw new Error('Meta não encontrada');
    }

    return {
      ...goal,
      targetAmount: Number(goal.targetAmount),
      currentAmount: Number(goal.currentAmount),
      progress: this.calculateProgress(
        Number(goal.currentAmount),
        Number(goal.targetAmount)
      ),
    };
  }

  async update(id: string, userId: string, data: UpdateGoalDTO) {
    // Verificar se a meta pertence ao usuário
    await this.findById(id, userId);

    // Tratar datas inválidas
    const updateData = {
      ...data,
      startDate: data.startDate && !isNaN(data.startDate.getTime()) ? data.startDate : undefined,
      deadline: data.deadline && !isNaN(data.deadline.getTime()) ? data.deadline : undefined,
    };

    const goal = await prisma.goal.update({
      where: { id },
      data: updateData,
    });

    // Verificar se a meta foi completada
    if (
      data.currentAmount &&
      data.currentAmount >= Number(goal.targetAmount) &&
      goal.status === 'ACTIVE'
    ) {
      await prisma.goal.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });
    }

    return goal;
  }

  async delete(id: string, userId: string) {
    // Verificar se a meta pertence ao usuário
    await this.findById(id, userId);

    await prisma.goal.delete({
      where: { id },
    });
  }

  async addProgress(id: string, userId: string, amount: number) {
    const goal = await this.findById(id, userId);

    const newAmount = Number(goal.currentAmount) + amount;
    const isCompleted = newAmount >= Number(goal.targetAmount);

    await prisma.goal.update({
      where: { id },
      data: {
        currentAmount: newAmount,
        status: isCompleted ? 'COMPLETED' : goal.status,
      },
    });

    return this.findById(id, userId);
  }

  async getStats(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
    });

    const active = goals.filter((g) => g.status === 'ACTIVE').length;
    const completed = goals.filter((g) => g.status === 'COMPLETED').length;
    const cancelled = goals.filter((g) => g.status === 'CANCELLED').length;

    const totalTarget = goals
      .filter((g) => g.status === 'ACTIVE')
      .reduce((sum, g) => sum + Number(g.targetAmount), 0);

    const totalSaved = goals
      .filter((g) => g.status === 'ACTIVE')
      .reduce((sum, g) => sum + Number(g.currentAmount), 0);

    return {
      total: goals.length,
      active,
      completed,
      cancelled,
      totalTarget,
      totalSaved,
      overallProgress: totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0,
    };
  }

  private calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  }
}
