import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

export async function POST(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.userId) {
            // For anonymous users, just return success
            return NextResponse.json({ success: true })
        }

        const { type, accepted } = await req.json()

        // Update user with consent info
        await prisma.user.update({
            where: { id: context.userId },
            data: {
                updatedAt: new Date() // Just touch the record for now
            }
        })

        console.log(`[CONSENT] User ${context.userId} ${accepted ? 'accepted' : 'rejected'} ${type}`)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error logging consent:", error)
        return NextResponse.json({ success: true }) // Silent fail
    }
}
