import { NextResponse } from "next/server"
import { getTenantContext } from "@/lib/tenant"

// GET /api/user-context - Get current user context including role
export async function GET() {
    try {
        const context = await getTenantContext()

        if (!context) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        return NextResponse.json({
            userId: context.userId,
            userEmail: context.userEmail,
            userName: context.userName,
            organizationId: context.organizationId,
            organizationName: context.organizationName,
            role: context.role,
            isSuperAdmin: context.isSuperAdmin,
            isAdmin: context.isAdmin,
        })
    } catch (error) {
        console.error("Error getting user context:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
