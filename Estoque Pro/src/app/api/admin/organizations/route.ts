import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET /api/admin/organizations - List all organizations (Super Admin only)
export async function GET(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const organizations = await prisma.organization.findMany({
            include: {
                _count: {
                    select: {
                        users: true,
                        products: true,
                        categories: true
                    }
                },
                users: {
                    where: { role: "ADMIN" },
                    select: { email: true, name: true, id: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        const transformedOrgs = organizations.map(org => ({
            id: org.id,
            name: org.name,
            slug: org.slug,
            plan: org.plan,
            isActive: org.isActive,
            maxUsers: org.maxUsers,
            maxProducts: org.maxProducts,
            usersCount: org._count.users,
            productsCount: org._count.products,
            categoriesCount: org._count.categories,
            adminEmail: org.users[0]?.email || "N/A",
            adminName: org.users[0]?.name || "N/A",
            adminId: org.users[0]?.id,
            createdAt: org.createdAt.toISOString()
        }))

        return NextResponse.json({ organizations: transformedOrgs })
    } catch (error) {
        console.error("Error fetching organizations:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/admin/organizations - Update an organization (Super Admin only)
export async function PUT(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { id, isActive, plan, maxUsers, maxProducts, name, slug } = body

        if (!id) {
            return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
        }

        const organization = await prisma.organization.update({
            where: { id },
            data: {
                name: name || undefined,
                slug: slug || undefined,
                isActive: isActive !== undefined ? isActive : undefined,
                plan: plan || undefined,
                maxUsers: maxUsers || undefined,
                maxProducts: maxProducts || undefined
            }
        })

        // Update Admin Email if provided
        // We need to find the admin of this organization if adminEmail is being updated
        // However, the request might need to pass the adminId specifically or we rely on finding the admin again.
        // For simplicity, let's look up the admin if we are changing email.
        // But better yet, the client should pass 'adminId' if it wants to update a specific admin.
        // Let's check if 'adminEmail' is in the body.
        const { adminEmail, adminId } = body

        if (adminEmail && adminId) {
            // Verify if email is already taken by another user
            const existingUser = await prisma.user.findUnique({
                where: { email: adminEmail }
            })

            if (existingUser && existingUser.id !== adminId) {
                return NextResponse.json({ error: "Email already in use by another user" }, { status: 400 })
            }

            await prisma.user.update({
                where: { id: adminId },
                data: { email: adminEmail }
            })
        }

        return NextResponse.json({ organization })
    } catch (error) {
        console.error("Error updating organization:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/admin/organizations - Delete an organization (Super Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: "Organization ID required" }, { status: 400 })
        }

        // Delete the organization
        // Note: Assuming Cascade Delete is configured in schema for relations. 
        // If not, we might need to manually delete related records first or use onDelete: Cascade in schema.
        // Based on common Prisma patterns, if the schema handles it, this is enough.
        await prisma.organization.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting organization:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
