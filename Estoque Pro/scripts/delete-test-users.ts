import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const emails = ['gastaomatos@gmail.com', 'amandafelixgolden@gmail.com'];

    for (const email of emails) {
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if (user) {
            console.log(`Encontrado: ${email} (ID: ${user.id}) - Deletando...`);
            await prisma.user.delete({ where: { id: user.id } });
            console.log(`✅ Deletado: ${email}`);
        } else {
            console.log(`❌ Não encontrado: ${email}`);
        }
    }

    console.log('\nVerificação concluída!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
