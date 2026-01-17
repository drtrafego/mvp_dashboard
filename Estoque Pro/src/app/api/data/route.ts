import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

/**
 * GET /api/data - Returns all data for the current organization
 * (products, categories, settings, custom columns)
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getTenantContext()

        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // If user has no organization, return empty data
        // This includes Super Admin if they don't have an organization linked yet
        if (!context.organizationId) {
            return NextResponse.json({
                categories: [],
                products: [],
                customColumns: [],
                settings: {
                    companyName: "ChefControl",
                    ownerName: context.userName || "Usuário",
                    theme: "system",
                    expiryWarningDays: 2,
                    lowStockThreshold: 0.10
                },
                needsOnboarding: !context.isSuperAdmin,
                organization: null,
                user: {
                    id: context.userId,
                    email: context.userEmail,
                    name: context.userName,
                    role: context.role
                },
                users: []
            })
        }

        const orgId = context.organizationId

        // Fetch all data for this organization
        const [categories, products, customColumns, settings, users] = await Promise.all([
            prisma.category.findMany({
                where: { organizationId: orgId! },
                orderBy: { name: "asc" }
            }),
            prisma.product.findMany({
                where: { organizationId: orgId! },
                include: {
                    category: true,
                    lastUpdatedBy: true
                },
                orderBy: { name: "asc" }
            }),
            prisma.customColumn.findMany({
                where: { organizationId: orgId! },
                orderBy: { createdAt: "asc" }
            }),
            prisma.settings.findUnique({
                where: { organizationId: orgId! }
            }),
            prisma.user.findMany({
                where: { organizationId: orgId! },
                orderBy: { name: "asc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true
                }
            })
        ])

        // Transform products to match frontend format
        const transformedProducts = products.map(p => ({
            id: p.id,
            name: p.name,
            unit: p.unit,
            minStock: p.minStock,
            currentStock: p.currentStock,
            expiresAt: p.expiresAt?.toISOString().split("T")[0] || null,
            categoryId: p.categoryId,
            categoryName: p.category?.name || "",
            responsible: p.lastUpdatedBy?.name || undefined,
            lastCountAt: p.lastCountAt?.toISOString().split("T")[0] || undefined,
            unitPrice: p.unitPrice || undefined,
            customFields: (p.customData as Record<string, string>) || {}
        }))

        // Transform categories
        const transformedCategories = categories.map(c => ({
            id: c.id,
            name: c.name
        }))

        // Transform custom columns
        const transformedCustomColumns = customColumns.map(c => ({
            id: c.id,
            name: c.name,
            createdAt: c.createdAt.toISOString()
        }))

        // Transform settings
        const transformedSettings = settings ? {
            companyName: settings.companyName,
            ownerName: settings.ownerName,
            theme: settings.theme || "system",
            expiryWarningDays: settings.expiryWarningDays || 2,
            lowStockThreshold: settings.lowStockThreshold || 0.10
        } : {
            companyName: context.organizationName || "ChefControl",
            ownerName: context.userName || "Admin",
            theme: "system",
            expiryWarningDays: 2,
            lowStockThreshold: 0.10
        }

        return NextResponse.json({
            categories: transformedCategories,
            products: transformedProducts,
            customColumns: transformedCustomColumns,
            settings: transformedSettings,
            needsOnboarding: false,
            organization: {
                id: context.organizationId,
                name: context.organizationName,
                slug: context.organizationSlug,
                subscriptionStatus: context.subscriptionStatus,
                subscriptionExpiresAt: context.subscriptionExpiresAt
            },
            user: {
                id: context.userId,
                email: context.userEmail,
                name: context.userName,
                role: context.role
            },
            users: users.map(u => ({
                id: u.id,
                name: u.name || "",
                email: u.email,
                role: u.role,
                isActive: (u as any).isActive ?? true,
                createdAt: u.createdAt.toISOString()
            }))
        })

    } catch (error) {
        console.error("Error fetching data:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
