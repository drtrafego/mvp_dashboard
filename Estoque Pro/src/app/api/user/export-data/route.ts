import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

export async function GET() {
    try {
        const context = await getTenantContext()
        if (!context?.userId || !context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get user data
        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                position: true,
                role: true,
                createdAt: true,
                updatedAt: true
            }
        })

        // Get organization data
        const organization = await prisma.organization.findUnique({
            where: { id: context.organizationId },
            select: {
                id: true,
                name: true,
                slug: true,
                plan: true,
                createdAt: true
            }
        })

        // Get products created by user
        const products = await prisma.product.findMany({
            where: { organizationId: context.organizationId },
            select: {
                id: true,
                name: true,
                currentStock: true,
                minStock: true,
                unit: true,
                unitPrice: true,
                createdAt: true,
                category: {
                    select: { name: true }
                }
            }
        })

        // Get stock logs by user
        const stockLogs = await prisma.stockLog.findMany({
            where: { userId: context.userId },
            select: {
                id: true,
                previousStock: true,
                newStock: true,
                action: true,
                responsible: true,
                createdAt: true,
                product: {
                    select: { name: true }
                }
            },
            take: 100 // Limit to last 100
        })

        const exportData = {
            exportDate: new Date().toISOString(),
            user,
            organization,
            products,
            stockLogs,
            _lgpd: {
                note: "Dados exportados conforme Art. 18 da LGPD (Lei 13.709/2018)",
                rights: [
                    "Acesso aos dados",
                    "Correção de dados",
                    "Exclusão de dados",
                    "Portabilidade"
                ]
            }
        }

        // Return as downloadable JSON
        return new NextResponse(JSON.stringify(exportData, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="meus-dados-chefcontrol-${new Date().toISOString().split('T')[0]}.json"`
            }
        })

    } catch (error) {
        console.error("[EXPORT DATA] Error:", error)
        return NextResponse.json({
            error: "Erro ao exportar dados"
        }, { status: 500 })
    }
}
