/**
 * Fill Empty Categories Script
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fill-empty-categories.ts [org-slug]
 * 
 * This script ONLY adds 4 products to categories that have NO products.
 * It does NOT delete any existing data.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Product templates for different category types
const productTemplates: Record<string, Array<{ name: string; unit: string; minStock: number; currentStock: number; unitPrice: number }>> = {
    // Default products for any category
    'default': [
        { name: 'Produto 1', unit: 'un', minStock: 5, currentStock: 15, unitPrice: 10.00 },
        { name: 'Produto 2', unit: 'kg', minStock: 3, currentStock: 12, unitPrice: 25.00 },
        { name: 'Produto 3', unit: 'L', minStock: 2, currentStock: 8, unitPrice: 18.50 },
        { name: 'Produto 4', unit: 'un', minStock: 10, currentStock: 30, unitPrice: 5.90 },
    ],
    // Proteínas
    'proteínas': [
        { name: 'Carne Moída', unit: 'kg', minStock: 5, currentStock: 15, unitPrice: 32.90 },
        { name: 'Peito de Frango', unit: 'kg', minStock: 3, currentStock: 10, unitPrice: 18.90 },
        { name: 'Bacon Fatiado', unit: 'kg', minStock: 2, currentStock: 5, unitPrice: 45.00 },
        { name: 'Bife de Alcatra', unit: 'kg', minStock: 3, currentStock: 8, unitPrice: 52.90 },
    ],
    // Laticínios
    'laticínios': [
        { name: 'Queijo Mussarela', unit: 'kg', minStock: 3, currentStock: 8, unitPrice: 42.00 },
        { name: 'Queijo Cheddar', unit: 'kg', minStock: 2, currentStock: 5, unitPrice: 55.00 },
        { name: 'Ovos', unit: 'dz', minStock: 5, currentStock: 15, unitPrice: 12.00 },
        { name: 'Manteiga', unit: 'kg', minStock: 2, currentStock: 4, unitPrice: 35.00 },
    ],
    // Hortifruti
    'hortifruti': [
        { name: 'Tomate', unit: 'kg', minStock: 5, currentStock: 12, unitPrice: 8.90 },
        { name: 'Cebola', unit: 'kg', minStock: 3, currentStock: 8, unitPrice: 5.90 },
        { name: 'Alface Americana', unit: 'un', minStock: 10, currentStock: 25, unitPrice: 4.50 },
        { name: 'Batata', unit: 'kg', minStock: 10, currentStock: 30, unitPrice: 6.50 },
    ],
    // Mercearia
    'mercearia': [
        { name: 'Farinha de Trigo', unit: 'kg', minStock: 5, currentStock: 20, unitPrice: 5.50 },
        { name: 'Arroz', unit: 'kg', minStock: 10, currentStock: 50, unitPrice: 6.90 },
        { name: 'Feijão Carioca', unit: 'kg', minStock: 5, currentStock: 25, unitPrice: 8.50 },
        { name: 'Óleo de Soja', unit: 'L', minStock: 5, currentStock: 12, unitPrice: 7.90 },
    ],
    // Bebidas
    'bebidas': [
        { name: 'Coca-Cola 2L', unit: 'un', minStock: 10, currentStock: 24, unitPrice: 9.90 },
        { name: 'Água Mineral 500ml', unit: 'un', minStock: 24, currentStock: 48, unitPrice: 2.50 },
        { name: 'Suco de Laranja 1L', unit: 'un', minStock: 6, currentStock: 12, unitPrice: 8.90 },
        { name: 'Cerveja Lata 350ml', unit: 'un', minStock: 24, currentStock: 48, unitPrice: 4.50 },
    ],
    // Pães e Massas
    'pães e massas': [
        { name: 'Pão de Hambúrguer', unit: 'un', minStock: 20, currentStock: 50, unitPrice: 1.50 },
        { name: 'Massa de Pizza', unit: 'un', minStock: 10, currentStock: 25, unitPrice: 5.00 },
        { name: 'Pão Francês', unit: 'un', minStock: 50, currentStock: 100, unitPrice: 0.80 },
        { name: 'Macarrão Espaguete', unit: 'kg', minStock: 5, currentStock: 15, unitPrice: 7.50 },
    ],
    // Temperos
    'temperos': [
        { name: 'Sal Refinado', unit: 'kg', minStock: 2, currentStock: 5, unitPrice: 3.50 },
        { name: 'Pimenta do Reino', unit: 'g', minStock: 100, currentStock: 300, unitPrice: 0.15 },
        { name: 'Alho Picado', unit: 'kg', minStock: 1, currentStock: 3, unitPrice: 28.00 },
        { name: 'Orégano', unit: 'g', minStock: 100, currentStock: 250, unitPrice: 0.08 },
    ],
    // Limpeza
    'limpeza': [
        { name: 'Detergente 500ml', unit: 'un', minStock: 10, currentStock: 24, unitPrice: 2.90 },
        { name: 'Desinfetante 2L', unit: 'un', minStock: 5, currentStock: 12, unitPrice: 8.50 },
        { name: 'Esponja de Aço', unit: 'pct', minStock: 10, currentStock: 20, unitPrice: 3.50 },
        { name: 'Papel Toalha', unit: 'rolo', minStock: 12, currentStock: 24, unitPrice: 4.90 },
    ],
    // Descartáveis
    'descartáveis': [
        { name: 'Copo Plástico 200ml', unit: 'pct', minStock: 5, currentStock: 10, unitPrice: 8.00 },
        { name: 'Guardanapo', unit: 'pct', minStock: 10, currentStock: 20, unitPrice: 5.50 },
        { name: 'Embalagem Marmitex', unit: 'un', minStock: 50, currentStock: 100, unitPrice: 1.20 },
        { name: 'Sacola Plástica', unit: 'pct', minStock: 10, currentStock: 20, unitPrice: 12.00 },
    ],
};

function getProductsForCategory(categoryName: string): Array<{ name: string; unit: string; minStock: number; currentStock: number; unitPrice: number }> {
    const normalizedName = categoryName.toLowerCase();

    // Try to find a matching template
    for (const [key, products] of Object.entries(productTemplates)) {
        if (key !== 'default' && normalizedName.includes(key)) {
            return products;
        }
    }

    // Return default products with category name prefix
    return productTemplates['default'].map((p, i) => ({
        ...p,
        name: `${categoryName} - Item ${i + 1}`
    }));
}

async function getOrganizationId(): Promise<string> {
    const orgSlug = process.argv[2];

    if (orgSlug) {
        const org = await prisma.organization.findUnique({ where: { slug: orgSlug } });
        if (org) return org.id;
    }

    // Use first organization
    const firstOrg = await prisma.organization.findFirst();
    if (!firstOrg) throw new Error('Nenhuma organização encontrada');

    console.log(`Usando organização: ${firstOrg.name} (${firstOrg.slug})`);
    return firstOrg.id;
}

async function main() {
    const organizationId = await getOrganizationId();

    // Get first admin user for createdBy
    const adminUser = await prisma.user.findFirst({
        where: { organizationId, role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
    });
    if (!adminUser) throw new Error('Nenhum admin encontrado');

    // Get all categories with their product counts
    const categories = await prisma.category.findMany({
        where: { organizationId },
        include: {
            _count: {
                select: { products: true }
            }
        }
    });

    console.log(`\n📦 Encontradas ${categories.length} categorias:\n`);

    let filledCount = 0;
    let skippedCount = 0;

    for (const category of categories) {
        const productCount = category._count.products;

        if (productCount > 0) {
            console.log(`   ⏭️  ${category.name}: ${productCount} produtos (pulando)`);
            skippedCount++;
            continue;
        }

        console.log(`   ➕ ${category.name}: vazia - adicionando 4 produtos...`);

        const productsToAdd = getProductsForCategory(category.name);

        for (const product of productsToAdd) {
            await prisma.product.create({
                data: {
                    name: product.name,
                    unit: product.unit,
                    minStock: product.minStock,
                    currentStock: product.currentStock,
                    unitPrice: product.unitPrice,
                    categoryId: category.id,
                    organizationId,
                    lastUpdatedById: adminUser.id
                }
            });
        }

        filledCount++;
    }

    console.log('\n✅ Concluído!');
    console.log(`   - ${filledCount} categorias preenchidas com 4 produtos cada`);
    console.log(`   - ${skippedCount} categorias puladas (já tinham produtos)`);
    console.log(`   - ${filledCount * 4} produtos adicionados no total\n`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
