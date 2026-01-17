import { db } from "../src/lib/db"

async function main() {
    console.log("🌱 Seeding database...")

    // 1. Create Organization
    const org = await db.organization.upsert({
        where: { slug: "restaurante-exemplo" },
        update: {},
        create: {
            name: "Restaurante Exemplo",
            slug: "restaurante-exemplo",
            plan: "PRO",
        },
    })
    console.log("✅ Organization created:", org.name)

    // 2. Create Users linked to Organization
    const admin = await db.user.upsert({
        where: { email: "dr.trafego@gmail.com" },
        update: {
            role: "SUPER_ADMIN",
            organizationId: org.id,
        },
        create: {
            email: "dr.trafego@gmail.com",
            name: "Admin",
            privyId: "did:privy:admin-dummy-id",
            role: "SUPER_ADMIN",
            organizationId: org.id,
        },
    })
    console.log("✅ Admin user created:", admin.email)

    const staff = await db.user.upsert({
        where: { email: "staff@gmail.com" },
        update: {},
        create: {
            email: "staff@gmail.com",
            name: "Staff",
            privyId: "did:privy:staff-dummy-id",
            role: "STAFF",
            organizationId: org.id,
        },
    })
    console.log("✅ Staff user created:", staff.email)

    // 3. Create Categories linked to Organization
    const proteinas = await db.category.upsert({
        where: { id: "cat-proteinas" },
        update: {},
        create: {
            id: "cat-proteinas",
            name: "Proteínas",
            organizationId: org.id,
        },
    })

    const laticinios = await db.category.upsert({
        where: { id: "cat-laticinios" },
        update: {},
        create: {
            id: "cat-laticinios",
            name: "Laticínios",
            organizationId: org.id,
        },
    })

    const bebidas = await db.category.upsert({
        where: { id: "cat-bebidas" },
        update: {},
        create: {
            id: "cat-bebidas",
            name: "Bebidas",
            organizationId: org.id,
        },
    })
    console.log("✅ Categories created")

    // 4. Create Products linked to Organization
    await db.product.upsert({
        where: { id: "prod-carne" },
        update: {},
        create: {
            id: "prod-carne",
            name: "Carne de Sol",
            unit: "kg",
            minStock: 10,
            currentStock: 15,
            expiresAt: new Date("2026-01-15"),
            categoryId: proteinas.id,
            organizationId: org.id,
            lastUpdatedById: admin.id,
        },
    })

    await db.product.upsert({
        where: { id: "prod-queijo" },
        update: {},
        create: {
            id: "prod-queijo",
            name: "Queijo Coalho",
            unit: "kg",
            minStock: 5,
            currentStock: 2,
            expiresAt: new Date("2026-01-05"),
            categoryId: laticinios.id,
            organizationId: org.id,
            lastUpdatedById: admin.id,
        },
    })

    await db.product.upsert({
        where: { id: "prod-leite" },
        update: {},
        create: {
            id: "prod-leite",
            name: "Leite",
            unit: "L",
            minStock: 20,
            currentStock: 25,
            expiresAt: new Date("2025-12-30"),
            categoryId: laticinios.id,
            organizationId: org.id,
            lastUpdatedById: staff.id,
        },
    })

    await db.product.upsert({
        where: { id: "prod-agua" },
        update: {},
        create: {
            id: "prod-agua",
            name: "Água Mineral",
            unit: "L",
            minStock: 50,
            currentStock: 100,
            expiresAt: null,
            categoryId: bebidas.id,
            organizationId: org.id,
            lastUpdatedById: admin.id,
        },
    })
    console.log("✅ Products created")

    // 5. Create Pizzeria Categories
    const hortifruti = await db.category.upsert({
        where: { id: "cat-hortifruti" },
        update: {},
        create: { id: "cat-hortifruti", name: "Hortifruti", organizationId: org.id },
    })

    const mercearia = await db.category.upsert({
        where: { id: "cat-mercearia" },
        update: {},
        create: { id: "cat-mercearia", name: "Mercearia", organizationId: org.id },
    })

    // 6. Create Pizzeria Products (15 items with various states)
    const pizzaProducts = [
        // OK Stock
        { id: "pizz-farinha", name: "Farinha de Trigo Premium", unit: "kg", min: 10, stock: 50, price: 4.50, expiry: "2026-12-31", cat: mercearia.id },
        { id: "pizz-queijo", name: "Queijo Mussarela", unit: "kg", min: 5, stock: 12, price: 38.90, expiry: "2026-02-15", cat: laticinios.id },
        { id: "pizz-oregano", name: "Orégano Seco", unit: "g", min: 500, stock: 1000, price: 0.08, expiry: "2027-01-01", cat: mercearia.id },
        { id: "pizz-cebola", name: "Cebola Roxa", unit: "kg", min: 2, stock: 5, price: 6.99, expiry: "2026-01-20", cat: hortifruti.id },
        { id: "pizz-refri", name: "Refrigerante Cola 2L", unit: "un", min: 24, stock: 48, price: 8.50, expiry: "2026-06-01", cat: bebidas.id },
        { id: "pizz-ovo", name: "Ovo Extra", unit: "un", min: 30, stock: 60, price: 0.80, expiry: "2026-01-25", cat: proteinas.id },
        { id: "pizz-bacon", name: "Bacon em Cubos", unit: "kg", min: 2, stock: 8, price: 32.50, expiry: "2026-03-10", cat: proteinas.id },

        // Low Stock (current < min)
        { id: "pizz-azeite", name: "Azeite de Oliva Extra Virgem", unit: "L", min: 5, stock: 2, price: 45.00, expiry: "2027-05-20", cat: mercearia.id },
        { id: "pizz-presunto", name: "Presunto Cozido", unit: "kg", min: 4, stock: 1.5, price: 28.90, expiry: "2026-02-01", cat: proteinas.id },
        { id: "pizz-fermento", name: "Fermento Biológico Seco", unit: "g", min: 500, stock: 100, price: 0.12, expiry: "2026-08-15", cat: mercearia.id },

        // Out of Stock (stock 0)
        { id: "pizz-calabresa", name: "Linguiça Calabresa Defumada", unit: "kg", min: 10, stock: 0, price: 22.90, expiry: "2026-04-12", cat: proteinas.id },
        { id: "pizz-azeitona", name: "Azeitona Preta Fatiada", unit: "kg", min: 3, stock: 0, price: 35.00, expiry: "2026-09-30", cat: mercearia.id },

        // Expired (expiry < now) - Assuming 'now' is Jan 2026
        { id: "pizz-tomate", name: "Tomate Italiano", unit: "kg", min: 5, stock: 10, price: 8.99, expiry: "2025-12-25", cat: hortifruti.id },
        { id: "pizz-manjericao", name: "Manjericão Fresco", unit: "maço", min: 5, stock: 2, price: 3.50, expiry: "2025-12-31", cat: hortifruti.id },
        { id: "pizz-molho", name: "Molho de Tomate Artesanal", unit: "L", min: 10, stock: 4, price: 12.00, expiry: "2025-11-20", cat: mercearia.id },
    ]

    for (const p of pizzaProducts) {
        await db.product.upsert({
            where: { id: p.id },
            update: {
                unitPrice: p.price,
            },
            create: {
                id: p.id,
                name: p.name,
                unit: p.unit,
                minStock: p.min,
                currentStock: p.stock,
                unitPrice: p.price,
                expiresAt: p.expiry ? new Date(p.expiry) : null,
                categoryId: p.cat,
                organizationId: org.id,
                lastUpdatedById: admin.id,
            },
        })
    }
    console.log("✅ Pizzeria products created")

    console.log("🎉 Seed completed!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
