import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/variant-attributes/[id]/values - List values for an attribute
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params

        // Check if attribute belongs to organization
        const attribute = await prisma.variantAttribute.findFirst({
            where: { id, organizationId: context.organizationId },
            include: {
                values: {
                    orderBy: { value: "asc" }
                }
            }
        })

        if (!attribute) {
            return NextResponse.json({ error: "Atributo não encontrado" }, { status: 404 })
        }

        return NextResponse.json({ values: attribute.values })
    } catch (error) {
        console.error("[VARIANT_VALUES_GET] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/variant-attributes/[id]/values - Add a value to an attribute
export async function POST(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const body = await req.json()
        const { value } = body

        if (!value || typeof value !== "string" || value.trim().length === 0) {
            return NextResponse.json({ error: "Valor é obrigatório" }, { status: 400 })
        }

        // Check if attribute belongs to organization
        const attribute = await prisma.variantAttribute.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!attribute) {
            return NextResponse.json({ error: "Atributo não encontrado" }, { status: 404 })
        }

        // Check if value already exists
        const existing = await prisma.variantAttributeValue.findFirst({
            where: { attributeId: id, value: value.trim() }
        })

        if (existing) {
            return NextResponse.json({ error: "Valor já existe" }, { status: 400 })
        }

        const attributeValue = await prisma.variantAttributeValue.create({
            data: {
                value: value.trim(),
                attributeId: id
            }
        })

        return NextResponse.json({ value: attributeValue }, { status: 201 })
    } catch (error) {
        console.error("[VARIANT_VALUES_POST] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/variant-attributes/[id]/values?valueId=xxx - Delete a value
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id } = await params
        const { searchParams } = new URL(req.url)
        const valueId = searchParams.get("valueId")

        if (!valueId) {
            return NextResponse.json({ error: "valueId é obrigatório" }, { status: 400 })
        }

        // Check if attribute belongs to organization
        const attribute = await prisma.variantAttribute.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!attribute) {
            return NextResponse.json({ error: "Atributo não encontrado" }, { status: 404 })
        }

        // Check if value belongs to this attribute
        const value = await prisma.variantAttributeValue.findFirst({
            where: { id: valueId, attributeId: id }
        })

        if (!value) {
            return NextResponse.json({ error: "Valor não encontrado" }, { status: 404 })
        }

        // Delete will cascade to variant associations
        await prisma.variantAttributeValue.delete({ where: { id: valueId } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[VARIANT_VALUES_DELETE] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
