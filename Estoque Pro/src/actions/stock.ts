"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

export async function updateStock(updates: {
    productId: string
    currentStock: number
    expiresAt?: Date | null
    userId: string
}[]) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        const results = await Promise.all(
            updates.map(async (update) => {
                // Verify product ownership
                const existingProduct = await db.product.findUnique({
                    where: {
                        id: update.productId,
                        organizationId: context.organizationId!
                    },
                })

                if (!existingProduct) return null

                const product = await db.product.update({
                    where: { id: update.productId },
                    data: {
                        currentStock: update.currentStock,
                        expiresAt: update.expiresAt,
                        lastCountAt: new Date(),
                        lastUpdatedById: update.userId,
                    },
                })

                // Log the change
                await db.stockLog.create({
                    data: {
                        previousStock: existingProduct.currentStock,
                        newStock: update.currentStock,
                        action: "UPDATE",
                        responsible: context.userName || "Usuário",
                        productId: update.productId,
                        userId: update.userId,
                        organizationId: context.organizationId!,
                    },
                })

                return product
            })
        )

        revalidatePath("/admin/inventory")
        revalidatePath("/stock-entry")

        const validResults = results.filter(r => r !== null)

        // Calculate summary
        // Note: minStock logic might need checking against updated product, here simple length check
        return {
            success: true,
            updated: validResults.length,
            lowStock: 0, // Simplified for now
        }
    } catch (error) {
        console.error("Error updating stock:", error)
        return { error: "Erro ao atualizar estoque" }
    }
}

export async function getStockForEntry(categoryId?: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { products: [] }

        const where: any = {
            organizationId: context.organizationId
        }

        if (categoryId) {
            where.categoryId = categoryId
        }

        const products = await db.product.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: [
                { category: { name: "asc" } },
                { name: "asc" },
            ],
        })
        return { products }
    } catch (error) {
        console.error("Error fetching stock:", error)
        return { error: "Erro ao buscar estoque" }
    }
}
