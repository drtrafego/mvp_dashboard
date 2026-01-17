import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// Helper to generate slug from company name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, userEmail, userId } = body

        if (!name || !userEmail || !userId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            )
        }

        // Check if user already has an organization
        const existingUser = await prisma.user.findUnique({
            where: { privyId: userId },
            include: { organization: true }
        })

        if (existingUser?.organization) {
            return NextResponse.json(
                { error: "User already has an organization" },
                { status: 400 }
            )
        }

        // Generate unique slug
        let slug = generateSlug(name)
        let slugExists = await prisma.organization.findUnique({ where: { slug } })
        let counter = 1
        while (slugExists) {
            slug = `${generateSlug(name)}-${counter}`
            slugExists = await prisma.organization.findUnique({ where: { slug } })
            counter++
        }

        // Check if this is the super admin
        const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
        const isSuperAdmin = userEmail === superAdminEmail

        // Create organization and user in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the organization
            const organization = await tx.organization.create({
                data: {
                    name,
                    slug,
                    plan: "FREE",
                    isActive: true,
                }
            })

            // Create or update the user
            const user = await tx.user.upsert({
                where: { privyId: userId },
                update: {
                    organizationId: organization.id,
                    role: isSuperAdmin ? "SUPER_ADMIN" : "ADMIN",
                },
                create: {
                    privyId: userId,
                    email: userEmail,
                    role: isSuperAdmin ? "SUPER_ADMIN" : "ADMIN",
                    organizationId: organization.id,
                }
            })

            // Create default settings for the organization
            await tx.settings.create({
                data: {
                    organizationId: organization.id,
                    companyName: name,
                    ownerName: userEmail.split("@")[0],
                }
            })

            // Create some default categories
            const defaultCategories = ["Proteínas", "Laticínios", "Bebidas", "Vegetais", "Outros"]
            for (const catName of defaultCategories) {
                await tx.category.create({
                    data: {
                        name: catName,
                        organizationId: organization.id,
                    }
                })
            }

            return { organization, user }
        })

        return NextResponse.json({
            success: true,
            organization: result.organization,
            user: result.user,
        })
    } catch (error) {
        console.error("Error creating organization:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

// GET - List organizations (Super Admin only)
export async function GET(request: NextRequest) {
    try {
        const context = await getTenantContext()

        // SECURITY: Only Super Admins can list all organizations
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden - Super Admin access required" }, { status: 403 })
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        return NextResponse.json({ organizations })
    } catch (error) {
        console.error("Error listing organizations:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
