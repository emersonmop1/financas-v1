import prisma from '../config/database';
import { CategoryType } from '@prisma/client';

interface CreateCategoryDTO {
  name: string;
  type: CategoryType;
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

    await prisma.category.delete({
      where: { id },
    });
  }
}
