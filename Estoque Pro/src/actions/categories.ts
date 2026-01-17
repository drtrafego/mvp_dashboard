"use server"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

export async function getCategories() {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { categories: [] }

        const categories = await db.category.findMany({
            where: {
                organizationId: context.organizationId
            },
            include: {
                products: true,
            },
            orderBy: {
                name: "asc",
            },
        })
        return { categories }
    } catch (error) {
        console.error("Error fetching categories:", error)
        return { error: "Erro ao buscar categorias" }
    }
}

export async function createCategory(name: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        const category = await db.category.create({
            data: {
                name,
                organizationId: context.organizationId
            },
        })
        revalidatePath("/admin/inventory")
        return { category }
    } catch (error) {
        console.error("Error creating category:", error)
        return { error: "Erro ao criar categoria" }
    }
}

export async function updateCategory(id: string, name: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        const category = await db.category.update({
            where: {
                id,
                organizationId: context.organizationId
            },
            data: { name },
        })
        revalidatePath("/admin/inventory")
        return { category }
    } catch (error) {
        console.error("Error updating category:", error)
        return { error: "Erro ao atualizar categoria" }
    }
}

export async function deleteCategory(id: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        await db.category.delete({
            where: {
                id,
                organizationId: context.organizationId
            },
        })
        revalidatePath("/admin/inventory")
        return { success: true }
    } catch (error) {
        console.error("Error deleting category:", error)
        return { error: "Erro ao excluir categoria" }
    }
}
