import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/products/[id]/variants - List variants for a product
export async function GET(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: productId } = await params

        // Check if product belongs to organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId: context.organizationId }
        })

        if (!product) {
            return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
        }

        const variants = await prisma.productVariant.findMany({
            where: { productId },
            include: {
                attributeValues: {
                    include: {
                        attributeValue: {
                            include: {
                                attribute: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: "asc" }
        })

        // Transform to a more friendly format
        const formattedVariants = variants.map(variant => ({
            id: variant.id,
            sku: variant.sku,
            currentStock: variant.currentStock,
            minStock: variant.minStock,
            unitPrice: variant.unitPrice,
            attributes: variant.attributeValues.map(av => ({
                attributeName: av.attributeValue.attribute.name,
                value: av.attributeValue.value
            }))
        }))

        return NextResponse.json({ variants: formattedVariants })
    } catch (error) {
        console.error("[PRODUCT_VARIANTS_GET] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// POST /api/products/[id]/variants - Create variants for a product (batch)
export async function POST(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: productId } = await params
        const body = await req.json()
        const { variants } = body

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
            return NextResponse.json({ error: "Variantes são obrigatórias" }, { status: 400 })
        }

        // Check if product belongs to organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId: context.organizationId }
        })

        if (!product) {
            return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
        }

        // Create variants using transaction
        const createdVariants = await prisma.$transaction(async (tx) => {
            // Mark product as having variants
            await tx.product.update({
                where: { id: productId },
                data: { hasVariants: true }
            })

            const results = []
            for (const v of variants) {
                // v.attributeValueIds = ["valueId1", "valueId2"] for Cor: Azul, Tamanho: M
                const variant = await tx.productVariant.create({
                    data: {
                        productId,
                        sku: v.sku || null,
                        currentStock: v.currentStock || 0,
                        minStock: v.minStock || 0,
                        unitPrice: v.unitPrice || null,
                        attributeValues: {
                            create: v.attributeValueIds?.map((valueId: string) => ({
                                attributeValueId: valueId
                            })) || []
                        }
                    },
                    include: {
                        attributeValues: {
                            include: {
                                attributeValue: {
                                    include: { attribute: true }
                                }
                            }
                        }
                    }
                })
                results.push(variant)
            }
            return results
        })

        return NextResponse.json({ variants: createdVariants }, { status: 201 })
    } catch (error) {
        console.error("[PRODUCT_VARIANTS_POST] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// PUT /api/products/[id]/variants - Update a variant
export async function PUT(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: productId } = await params
        const body = await req.json()
        const { variantId, sku, currentStock, minStock, unitPrice } = body

        if (!variantId) {
            return NextResponse.json({ error: "variantId é obrigatório" }, { status: 400 })
        }

        // Check if product belongs to organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId: context.organizationId }
        })

        if (!product) {
            return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
        }

        // Check if variant belongs to product
        const existingVariant = await prisma.productVariant.findFirst({
            where: { id: variantId, productId }
        })

        if (!existingVariant) {
            return NextResponse.json({ error: "Variante não encontrada" }, { status: 404 })
        }

        const variant = await prisma.productVariant.update({
            where: { id: variantId },
            data: {
                sku: sku !== undefined ? sku : existingVariant.sku,
                currentStock: currentStock !== undefined ? currentStock : existingVariant.currentStock,
                minStock: minStock !== undefined ? minStock : existingVariant.minStock,
                unitPrice: unitPrice !== undefined ? unitPrice : existingVariant.unitPrice
            },
            include: {
                attributeValues: {
                    include: {
                        attributeValue: {
                            include: { attribute: true }
                        }
                    }
                }
            }
        })

        return NextResponse.json({ variant })
    } catch (error) {
        console.error("[PRODUCT_VARIANTS_PUT] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// DELETE /api/products/[id]/variants?variantId=xxx - Delete a variant
export async function DELETE(req: Request, { params }: RouteParams) {
    try {
        const context = await getTenantContext()
        if (!context?.organizationId || !context?.isAdmin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { id: productId } = await params
        const { searchParams } = new URL(req.url)
        const variantId = searchParams.get("variantId")

        if (!variantId) {
            return NextResponse.json({ error: "variantId é obrigatório" }, { status: 400 })
        }

        // Check if product belongs to organization
        const product = await prisma.product.findFirst({
            where: { id: productId, organizationId: context.organizationId }
        })

        if (!product) {
            return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
        }

        // Check if variant belongs to product
        const variant = await prisma.productVariant.findFirst({
            where: { id: variantId, productId }
        })

        if (!variant) {
            return NextResponse.json({ error: "Variante não encontrada" }, { status: 404 })
        }

        await prisma.productVariant.delete({ where: { id: variantId } })

        // Check if product still has variants
        const remainingVariants = await prisma.productVariant.count({ where: { productId } })
        if (remainingVariants === 0) {
            await prisma.product.update({
                where: { id: productId },
                data: { hasVariants: false }
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[PRODUCT_VARIANTS_DELETE] Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
