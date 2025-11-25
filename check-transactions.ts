import prisma from './src/config/database';

async function checkTransactions() {
  try {
    console.log('🔍 Verificando transações no banco de dados...\n');

    // Contar total de transações
    const totalTransactions = await prisma.transaction.count();
    console.log(`📊 Total de transações: ${totalTransactions}`);

    if (totalTransactions === 0) {
      console.log('\n⚠️  Não há transações no banco de dados!');
      return;
    }

    // Listar algumas transações
    const transactions = await prisma.transaction.findMany({
      take: 5,
      include: {
        category: true,
        account: true,
        creditCard: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    console.log('\n📝 Últimas 5 transações:');
    transactions.forEach((t, i) => {
      console.log(`\n${i + 1}. ${t.description}`);
      console.log(`   Valor: R$ ${t.amount}`);
      console.log(`   Tipo: ${t.type}`);
      console.log(`   Data: ${t.date}`);
      console.log(`   Categoria: ${t.category.name}`);
      console.log(`   Conta: ${t.account?.name || 'N/A'}`);
      console.log(`   Cartão: ${t.creditCard?.name || 'N/A'}`);
      console.log(`   Pago: ${t.isPaid ? 'Sim' : 'Não'}`);
    });

    // Verificar contas
    const accounts = await prisma.account.findMany();
    console.log(`\n💰 Total de contas: ${accounts.length}`);

    // Verificar cartões
    const creditCards = await prisma.creditCard.findMany();
    console.log(`💳 Total de cartões: ${creditCards.length}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTransactions();
