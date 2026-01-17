import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET /api/organization/business-type - Get current business type
export async function GET() {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const organization = await prisma.organization.findUnique({
            where: { id: context.organizationId },
            select: { businessType: true }
        })

        if (!organization) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        return NextResponse.json({ businessType: organization.businessType })
    } catch (error) {
        console.error("[BUSINESS_TYPE_GET] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/organization/business-type - Update business type
export async function PUT(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()
        const { businessType } = body

        if (!businessType || !["VAREJO_GERAL", "VESTUARIO"].includes(businessType)) {
            return NextResponse.json({
                error: "Tipo de negócio inválido. Use VAREJO_GERAL ou VESTUARIO"
            }, { status: 400 })
        }

        const organization = await prisma.organization.update({
            where: { id: context.organizationId },
            data: { businessType },
            select: { businessType: true }
        })

        return NextResponse.json({
            businessType: organization.businessType,
            message: businessType === "VESTUARIO"
                ? "Modo Vestuário ativado. Agora você pode criar produtos com variantes de cor e tamanho."
                : "Modo Varejo Geral ativado."
        })
    } catch (error) {
        console.error("[BUSINESS_TYPE_PUT] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
