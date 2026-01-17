"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

export async function getProducts() {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { products: [] }

        const products = await db.product.findMany({
            where: {
                organizationId: context.organizationId
            },
            include: {
                category: true,
                lastUpdatedBy: true,
            },
            orderBy: [
                { category: { name: "asc" } },
                { name: "asc" },
            ],
        })
        return { products }
    } catch (error) {
        console.error("Error fetching products:", error)
        return { error: "Erro ao buscar produtos" }
    }
}

export async function getProductsByCategory(categoryId: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { products: [] }

        const products = await db.product.findMany({
            where: {
                categoryId,
                organizationId: context.organizationId
            },
            include: {
                lastUpdatedBy: true,
            },
            orderBy: { name: "asc" },
        })
        return { products }
    } catch (error) {
        console.error("Error fetching products:", error)
        return { error: "Erro ao buscar produtos" }
    }
}

export async function createProduct(data: {
    name: string
    unit: string
    minStock: number
    currentStock: number
    expiresAt?: Date | null
    categoryId: string
    lastUpdatedById?: string
}) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        const product = await db.product.create({
            data: {
                name: data.name,
                unit: data.unit,
                minStock: data.minStock,
                currentStock: data.currentStock,
                expiresAt: data.expiresAt,
                categoryId: data.categoryId,
                lastUpdatedById: data.lastUpdatedById,
                organizationId: context.organizationId,
            },
        })
        revalidatePath("/admin/inventory")
        revalidatePath("/stock-entry")
        return { product }
    } catch (error) {
        console.error("Error creating product:", error)
        return { error: "Erro ao criar produto" }
    }
}

export async function updateProduct(id: string, data: {
    name?: string
    unit?: string
    minStock?: number
    currentStock?: number
    expiresAt?: Date | null
    categoryId?: string
    lastUpdatedById?: string
}) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        const product = await db.product.update({
            where: {
                id,
                organizationId: context.organizationId
            },
            data: {
                ...data,
                lastCountAt: new Date(),
            },
        })
        revalidatePath("/admin/inventory")
        revalidatePath("/stock-entry")
        return { product }
    } catch (error) {
        console.error("Error updating product:", error)
        return { error: "Erro ao atualizar produto" }
    }
}

export async function deleteProduct(id: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        await db.product.delete({
            where: {
                id,
                organizationId: context.organizationId
            },
        })
        revalidatePath("/admin/inventory")
        revalidatePath("/stock-entry")
        return { success: true }
    } catch (error) {
        console.error("Error deleting product:", error)
        return { error: "Erro ao excluir produto" }
    }
}
