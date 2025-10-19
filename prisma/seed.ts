import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Categorias padrão de despesas
  const expenseCategories = [
    { name: 'Alimentação', icon: '🍔', color: '#EF4444' },
    { name: 'Transporte', icon: '🚗', color: '#F59E0B' },
    { name: 'Moradia', icon: '🏠', color: '#8B5CF6' },
    { name: 'Saúde', icon: '⚕️', color: '#10B981' },
    { name: 'Educação', icon: '📚', color: '#3B82F6' },
    { name: 'Lazer', icon: '🎮', color: '#EC4899' },
    { name: 'Compras', icon: '🛍️', color: '#14B8A6' },
    { name: 'Contas', icon: '📄', color: '#6366F1' },
    { name: 'Outros', icon: '📦', color: '#6B7280' },
  ];

  // Categorias padrão de receitas
  const incomeCategories = [
    { name: 'Salário', icon: '💼', color: '#10B981' },
    { name: 'Freelance', icon: '💻', color: '#3B82F6' },
    { name: 'Investimentos', icon: '📈', color: '#8B5CF6' },
    { name: 'Outros', icon: '💰', color: '#6B7280' },
  ];

  // Criar categorias de despesas
  for (const category of expenseCategories) {
    await prisma.category.upsert({
      where: { id: `default-expense-${category.name.toLowerCase()}` },
      update: {},
      create: {
        id: `default-expense-${category.name.toLowerCase()}`,
        name: category.name,
        type: 'EXPENSE',
        icon: category.icon,
        color: category.color,
        isDefault: true,
      },
    });
  }

  // Criar categorias de receitas
  for (const category of incomeCategories) {
    await prisma.category.upsert({
      where: { id: `default-income-${category.name.toLowerCase()}` },
      update: {},
      create: {
        id: `default-income-${category.name.toLowerCase()}`,
        name: category.name,
        type: 'INCOME',
        icon: category.icon,
        color: category.color,
        isDefault: true,
      },
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
