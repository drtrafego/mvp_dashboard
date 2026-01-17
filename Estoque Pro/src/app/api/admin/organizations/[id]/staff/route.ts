import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { stackServerApp } from "@/lib/stack"

// POST /api/admin/organizations/[id]/staff - Add staff member to organization
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const context = await getTenantContext()

        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Allow Super Admin OR Admin of the specific organization
        if (!context.isSuperAdmin && (!context.isAdmin || context.organizationId !== id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const body = await req.json()
        const { email, name, role, password } = body

        if (!email || !name) {
            return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
        }

        if (!password || password.length < 6) {
            return NextResponse.json({ error: "Password is required and must be at least 6 characters" }, { status: 400 })
        }

        // Check if organization exists
        const org = await prisma.organization.findUnique({
            where: { id }
        })

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Check if user already exists
        let user = await prisma.user.findUnique({
            where: { email }
        })

        if (user) {
            // User exists in our DB
            if (user.organizationId && user.organizationId !== id) {
                return NextResponse.json({ error: "User already belongs to another organization" }, { status: 400 })
            }
            if (user.organizationId === id) {
                return NextResponse.json({ error: "User is already in this organization" }, { status: 400 })
            }

            // Verify if user exists in Stack Auth or create it?
            // If they are in our DB, they might be in Stack.
            // For now, we update our DB to link them.
            // Todo: We might want to reset their password here too if provided? 
            // Let's assume re-inviting an existing user just links them.

            user = await prisma.user.update({
                where: { id: user.id },
                data: {
                    organizationId: id,
                    role: role || "STAFF"
                }
            })
        } else {
            // New User: Create in Stack Auth first
            let stackUser;
            try {
                // Create user in Stack Auth
                stackUser = await stackServerApp.createUser({
                    primaryEmail: email,
                    password,
                    displayName: name,
                    primaryEmailAuthEnabled: true,
                    primaryEmailVerified: true,
                });
            } catch (stackError: any) {
                console.error("Stack Auth create error:", stackError);
                // Handle specific Stack errors (e.g. email already exists in Stack but not in our DB)
                // If they exist in Stack, we should probably try to link them instead of failing?
                // But we don't know their Privy/Stack ID yet easily without searching.
                return NextResponse.json({ error: "Failed to create authentication user: " + (stackError.message || "Unknown error") }, { status: 500 })
            }

            // Create in our DB
            user = await prisma.user.create({
                data: {
                    email,
                    name,
                    role: role || "STAFF",
                    organizationId: id,
                    privyId: stackUser.id // Link to Stack Auth ID
                }
            })
        }

        return NextResponse.json({ user })

    } catch (error) {
        console.error("Error adding staff:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// GET /api/admin/organizations/[id]/staff - List staff members
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const context = await getTenantContext()

        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Allow Super Admin OR Admin of the specific organization
        if (!context.isSuperAdmin && (!context.isAdmin || context.organizationId !== id)) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 })
        }

        const staff = await prisma.user.findMany({
            where: { organizationId: id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json({ staff })

    } catch (error) {
        console.error("Error listing staff:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: orgId } = await params
    const context = await getTenantContext()

    if (!context || !context.isSuperAdmin) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { email } = await req.json()

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 })
        }

        const userToRemove = await prisma.user.findFirst({
            where: {
                email,
                organizationId: orgId
            }
        })

        if (!userToRemove) {
            return NextResponse.json({ error: "User not found within this organization" }, { status: 404 })
        }

        if (userToRemove.role === "SUPER_ADMIN") {
            return NextResponse.json({ error: "Cannot remove a Super Admin via this route" }, { status: 403 })
        }

        // Delete from Stack Auth as well?
        // Optional: for now we just unlink in DB or delete DB record.
        // User might want to keep their Stack account for other apps?
        // Let's delete from DB for now.

        // Delete related StockLog records (userId is required, cannot set to null)
        await prisma.stockLog.deleteMany({
            where: { userId: userToRemove.id }
        })

        // Clean up lastUpdatedBy references on products
        await prisma.product.updateMany({
            where: { lastUpdatedById: userToRemove.id },
            data: { lastUpdatedById: null }
        })

        await prisma.user.delete({
            where: { id: userToRemove.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error removing staff:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}

// PUT /api/admin/organizations/[id]/staff - Update staff member
export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: orgId } = await params
    const context = await getTenantContext()

    if (!context) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!context.isSuperAdmin && (!context.isAdmin || context.organizationId !== orgId)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    try {
        const body = await req.json()
        const { userId, name, email, role, isActive, password } = body

        if (!userId) {
            return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                organizationId: orgId
            }
        })

        if (!existingUser) {
            return NextResponse.json({ error: "User not found in this organization" }, { status: 404 })
        }

        if (existingUser.role === "SUPER_ADMIN" && !context.isSuperAdmin) {
            return NextResponse.json({ error: "Cannot modify Super Admin" }, { status: 403 })
        }

        // Update Stack Auth if password provided
        if (password) {
            if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

            if (existingUser.privyId && existingUser.privyId.startsWith('pending')) {
                // It's a placeholder ID, user hasn't synced properly or logic is mixed.
                // Ideally valid Stack users have a proper ID.
                // If we created them via POST above, they have a Stack ID.
            }

            if (existingUser.privyId && !existingUser.privyId.startsWith('pending')) {
                // try {
                //     await stackServerApp.updateUser(existingUser.privyId, {
                //         password
                //     });
                // } catch (stackErr) {
                //     console.error("Failed to update Stack password", stackErr);
                //     // Proceed? Or generic error?
                //     return NextResponse.json({ error: "Failed to update password in auth system" }, { status: 500 });
                // }
                console.warn("Password update for Stack Auth is currently disabled due to API limitation.");
            } else {
                // If they don't have a valid Stack ID (legacy or bug), we can't update password easily
                // or we need to find them by email in Stack?
                // For now, assume flow works if they were created via the new POST.
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                name: name !== undefined ? name : undefined,
                email: email !== undefined ? email : undefined,
                role: role !== undefined ? role : undefined
            }
        })

        return NextResponse.json({ user: updatedUser })

    } catch (error) {
        console.error("Error updating staff:", error)
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        )
    }
}
