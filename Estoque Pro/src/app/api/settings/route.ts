import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { rateLimitMiddleware, writeRateLimit } from "@/lib/rate-limit"

// GET /api/settings - Get settings for current organization
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const settings = await prisma.settings.findUnique({
            where: { organizationId: context.organizationId }
        })

        if (!settings) {
            // Return default settings
            return NextResponse.json({
                settings: {
                    companyName: context.organizationName || "ChefControl",
                    ownerName: context.userName || "Admin",
                    theme: "system",
                    expiryWarningDays: 2,
                    lowStockThreshold: 0.10
                }
            })
        }

        return NextResponse.json({
            settings: {
                companyName: settings.companyName,
                ownerName: settings.ownerName,
                theme: settings.theme || "system",
                expiryWarningDays: settings.expiryWarningDays || 2,
                lowStockThreshold: settings.lowStockThreshold || 0.10
            }
        })
    } catch (error) {
        console.error("Error fetching settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/settings - Update settings for current organization
export async function PUT(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Only admins can update settings
        if (!context.isAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { companyName, ownerName, theme, expiryWarningDays, lowStockThreshold } = body

        // Validação rigorosa
        if (companyName !== undefined) {
            if (typeof companyName !== "string" || companyName.trim().length < 2 || companyName.trim().length > 100) {
                return NextResponse.json({ error: "Nome da empresa deve ter entre 2 e 100 caracteres" }, { status: 400 })
            }
        }

        if (ownerName !== undefined) {
            if (typeof ownerName !== "string" || ownerName.trim().length < 2 || ownerName.trim().length > 100) {
                return NextResponse.json({ error: "Nome do proprietário deve ter entre 2 e 100 caracteres" }, { status: 400 })
            }
        }

        if (theme !== undefined && !["light", "dark", "system"].includes(theme)) {
            return NextResponse.json({ error: "Tema inválido" }, { status: 400 })
        }

        if (expiryWarningDays !== undefined) {
            if (typeof expiryWarningDays !== "number" || expiryWarningDays < 1 || expiryWarningDays > 365) {
                return NextResponse.json({ error: "Dias de aviso deve ser entre 1 e 365" }, { status: 400 })
            }
        }

        if (lowStockThreshold !== undefined) {
            if (typeof lowStockThreshold !== "number" || lowStockThreshold < 0.01 || lowStockThreshold > 1) {
                return NextResponse.json({ error: "Limite de estoque baixo deve ser entre 1% e 100%" }, { status: 400 })
            }
        }

        const settings = await prisma.settings.upsert({
            where: { organizationId: context.organizationId },
            update: {
                companyName: companyName?.trim(),
                ownerName: ownerName?.trim(),
                theme,
                expiryWarningDays,
                lowStockThreshold
            },
            create: {
                organizationId: context.organizationId,
                companyName: companyName?.trim() || context.organizationName || "ChefControl",
                ownerName: ownerName?.trim() || context.userName || "Admin",
                theme: theme || "system",
                expiryWarningDays: expiryWarningDays || 2,
                lowStockThreshold: lowStockThreshold || 0.10
            }
        })

        // Also update Organization name to keep in sync
        if (companyName) {
            await prisma.organization.update({
                where: { id: context.organizationId },
                data: { name: companyName.trim() }
            })
        }

        return NextResponse.json({
            settings: {
                companyName: settings.companyName,
                ownerName: settings.ownerName,
                theme: settings.theme,
                expiryWarningDays: settings.expiryWarningDays,
                lowStockThreshold: settings.lowStockThreshold
            }
        })
    } catch (error) {
        console.error("Error updating settings:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
