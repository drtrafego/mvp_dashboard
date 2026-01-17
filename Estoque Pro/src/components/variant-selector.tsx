"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Loader2, Grid3X3 } from "lucide-react"

interface VariantAttribute {
    id: string
    name: string
    values: { id: string; value: string }[]
}

interface VariantGridData {
    attributeValueIds: string[]
    currentStock: number
    sku?: string
}

interface VariantSelectorProps {
    enabled: boolean
    onEnabledChange: (enabled: boolean) => void
    selectedValues: Record<string, string[]> // attributeId -> selected valueIds
    onSelectedValuesChange: (values: Record<string, string[]>) => void
    variantGrid: VariantGridData[]
    onVariantGridChange: (grid: VariantGridData[]) => void
}

export function VariantSelector({
    enabled,
    onEnabledChange,
    selectedValues,
    onSelectedValuesChange,
    variantGrid,
    onVariantGridChange
}: VariantSelectorProps) {
    const [attributes, setAttributes] = React.useState<VariantAttribute[]>([])
    const [loading, setLoading] = React.useState(true)

    // Fetch attributes
    React.useEffect(() => {
        const fetchAttributes = async () => {
            try {
                const res = await fetch("/api/variant-attributes")
                if (res.ok) {
                    const data = await res.json()
                    setAttributes(data.attributes || [])
                }
            } catch (error) {
                console.error("Error fetching variant attributes:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAttributes()
    }, [])

    // Generate grid when selected values change
    React.useEffect(() => {
        if (!enabled) {
            onVariantGridChange([])
            return
        }

        // Get arrays of selected values for each attribute
        const attributeArrays = Object.entries(selectedValues)
            .filter(([_, values]) => values.length > 0)
            .map(([_, values]) => values)

        if (attributeArrays.length === 0) {
            onVariantGridChange([])
            return
        }

        // Generate cartesian product of all selected values
        const cartesianProduct = (arrays: string[][]): string[][] => {
            if (arrays.length === 0) return [[]]
            return arrays.reduce<string[][]>(
                (acc, curr) => acc.flatMap(a => curr.map(c => [...a, c])),
                [[]]
            )
        }

        const combinations = cartesianProduct(attributeArrays)
        const newGrid: VariantGridData[] = combinations.map(combo => {
            // Try to find existing variant with same combination
            const existing = variantGrid.find(v =>
                v.attributeValueIds.length === combo.length &&
                v.attributeValueIds.every(id => combo.includes(id))
            )
            return {
                attributeValueIds: combo,
                currentStock: existing?.currentStock || 0,
                sku: existing?.sku || ""
            }
        })

        onVariantGridChange(newGrid)
    }, [enabled, selectedValues])

    const toggleValue = (attributeId: string, valueId: string) => {
        const current = selectedValues[attributeId] || []
        const newValues = current.includes(valueId)
            ? current.filter(id => id !== valueId)
            : [...current, valueId]

        onSelectedValuesChange({
            ...selectedValues,
            [attributeId]: newValues
        })
    }

    const updateVariantStock = (index: number, stock: number) => {
        const newGrid = [...variantGrid]
        newGrid[index] = { ...newGrid[index], currentStock: stock }
        onVariantGridChange(newGrid)
    }

    const getValueLabel = (valueId: string): string => {
        for (const attr of attributes) {
            const value = attr.values.find(v => v.id === valueId)
            if (value) return value.value
        }
        return valueId
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (attributes.length === 0) {
        return (
            <div className="p-4 border border-dashed border-border rounded-lg text-center text-sm text-muted-foreground">
                Nenhum atributo de variante configurado.
                <br />
                Configure em Configurações → Tipo de Negócio.
            </div>
        )
    }

    return (
        <div className="space-y-4 border-t border-border pt-4 mt-2">
            {/* Toggle */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                    <Label className="text-foreground font-medium">Produto com Variantes?</Label>
                </div>
                <Switch checked={enabled} onCheckedChange={onEnabledChange} />
            </div>

            {enabled && (
                <>
                    {/* Attribute Selectors */}
                    {attributes.map(attr => (
                        <div key={attr.id} className="space-y-2">
                            <Label className="text-foreground text-sm">{attr.name}</Label>
                            <div className="flex flex-wrap gap-2">
                                {attr.values.map(v => {
                                    const isSelected = (selectedValues[attr.id] || []).includes(v.id)
                                    return (
                                        <Badge
                                            key={v.id}
                                            variant={isSelected ? "default" : "outline"}
                                            className={`cursor-pointer transition-colors ${isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                                }`}
                                            onClick={() => toggleValue(attr.id, v.id)}
                                        >
                                            {v.value}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>
                    ))}

                    {/* Variant Grid */}
                    {variantGrid.length > 0 && (
                        <div className="space-y-2 pt-2">
                            <Label className="text-foreground text-sm">Estoque por Variante</Label>
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">Variante</th>
                                            <th className="px-3 py-2 text-left font-medium text-muted-foreground w-24">Estoque</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variantGrid.map((variant, index) => (
                                            <tr key={index} className="border-t border-border">
                                                <td className="px-3 py-2">
                                                    <div className="flex flex-wrap gap-1">
                                                        {variant.attributeValueIds.map(valueId => (
                                                            <Badge key={valueId} variant="secondary" className="text-xs">
                                                                {getValueLabel(valueId)}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <Input
                                                        type="number"
                                                        step="1"
                                                        min="0"
                                                        value={variant.currentStock}
                                                        onChange={(e) => updateVariantStock(index, parseFloat(e.target.value) || 0)}
                                                        className="h-8 w-20 bg-background border-input text-foreground"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {variantGrid.length} {variantGrid.length === 1 ? "variante" : "variantes"} serão criadas
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
