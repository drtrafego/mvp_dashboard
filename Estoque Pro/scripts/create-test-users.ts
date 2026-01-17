import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Get the main organization
    const org = await prisma.organization.findFirst({
        where: { name: 'Restaurante Exemplo' }
    });

    if (!org) {
        console.log('Organização não encontrada');
        return;
    }

    console.log('Usando organização:', org.name);

    const usersToCreate = [
        { email: 'gastaomatos@gmail.com', name: 'Gastão Matos' },
        { email: 'amandafelixgolden@gmail.com', name: 'Amanda Felix' }
    ];

    for (const userData of usersToCreate) {
        // Check if user exists
        const existing = await prisma.user.findFirst({
            where: { email: { equals: userData.email, mode: 'insensitive' } }
        });

        if (existing) {
            console.log('Usuário já existe:', userData.email);
            continue;
        }

        // Generate temp password
        const tempPassword = 'ChefControl2026';
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        // Create user
        await prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                privyId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'ADMIN',
                organizationId: org.id,
                passwordHash,
                tempPasswordExpiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            }
        });

        console.log('✅ Usuário criado:', userData.email);
        console.log('   Senha temporária: ChefControl2026');
    }

    console.log('\n🎉 Pronto! Faça login em https://www.chefcontrol.online/login');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
