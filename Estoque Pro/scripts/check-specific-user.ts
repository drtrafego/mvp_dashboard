import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'contato@drtrafego.com';
    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findFirst({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { organization: true }
    });

    if (user) {
        console.log('='.repeat(50));
        console.log('✅ USUÁRIO ENCONTRADO');
        console.log('Email:', user.email);
        console.log('Nome:', user.name);
        console.log('PrivyID:', user.privyId);
        console.log('Role:', user.role);
        console.log('Criado em:', user.createdAt);
        console.log('');
        console.log('ORGANIZACAO:');
        console.log('Nome:', user.organization?.name);
        console.log('Plano:', user.organization?.plan);
        console.log('Status Assinatura:', user.organization?.subscriptionStatus);
        console.log('='.repeat(50));
    } else {
        console.log('❌ NÃO ENCONTRADO:', email);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
