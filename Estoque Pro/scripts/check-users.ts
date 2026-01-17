import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emails = ['gastaomatos@gmail.com', 'amandafelixgolden@gmail.com'];

    for (const email of emails) {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: { organization: true }
        });

        if (user) {
            console.log('='.repeat(50));
            console.log('✅ USUÁRIO ENCONTRADO');
            console.log('Email:', user.email);
            console.log('Nome:', user.name);
            console.log('Role:', user.role);
            console.log('Tem senha:', user.passwordHash ? 'SIM' : 'NAO (Gmail)');
            console.log('Criado em:', user.createdAt);
            console.log('');
            console.log('ORGANIZACAO:');
            console.log('Nome:', user.organization?.name);
            console.log('Slug:', user.organization?.slug);
            console.log('Plano:', user.organization?.plan);
            console.log('Status Assinatura:', user.organization?.subscriptionStatus);
            console.log('='.repeat(50));
        } else {
            console.log('❌ NÃO ENCONTRADO:', email);
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
