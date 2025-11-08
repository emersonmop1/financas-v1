import prisma from '../config/database';
import { CategoryType } from '@prisma/client';

interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
  color?: string;
  icon?: string;
}

interface UpdateCategoryDTO {
  name?: string;
  color?: string;
  icon?: string;
}

export class CategoryService {
  async findAll(userId: string) {
    // Buscar categorias padrão e do usuário
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return categories;
  }

  async findByType(userId: string, type: CategoryType) {
    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId }, { isDefault: true }],
        type,
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return categories;
  }

  async create(userId: string, data: CreateCategoryDTO) {
    const category = await prisma.category.create({
      data: {
        userId,
        name: data.name,
        type: data.type,
        color: data.color || '#3B82F6',
        icon: data.icon || '💰',
        isDefault: false,
      },
    });

    return category;
  }

  async update(id: string, userId: string, data: UpdateCategoryDTO) {
    // Verificar se a categoria existe e pertence ao usuário
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category.isDefault) {
      throw new Error('Não é possível editar categorias padrão');
    }

    const updatedCategory = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        color: data.color,
        icon: data.icon,
      },
    });

    return updatedCategory;
  }

  async delete(id: string, userId: string) {
    // Não permitir deletar categorias padrão
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw new Error('Categoria não encontrada');
    }

    if (category.isDefault) {
      throw new Error('Não é possível deletar categorias padrão');
    }

    // Verificar se existem transações usando esta categoria
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    });

    if (transactionCount > 0) {
      throw new Error(
        `Não é possível deletar esta categoria pois existem ${transactionCount} transações vinculadas a ela`
      );
    }

    await prisma.category.delete({
      where: { id },
    });
  }
}
