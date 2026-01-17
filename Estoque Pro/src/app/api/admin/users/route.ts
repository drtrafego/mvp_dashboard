import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET /api/admin/users - List all users (Super Admin only)
export async function GET(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const users = await prisma.user.findMany({
            include: {
                organization: {
                    select: { name: true, slug: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        const transformedUsers = users.map(user => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            phone: user.phone,
            position: user.position,
            organizationId: user.organizationId,
            organizationName: user.organization?.name || "Sem empresa",
            organizationSlug: user.organization?.slug || null,
            createdAt: user.createdAt.toISOString(),
            isActive: user.isActive ?? true
        }))

        return NextResponse.json({ users: transformedUsers })
    } catch (error) {
        console.error("Error fetching users:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/admin/users - Update a user (Super Admin only)
export async function PUT(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { id, role, organizationId, email, name, isActive } = body

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const user = await prisma.user.update({
            where: { id },
            data: {
                role: role || undefined,
                organizationId: organizationId !== undefined ? organizationId : undefined,
                email: email || undefined,
                name: name || undefined
            },
            include: { organization: true }
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error("Error updating user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/admin/users - Create a new user (Super Admin only)
export async function POST(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { email, name, role, organizationId } = body

        if (!email || !name || !organizationId) {
            return NextResponse.json({ error: "Email, name and organizationId are required" }, { status: 400 })
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
        }

        const user = await prisma.user.create({
            data: {
                email,
                name,
                role: role || "STAFF",
                organizationId,
                privyId: `pending_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Temp ID
            }
        })

        return NextResponse.json({ user })
    } catch (error) {
        console.error("Error creating user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/admin/users - Delete a user (Super Admin only)
export async function DELETE(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.isSuperAdmin) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await request.json()
        const { id } = body

        if (!id) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        // Prevent deleting yourself (optional safety check)
        // Ideally we check context.userId but context usually comes from header/cookie which might not explicitly match the DB ID 1:1 without query
        // But let's assume Super Admin knows what they are doing.

        // Delete related StockLog records (userId is required, cannot set to null)
        await prisma.stockLog.deleteMany({
            where: { userId: id }
        })

        // Also clean up lastUpdatedBy references on products
        await prisma.product.updateMany({
            where: { lastUpdatedById: id },
            data: { lastUpdatedById: null }
        })

        await prisma.user.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting user:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
