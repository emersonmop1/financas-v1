import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { authConfig } from '../config/auth';
import { LoginDTO, RegisterDTO, AuthResponse } from '../types';

export class AuthService {
  private async createDefaultCategories(userId: string) {
    // Categorias padrão de despesa
    const expenseCategories = [
      { name: 'Mercado', icon: '🛒', color: '#10B981', type: 'EXPENSE' },
      { name: 'Restaurantes', icon: '🍽️', color: '#F59E0B', type: 'EXPENSE' },
      { name: 'Transporte', icon: '🚗', color: '#3B82F6', type: 'EXPENSE' },
      { name: 'Moradia', icon: '🏠', color: '#8B5CF6', type: 'EXPENSE' },
      { name: 'Saúde', icon: '⚕️', color: '#EF4444', type: 'EXPENSE' },
      { name: 'Educação', icon: '📚', color: '#06B6D4', type: 'EXPENSE' },
      { name: 'Lazer', icon: '🎮', color: '#EC4899', type: 'EXPENSE' },
      { name: 'Viagem', icon: '✈️', color: '#14B8A6', type: 'EXPENSE' },
      { name: 'Doações', icon: '🤝', color: '#A855F7', type: 'EXPENSE' },
      { name: 'Compras', icon: '🛍️', color: '#F97316', type: 'EXPENSE' },
      { name: 'Serviços', icon: '🔧', color: '#64748B', type: 'EXPENSE' },
      { name: 'Outros', icon: '💰', color: '#6B7280', type: 'EXPENSE' },
    ];

    // Categorias padrão de receita
    const incomeCategories = [
      { name: 'Salário', icon: '💼', color: '#10B981', type: 'INCOME' },
      { name: 'Freelance', icon: '💻', color: '#3B82F6', type: 'INCOME' },
      { name: 'Investimentos', icon: '📈', color: '#8B5CF6', type: 'INCOME' },
      { name: 'Outros', icon: '💵', color: '#6B7280', type: 'INCOME' },
    ];

    const allCategories = [...expenseCategories, ...incomeCategories];

    // Criar todas as categorias em uma transação
    await prisma.$transaction(
      allCategories.map((category) =>
        prisma.category.create({
          data: {
            userId,
            name: category.name,
            icon: category.icon,
            color: category.color,
            type: category.type as 'INCOME' | 'EXPENSE',
            isDefault: true,
          },
        })
      )
    );
  }

  async register(data: RegisterDTO): Promise<AuthResponse> {
    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
      },
    });

    // Criar categorias padrão para o novo usuário
    await this.createDefaultCategories(user.id);

    // Gerar token
    const token = jwt.sign({ userId: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async login(data: LoginDTO): Promise<AuthResponse> {
    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(data.password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Gerar token
    const token = jwt.sign({ userId: user.id }, authConfig.jwt.secret, {
      expiresIn: authConfig.jwt.expiresIn,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  }
}
