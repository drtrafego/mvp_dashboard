"use server"

import { db } from "@/lib/db"
import { getTenantContext, hasRole } from "@/lib/tenant"
import { revalidatePath } from "next/cache"

export async function getUsers() {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { users: [] }

        const users = await db.user.findMany({
            where: {
                organizationId: context.organizationId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" },
        })
        return { users }
    } catch (error) {
        console.error("Error fetching users:", error)
        return { error: "Erro ao buscar usuários" }
    }
}

import { stackServerApp } from "@/lib/stack"

export async function createUser(data: {
    name: string
    email: string
    role: "ADMIN" | "STAFF"
    password?: string
}) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        // SECURITY: Only ADMIN or SUPER_ADMIN can create users
        if (!hasRole(context, "ADMIN")) {
            return { error: "Apenas administradores podem criar usuários" }
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email)) {
            return { error: "Email inválido" }
        }

        // Validate name length
        if (!data.name || data.name.trim().length < 2) {
            return { error: "Nome deve ter pelo menos 2 caracteres" }
        }

        const existingUser = await db.user.findUnique({
            where: { email: data.email },
        })

        if (existingUser) {
            return { error: "Email já cadastrado" }
        }

        let privyId = `pending:${data.email}`

        if (data.password) {
            if (data.password.length < 6) {
                return { error: "Senha deve ter pelo menos 6 caracteres" }
            }
            try {
                const stackUser = await stackServerApp.createUser({
                    primaryEmail: data.email,
                    password: data.password,
                    displayName: data.name
                });
                privyId = stackUser.id;
            } catch (e: any) {
                console.error("Stack Auth create error", e)
                return { error: "Erro ao criar usuário no sistema de autenticação: " + (e.message || "") }
            }
        }

        const user = await db.user.create({
            data: {
                name: data.name.trim(),
                email: data.email.toLowerCase().trim(),
                role: data.role,
                privyId: privyId,
                organizationId: context.organizationId,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
            },
        })

        revalidatePath("/admin/users")
        return { user }
    } catch (error) {
        console.error("Error creating user:", error)
        return { error: "Erro ao criar usuário" }
    }
}

export async function deleteUser(id: string) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) return { error: "Sem permissão" }

        // SECURITY: Only ADMIN or SUPER_ADMIN can delete users
        if (!hasRole(context, "ADMIN")) {
            return { error: "Apenas administradores podem excluir usuários" }
        }

        // Validate ID format
        if (!id || typeof id !== "string" || id.length === 0) {
            return { error: "ID de usuário inválido" }
        }

        // Prevent self-deletion
        if (id === context.userId) {
            return { error: "Você não pode excluir sua própria conta" }
        }

        // Delete related StockLog records (userId is required, cannot set to null)
        await db.stockLog.deleteMany({
            where: { userId: id }
        })

        // Also clean up lastUpdatedBy references on products
        await db.product.updateMany({
            where: { lastUpdatedById: id },
            data: { lastUpdatedById: null }
        })

        await db.user.delete({
            where: {
                id,
                organizationId: context.organizationId
            },
        })
        revalidatePath("/admin/users")
        return { success: true }
    } catch (error) {
        console.error("Error deleting user:", error)
        return { error: "Erro ao excluir usuário" }
    }
}
