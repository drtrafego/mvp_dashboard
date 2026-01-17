import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EMAILS_TO_DELETE = [
    'contato@drtrafego.com',
    'juniorgastao@hotmail.com',
    'gastaomatos@gmail.com'
];

async function main() {
    console.log('🧹 Starting cleanup for specific users...');

    for (const email of EMAILS_TO_DELETE) {
        console.log(`\nChecking: ${email}`);

        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } },
            include: { organization: true }
        });

        if (!user) {
            console.log(`❌ User not found: ${email}`);
            continue;
        }

        const orgId = user.organizationId;
        const userName = user.name || user.email;
        const orgName = user.organization?.name;

        console.log(`✅ Found user: ${userName} (ID: ${user.id})`);
        if (orgName) console.log(`   Organization: ${orgName} (ID: ${orgId})`);

        // Delete StockLog entries for this user first
        const deletedLogs = await prisma.stockLog.deleteMany({
            where: { userId: user.id }
        });
        console.log(`   Deleted ${deletedLogs.count} stock logs.`);

        // Delete the user
        await prisma.user.delete({
            where: { id: user.id }
        });
        console.log(`   🗑️  User deleted.`);

        // Check if organization is empty and delete it
        if (orgId) {
            const remainingUsers = await prisma.user.count({
                where: { organizationId: orgId }
            });

            if (remainingUsers === 0) {
                // Delete dependants first
                await prisma.product.deleteMany({ where: { organizationId: orgId } });
                await prisma.category.deleteMany({ where: { organizationId: orgId } });
                await prisma.settings.deleteMany({ where: { organizationId: orgId } });

                await prisma.organization.delete({
                    where: { id: orgId }
                });
                console.log(`   🗑️  Organization "${orgName}" deleted (was empty).`);
            } else {
                console.log(`   ⚠️  Organization "${orgName}" kept (${remainingUsers} users remaining).`);
            }
        }
    }

    console.log('\n✨ Cleanup finished.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
