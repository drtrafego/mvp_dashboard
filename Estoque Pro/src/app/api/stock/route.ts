import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { rateLimitMiddleware, writeRateLimit } from "@/lib/rate-limit"

// POST /api/stock - Update stock for a product
export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { productId, quantity, expiresAt } = body

        // Validação rigorosa
        if (!productId || typeof productId !== "string") {
            return NextResponse.json({ error: "ProductId inválido" }, { status: 400 })
        }

        if (quantity === undefined || typeof quantity !== "number" || quantity < 0 || quantity > 999999) {
            return NextResponse.json({ error: "Quantidade inválida (deve ser entre 0 e 999999)" }, { status: 400 })
        }

        // Verify product belongs to this organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId: context.organizationId }
        })

        if (!product) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Update product stock
        const updatedProduct = await prisma.product.update({
            where: { id: productId },
            data: {
                currentStock: quantity,
                expiresAt: expiresAt ? new Date(expiresAt + 'T12:00:00') : product.expiresAt,
                lastUpdatedById: context.userId,
                lastCountAt: new Date()
            },
            include: { category: true }
        })

        // Create stock log entry
        await prisma.stockLog.create({
            data: {
                productId,
                previousStock: product.currentStock,
                newStock: quantity,
                action: "UPDATE",
                responsible: context.userName || context.userEmail || "Unknown",
                organizationId: context.organizationId,
                userId: context.userId
            }
        })

        return NextResponse.json({
            product: updatedProduct,
            success: true
        })
    } catch (error) {
        console.error("Error updating stock:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// GET /api/stock/history - Get stock history for organization
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()

        // Return 401 only if session is invalid (no context)
        if (!context) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // If no organization (e.g. just signed up), return empty list instead of 401
        if (!context.organizationId) {
            return NextResponse.json({ history: [] })
        }

        const { searchParams } = new URL(request.url)
        const productId = searchParams.get("productId")
        const limitParam = searchParams.get("limit") || "50"

        // Validar e limitar para evitar DoS
        const limit = Math.min(Math.max(parseInt(limitParam) || 50, 1), 100)

        const where: { organizationId: string; productId?: string } = {
            organizationId: context.organizationId
        }

        if (productId) {
            // Validar formato do productId
            if (typeof productId !== "string" || productId.length > 100) {
                return NextResponse.json({ error: "ProductId inválido" }, { status: 400 })
            }
            where.productId = productId
        }

        const history = await prisma.stockLog.findMany({
            where,
            include: { product: true },
            orderBy: { createdAt: "desc" },
            take: limit
        })

        const transformedHistory = history.map(h => ({
            id: h.id,
            productId: h.productId,
            productName: h.product.name,
            previousQuantity: h.previousStock,
            newQuantity: h.newStock,
            responsible: h.responsible,
            timestamp: h.createdAt.toISOString()
        }))

        return NextResponse.json({ history: transformedHistory })
    } catch (error) {
        console.error("Error fetching stock history:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
