
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET /api/custom-columns
export async function GET(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const columns = await prisma.customColumn.findMany({
            where: { organizationId: context.organizationId },
            orderBy: { createdAt: "asc" }
        })

        return NextResponse.json({ columns })
    } catch (error) {
        console.error("Error fetching custom columns:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/custom-columns
export async function POST(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name } = body

        if (!name) {
            return NextResponse.json({ error: "Name required" }, { status: 400 })
        }

        const column = await prisma.customColumn.create({
            data: {
                name,
                organizationId: context.organizationId
            }
        })

        return NextResponse.json({ column }, { status: 201 })
    } catch (error) {
        console.error("Error creating custom column:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/custom-columns - Update a custom column
export async function PUT(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, name } = body

        if (!id || !name) {
            return NextResponse.json({ error: "ID and name required" }, { status: 400 })
        }

        const existing = await prisma.customColumn.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        const column = await prisma.customColumn.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json({ column })
    } catch (error) {
        console.error("Error updating custom column:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/custom-columns
export async function DELETE(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID required" }, { status: 400 })
        }

        const existing = await prisma.customColumn.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        await prisma.customColumn.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting custom column:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
