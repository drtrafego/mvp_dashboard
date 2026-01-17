import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const searchTerm = 'juniorgastao';
    console.log(`Searching for users containing: ${searchTerm}`);

    const users = await prisma.user.findMany({
        where: {
            email: { contains: searchTerm, mode: 'insensitive' }
        },
        include: { organization: true }
    });

    if (users.length === 0) {
        console.log('❌ Nenhum usuário encontrado com esse email.');
    } else {
        for (let user of users) {
            console.log('='.repeat(50));
            console.log('✅ USUÁRIO ENCONTRADO');
            console.log('Email:', user.email);
            console.log('Nome:', user.name);
            console.log('Role:', user.role);
            console.log('Tem senha:', user.passwordHash ? 'SIM' : 'NAO');
            console.log('Criado em:', user.createdAt);
            console.log('');
            console.log('ORGANIZACAO:');
            console.log('Nome:', user.organization?.name);
            console.log('Slug:', user.organization?.slug);
            console.log('Plano:', user.organization?.plan);
            console.log('Status Assinatura:', user.organization?.subscriptionStatus);
            console.log('Expira em:', user.organization?.subscriptionExpiresAt);
            console.log('='.repeat(50));
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
