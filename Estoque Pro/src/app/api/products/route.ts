import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import { rateLimitMiddleware, writeRateLimit } from "@/lib/rate-limit"

// GET /api/products - List products for current organization
export async function GET(request: NextRequest) {
    try {
        // Rate limiting
        const rateLimited = await rateLimitMiddleware(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const products = await prisma.product.findMany({
            where: { organizationId: context.organizationId },
            include: {
                category: true,
                variants: {
                    include: {
                        attributeValues: {
                            include: {
                                attributeValue: {
                                    include: { attribute: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { name: "asc" }
        })

        return NextResponse.json({ products })
    } catch (error) {
        console.error("Error fetching products:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
    try {
        // Rate limiting for write operations
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { name, unit, minStock, currentStock, expiresAt, categoryId, unitPrice, hasVariants, variants } = body

        if (!name || !unit || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Use transaction to ensure product and variants are created together
        const product = await prisma.$transaction(async (tx) => {
            // 1. Create Product
            const p = await tx.product.create({
                data: {
                    name,
                    unit,
                    minStock: minStock || 0,
                    currentStock: currentStock || 0,
                    expiresAt: expiresAt ? new Date(expiresAt + 'T12:00:00') : undefined,
                    categoryId,
                    unitPrice: unitPrice || undefined,
                    organizationId: context.organizationId!,
                    lastCountAt: new Date(),
                    customData: body.customFields || {},
                    hasVariants: hasVariants || false,
                },
                include: { category: true }
            })

            // 2. Create Variants if present
            if (hasVariants && variants && Array.isArray(variants)) {
                for (const variant of variants) {
                    const { currentStock, sku, attributeValueIds } = variant as any

                    const newVariant = await tx.productVariant.create({
                        data: {
                            productId: p.id,
                            currentStock: Number(currentStock) || 0,
                            minStock: 0, // default
                            sku: (sku as string) || undefined,
                            unitPrice: unitPrice ? Number(unitPrice) : undefined
                        }
                    })

                    // Link attribute values
                    if (attributeValueIds && Array.isArray(attributeValueIds)) {
                        for (const attrValueId of attributeValueIds) {
                            await tx.productVariantValue.create({
                                data: {
                                    variantId: newVariant.id,
                                    attributeValueId: String(attrValueId)
                                }
                            })
                        }
                    }
                }
            }

            return p
        })

        return NextResponse.json({ product }, { status: 201 })
    } catch (error) {
        console.error("Error creating product:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/products - Update a product
export async function PUT(request: NextRequest) {
    try {
        // Rate limiting for write operations
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { id, categoryId, categoryName, customFields, ...rest } = body

        if (!id) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        // Verify product belongs to this organization
        const existing = await prisma.product.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        // Build the update data with only valid Prisma fields
        const updateData: Record<string, unknown> = {}

        // Handle simple fields
        if (rest.name !== undefined) updateData.name = rest.name
        if (rest.unit !== undefined) updateData.unit = rest.unit
        if (rest.minStock !== undefined) updateData.minStock = rest.minStock
        if (rest.currentStock !== undefined) updateData.currentStock = rest.currentStock
        if (rest.unitPrice !== undefined) updateData.unitPrice = rest.unitPrice

        // Handle date conversion - add T12:00:00 to prevent UTC timezone shift
        if (rest.expiresAt !== undefined) {
            updateData.expiresAt = rest.expiresAt ? new Date(rest.expiresAt + 'T12:00:00') : null
        }

        // Map customFields to customData (Prisma field name)
        if (customFields !== undefined) {
            updateData.customData = customFields
        }

        // If categoryId is provided, use category connect
        if (categoryId) {
            updateData.category = { connect: { id: categoryId } }
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: { category: true }
        })

        return NextResponse.json({ product })
    } catch (error) {
        console.error("Error updating product:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/products - Delete a product
export async function DELETE(request: NextRequest) {
    try {
        // Rate limiting for write operations
        const rateLimited = await writeRateLimit(request)
        if (rateLimited) return rateLimited

        const context = await getTenantContext()
        if (!context || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "Product ID required" }, { status: 400 })
        }

        // Verify product belongs to this organization
        const existing = await prisma.product.findFirst({
            where: { id, organizationId: context.organizationId }
        })

        if (!existing) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 })
        }

        await prisma.product.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting product:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
