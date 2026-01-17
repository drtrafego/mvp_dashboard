import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Check for organization with gastaomatos
    const orgs = await prisma.organization.findMany({
        where: {
            OR: [
                { name: { contains: 'gastao', mode: 'insensitive' } },
                { name: { contains: 'Gastão', mode: 'insensitive' } },
                { stripeCustomerId: { not: null } }
            ]
        },
        include: {
            users: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    console.log('Organizações com stripe ou nome gastao:', orgs.length);

    for (const org of orgs) {
        console.log('---');
        console.log('Nome:', org.name);
        console.log('Slug:', org.slug);
        console.log('Stripe Customer:', org.stripeCustomerId);
        console.log('Subscription:', org.stripeSubscriptionId);
        console.log('Status:', org.subscriptionStatus);
        console.log('Usuários:', org.users.map(u => u.email).join(', '));
        console.log('Criado:', org.createdAt);
    }

    // Also check all users
    console.log('\n\n=== TODOS OS USUÁRIOS ===\n');
    const allUsers = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { organization: true }
    });

    for (const u of allUsers) {
        console.log('Email:', u.email, '| Org:', u.organization?.name || 'SEM ORG', '| Role:', u.role);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
