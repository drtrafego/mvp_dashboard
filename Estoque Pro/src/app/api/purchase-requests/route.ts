import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

// GET - List all purchase requests for organization
export async function GET() {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const requests = await prisma.purchaseRequest.findMany({
            where: { organizationId: context.organizationId },
            include: {
                items: {
                    include: {
                        product: {
                            include: { category: true }
                        }
                    }
                },
                createdBy: {
                    select: { name: true, email: true }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Transform to match frontend format
        const formattedRequests = requests.map(req => ({
            id: req.id,
            items: req.items.map(item => ({
                productId: item.productId,
                name: item.product.name,
                category: item.product.category?.name || "Outros",
                unit: item.product.unit,
                currentStock: item.product.currentStock,
                minStock: item.product.minStock,
                suggestedQty: item.quantity,
                requestedQty: item.quantity,
                reason: "manual" as const
            })),
            supplier: req.supplier || "",
            notes: req.notes || "",
            status: req.status.toLowerCase() as "draft" | "sent" | "received",
            createdAt: req.createdAt.toISOString(),
            sentAt: req.sentAt?.toISOString()
        }))

        return NextResponse.json({ requests: formattedRequests })
    } catch (error) {
        console.error("Error fetching purchase requests:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST - Create new purchase request
export async function POST(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { items, supplier, notes, status } = body

        if (!items || items.length === 0) {
            return NextResponse.json({ error: "Items are required" }, { status: 400 })
        }

        // Map status to enum
        const statusMap: Record<string, "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED"> = {
            draft: "DRAFT",
            sent: "SENT",
            received: "RECEIVED",
            cancelled: "CANCELLED"
        }

        const purchaseRequest = await prisma.purchaseRequest.create({
            data: {
                supplier,
                notes,
                status: statusMap[status] || "DRAFT",
                sentAt: status === "sent" ? new Date() : null,
                organizationId: context.organizationId,
                createdById: context.userId,
                items: {
                    create: items.map((item: { productId: string; requestedQty: number }) => ({
                        productId: item.productId,
                        quantity: item.requestedQty || 0
                    }))
                }
            },
            include: {
                items: {
                    include: { product: true }
                }
            }
        })

        return NextResponse.json({ request: purchaseRequest }, { status: 201 })
    } catch (error) {
        console.error("Error creating purchase request:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT - Update purchase request
export async function PUT(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, items, supplier, notes, status } = body

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        // Verify ownership
        const existing = await prisma.purchaseRequest.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        // Map status to enum
        const statusMap: Record<string, "DRAFT" | "SENT" | "RECEIVED" | "CANCELLED"> = {
            draft: "DRAFT",
            sent: "SENT",
            received: "RECEIVED",
            cancelled: "CANCELLED"
        }

        // Delete old items and recreate
        await prisma.purchaseRequestItem.deleteMany({
            where: { purchaseRequestId: id }
        })

        const updatedRequest = await prisma.purchaseRequest.update({
            where: { id },
            data: {
                supplier,
                notes,
                status: statusMap[status] || existing.status,
                sentAt: status === "sent" && !existing.sentAt ? new Date() : existing.sentAt,
                items: {
                    create: items.map((item: { productId: string; requestedQty: number }) => ({
                        productId: item.productId,
                        quantity: item.requestedQty || 0
                    }))
                }
            },
            include: {
                items: {
                    include: { product: true }
                }
            }
        })

        return NextResponse.json({ request: updatedRequest })
    } catch (error) {
        console.error("Error updating purchase request:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE - Delete purchase request
export async function DELETE(request: NextRequest) {
    try {
        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "ID is required" }, { status: 400 })
        }

        // Verify ownership
        const existing = await prisma.purchaseRequest.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Not found" }, { status: 404 })
        }

        await prisma.purchaseRequest.delete({
            where: { id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting purchase request:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
