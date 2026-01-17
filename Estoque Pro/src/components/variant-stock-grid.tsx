"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, Grid3X3 } from "lucide-react"

interface VariantAttribute {
    id: string
    name: string
    values: { id: string; value: string }[]
}

interface ProductVariant {
    id: string
    sku: string | null
    currentStock: number
    minStock: number
    unitPrice: number | null
    attributes: { attributeName: string; value: string }[]
}

interface VariantStockGridProps {
    productId: string
    productName: string
    onClose: () => void
}

export function VariantStockGrid({ productId, productName, onClose }: VariantStockGridProps) {
    const [variants, setVariants] = React.useState<ProductVariant[]>([])
    const [attributes, setAttributes] = React.useState<VariantAttribute[]>([])
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const [stockValues, setStockValues] = React.useState<Record<string, number>>({})
    const [message, setMessage] = React.useState("")

    // Fetch variants and attributes
    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [variantRes, attrRes] = await Promise.all([
                    fetch(`/api/products/${productId}/variants`),
                    fetch("/api/variant-attributes")
                ])

                if (variantRes.ok) {
                    const data = await variantRes.json()
                    setVariants(data.variants || [])
                    // Initialize stock values
                    const initialStock: Record<string, number> = {}
                    data.variants?.forEach((v: ProductVariant) => {
                        initialStock[v.id] = v.currentStock
                    })
                    setStockValues(initialStock)
                }

                if (attrRes.ok) {
                    const data = await attrRes.json()
                    setAttributes(data.attributes || [])
                }
            } catch (error) {
                console.error("Error fetching variant data:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [productId])

    const handleStockChange = (variantId: string, value: string) => {
        setStockValues(prev => ({
            ...prev,
            [variantId]: parseFloat(value) || 0
        }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            // Update each variant that changed
            const updates = variants.filter(v => stockValues[v.id] !== v.currentStock)

            for (const variant of updates) {
                await fetch(`/api/products/${productId}/variants`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        variantId: variant.id,
                        currentStock: stockValues[variant.id]
                    })
                })
            }

            setMessage(`${updates.length} variante(s) atualizada(s)!`)
            setTimeout(() => setMessage(""), 3000)
        } catch (error) {
            console.error("Error saving variants:", error)
            setMessage("Erro ao salvar")
        } finally {
            setSaving(false)
        }
    }

    // Build grid data - rows = first attribute, cols = second attribute
    const buildGrid = () => {
        if (attributes.length < 2 || variants.length === 0) {
            return null
        }

        const attr1 = attributes[0]
        const attr2 = attributes[1]

        // Get which values are used by the variants
        const usedValues1 = new Set<string>()
        const usedValues2 = new Set<string>()

        variants.forEach(v => {
            v.attributes.forEach(a => {
                if (a.attributeName === attr1.name) usedValues1.add(a.value)
                if (a.attributeName === attr2.name) usedValues2.add(a.value)
            })
        })

        const rows = attr1.values.filter(v => usedValues1.has(v.value))
        const cols = attr2.values.filter(v => usedValues2.has(v.value))

        return { attr1, attr2, rows, cols }
    }

    const getVariantByAttributes = (value1: string, value2: string) => {
        return variants.find(v =>
            v.attributes.some(a => a.value === value1) &&
            v.attributes.some(a => a.value === value2)
        )
    }

    if (loading) {
        return (
            <Card className="bg-card border-border">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    const grid = buildGrid()

    return (
        <Card className="bg-card border-border">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Grid3X3 className="w-5 h-5 text-muted-foreground" />
                        <CardTitle className="text-lg text-foreground">{productName} - Estoque por Variante</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {variants.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        Este produto não possui variantes cadastradas.
                    </div>
                ) : grid ? (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="p-2 text-left text-sm font-medium text-muted-foreground border-b border-border">
                                        {grid.attr1.name} / {grid.attr2.name}
                                    </th>
                                    {grid.cols.map(col => (
                                        <th key={col.id} className="p-2 text-center text-sm font-medium text-foreground border-b border-border">
                                            {col.value}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {grid.rows.map(row => (
                                    <tr key={row.id}>
                                        <td className="p-2 text-sm font-medium text-foreground border-b border-border">
                                            {row.value}
                                        </td>
                                        {grid.cols.map(col => {
                                            const variant = getVariantByAttributes(row.value, col.value)
                                            if (!variant) {
                                                return (
                                                    <td key={col.id} className="p-2 text-center border-b border-border">
                                                        <span className="text-muted-foreground">-</span>
                                                    </td>
                                                )
                                            }
                                            return (
                                                <td key={col.id} className="p-2 text-center border-b border-border">
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        value={stockValues[variant.id] ?? variant.currentStock}
                                                        onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                                        className="w-16 h-8 text-center mx-auto bg-background border-input"
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Fallback: simple list if not a 2-attribute grid
                    <div className="space-y-2">
                        {variants.map(variant => (
                            <div key={variant.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div className="flex gap-2">
                                    {variant.attributes.map((a, i) => (
                                        <Badge key={i} variant="secondary">{a.value}</Badge>
                                    ))}
                                </div>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    value={stockValues[variant.id] ?? variant.currentStock}
                                    onChange={(e) => handleStockChange(variant.id, e.target.value)}
                                    className="w-20 h-8 bg-background border-input"
                                />
                            </div>
                        ))}
                    </div>
                )}

                {variants.length > 0 && (
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                        {message && (
                            <span className="text-sm text-green-600 dark:text-green-400">{message}</span>
                        )}
                        <div className="flex-1" />
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2" />
                            )}
                            Salvar Estoques
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
