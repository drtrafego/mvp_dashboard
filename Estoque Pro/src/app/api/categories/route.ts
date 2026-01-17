import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { rateLimitMiddleware, writeRateLimit } from "@/lib/rate-limit"

// GET /api/categories - List categories for current organization
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const categories = await prisma.category.findMany({
            where: { organizationId: context.organizationId },
            orderBy: { name: "asc" }
        })

        return NextResponse.json({ categories })
    } catch (error) {
        console.error("Error fetching categories:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name } = body

        // Validação rigorosa
        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Nome da categoria obrigatório" }, { status: 400 })
        }

        const trimmedName = name.trim()
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            return NextResponse.json({ error: "Nome deve ter entre 2 e 50 caracteres" }, { status: 400 })
        }

        const category = await prisma.category.create({
            data: {
                name: trimmedName,
                organizationId: context.organizationId
            }
        })

        return NextResponse.json({ category }, { status: 201 })
    } catch (error) {
        console.error("Error creating category:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/categories - Update a category
export async function PUT(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, name } = body

        // Validação rigorosa
        if (!id || typeof id !== "string") {
            return NextResponse.json({ error: "ID da categoria inválido" }, { status: 400 })
        }

        if (!name || typeof name !== "string") {
            return NextResponse.json({ error: "Nome da categoria obrigatório" }, { status: 400 })
        }

        const trimmedName = name.trim()
        if (trimmedName.length < 2 || trimmedName.length > 50) {
            return NextResponse.json({ error: "Nome deve ter entre 2 e 50 caracteres" }, { status: 400 })
        }

        const existing = await prisma.category.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }

        const category = await prisma.category.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json({ category })
    } catch (error) {
        console.error("Error updating category:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/categories - Delete a category
export async function DELETE(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id || typeof id !== "string" || id.length > 100) {
            return NextResponse.json({ error: "ID da categoria inválido" }, { status: 400 })
        }

        // Verify category belongs to this organization
        const existing = await prisma.category.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Category not found" }, { status: 404 })
        }

        // Check if category has products
        const productsCount = await prisma.product.count({
            where: { categoryId: id }
        })

        if (productsCount > 0) {
            return NextResponse.json({
                error: "Cannot delete category with products"
            }, { status: 400 })
        }

        await prisma.category.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting category:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
