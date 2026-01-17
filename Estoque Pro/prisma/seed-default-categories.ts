import { db } from "../src/lib/db"

const DEFAULT_CATEGORIES = [
    "Proteínas",
    "Hortifruti",
    "Mercearia Seca",
    "Laticínios e Frios",
    "Molhos, Temperos e Condimentos",
    "Bebidas",
    "Padaria",
    "Sobremesas"
];

async function main() {
    console.log("🌱 Seeding default categories for all organizations...")

    const organizations = await db.organization.findMany();
    console.log(`Found ${organizations.length} organizations.`);

    for (const org of organizations) {
        console.log(`Processing org: ${org.name} (${org.id})`);

        for (const catName of DEFAULT_CATEGORIES) {
            const exists = await db.category.findFirst({
                where: {
                    organizationId: org.id,
                    name: { equals: catName, mode: "insensitive" }
                }
            });

            if (!exists) {
                await db.category.create({
                    data: {
                        name: catName,
                        organizationId: org.id
                    }
                });
                console.log(`   + Created: ${catName}`);
            }
        }
    }
    console.log("✅ Default categories seeded successfully.")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
