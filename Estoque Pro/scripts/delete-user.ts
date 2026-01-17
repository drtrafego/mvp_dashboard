/**
 * Delete User Script
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/delete-user.ts juniorgastao@hotmail.com
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = process.argv[2];

    if (!email) {
        console.error('❌ Por favor, informe o email do usuário');
        console.log('Uso: npx ts-node --compiler-options \'{"module":"CommonJS"}\' scripts/delete-user.ts email@exemplo.com');
        process.exit(1);
    }

    console.log(`\n🔍 Buscando usuário: ${email}\n`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`❌ Usuário não encontrado: ${email}`);
        process.exit(1);
    }

    console.log(`✓ Usuário encontrado: ${user.name} (${user.email})`);
    console.log(`  ID: ${user.id}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  Organization: ${user.organizationId}\n`);

    // Count related records
    const stockLogCount = await prisma.stockLog.count({ where: { userId: user.id } });
    const productUpdatedCount = await prisma.product.count({ where: { lastUpdatedById: user.id } });
    const purchaseRequestCount = await prisma.purchaseRequest.count({ where: { createdById: user.id } });

    console.log(`📊 Registros relacionados:`);
    console.log(`   - ${stockLogCount} logs de estoque`);
    console.log(`   - ${productUpdatedCount} produtos atualizados por este usuário`);
    console.log(`   - ${purchaseRequestCount} requisições de compra criadas\n`);

    console.log(`🗑️ Deletando registros...\n`);

    // 1. Delete StockLogs
    const deletedLogs = await prisma.stockLog.deleteMany({
        where: { userId: user.id }
    });
    console.log(`   ✓ ${deletedLogs.count} logs de estoque deletados`);

    // 2. Clear lastUpdatedById on products
    const updatedProducts = await prisma.product.updateMany({
        where: { lastUpdatedById: user.id },
        data: { lastUpdatedById: null }
    });
    console.log(`   ✓ ${updatedProducts.count} produtos com referência limpa`);

    // 3. Transfer purchase requests to another admin
    const orgAdmin = await prisma.user.findFirst({
        where: {
            organizationId: user.organizationId,
            role: { in: ['ADMIN', 'SUPER_ADMIN'] },
            id: { not: user.id }
        }
    });

    if (orgAdmin) {
        const updatedRequests = await prisma.purchaseRequest.updateMany({
            where: { createdById: user.id },
            data: { createdById: orgAdmin.id }
        });
        console.log(`   ✓ ${updatedRequests.count} requisições de compra transferidas para ${orgAdmin.email}`);
    }

    // 4. Delete the user
    await prisma.user.delete({
        where: { id: user.id }
    });
    console.log(`   ✓ Usuário deletado`);

    console.log(`\n✅ Usuário ${email} e todos os dados relacionados foram removidos!\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
