import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET /api/variant-attributes - List all variant attributes for the organization
export async function GET() {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const attributes = await prisma.variantAttribute.findMany({
            where: { organizationId: context.organizationId },
            include: {
                values: {
                    orderBy: { value: "asc" }
                }
            },
            orderBy: { name: "asc" }
        })

        return NextResponse.json({ attributes })
    } catch (error) {
        console.error("[VARIANT_ATTRIBUTES_GET] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/variant-attributes - Create a new variant attribute
export async function POST(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { name, values } = body

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json({ error: "Nome do atributo é obrigatório" }, { status: 400 })
        }

        // Check if attribute already exists
        const existing = await prisma.variantAttribute.findUnique({
            where: {
                organizationId_name: {
                    organizationId: context.organizationId,
                    name: name.trim()
                }
            }
        })

        if (existing) {
            return NextResponse.json({ error: "Atributo já existe" }, { status: 400 })
        }

        // Create attribute with optional initial values
        const attribute = await prisma.variantAttribute.create({
            data: {
                name: name.trim(),
                organizationId: context.organizationId,
                values: values && Array.isArray(values) ? {
                    create: values.map((v: string) => ({ value: v.trim() }))
                } : undefined
            },
            include: {
                values: true
            }
        })

        return NextResponse.json({ attribute }, { status: 201 })
    } catch (error) {
        console.error("[VARIANT_ATTRIBUTES_POST] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/variant-attributes - Update a variant attribute
export async function PUT(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { id, name } = body

        if (!id || !name) {
            return NextResponse.json({ error: "ID e nome são obrigatórios" }, { status: 400 })
        }

        // Check if attribute belongs to organization
        const existing = await prisma.variantAttribute.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Atributo não encontrado" }, { status: 404 })
        }

        // Check if new name conflicts
        const conflict = await prisma.variantAttribute.findFirst({
            where: {
                organizationId: context.organizationId,
                name: name.trim(),
                id: { not: id }
            }
        })

        if (conflict) {
            return NextResponse.json({ error: "Já existe um atributo com esse nome" }, { status: 400 })
        }

        const attribute = await prisma.variantAttribute.update({
            where: { id },
            data: { name: name.trim() },
            include: { values: true }
        })

        return NextResponse.json({ attribute })
    } catch (error) {
        console.error("[VARIANT_ATTRIBUTES_PUT] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/variant-attributes?id=xxx - Delete a variant attribute
export async function DELETE(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 })
        }

        // Check if attribute belongs to organization
        const existing = await prisma.variantAttribute.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Atributo não encontrado" }, { status: 404 })
        }

        // Delete will cascade to values and variant associations
        await prisma.variantAttribute.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[VARIANT_ATTRIBUTES_DELETE] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
