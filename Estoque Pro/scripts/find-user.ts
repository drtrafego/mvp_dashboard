import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        where: {
            OR: [
                { email: { contains: 'junior' } },
                { email: { contains: 'gastao' } }
            ]
        },
        select: { id: true, email: true, name: true }
    });

    console.log('Usuários encontrados:');
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
