"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { type CustomColumn, useStock } from "@/context/stock-context"
import { VariantSelector } from "@/components/variant-selector"

interface Category {
    id: string
    name: string
}

interface CreateProductDialogProps {
    categories: Category[]
    onProductCreated: (product: {
        id: string
        name: string
        unit: string
        minStock: number
        currentStock: number
        expiresAt: string | null
        categoryId: string
        categoryName: string
        unitPrice?: number
        customFields?: Record<string, string>
    }) => void
    trigger?: React.ReactNode
    customColumns?: CustomColumn[]
}

export function CreateProductDialog({ categories, onProductCreated, trigger, customColumns = [] }: CreateProductDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const { addProduct } = useStock()
    const [formData, setFormData] = React.useState({
        name: "",
        unit: "kg",
        minStock: "0",
        currentStock: "0",
        expiresAt: "",
        categoryId: "",
        unitPrice: ""
    })
    const [customFieldValues, setCustomFieldValues] = React.useState<Record<string, string>>({})

    // Variant state
    const [businessType, setBusinessType] = React.useState<string>("VAREJO_GERAL")
    const [variantEnabled, setVariantEnabled] = React.useState(false)
    const [selectedVariantValues, setSelectedVariantValues] = React.useState<Record<string, string[]>>({})
    const [variantGrid, setVariantGrid] = React.useState<{ attributeValueIds: string[]; currentStock: number; sku?: string }[]>([])

    // Fetch business type when dialog opens
    React.useEffect(() => {
        if (open) {
            const fetchBusinessType = async () => {
                try {
                    const res = await fetch("/api/organization/business-type")
                    if (res.ok) {
                        const data = await res.json()
                        setBusinessType(data.businessType)
                    }
                } catch (error) {
                    console.error("Error fetching business type:", error)
                }
            }
            fetchBusinessType()
        }
    }, [open])

    // Reset custom fields when dialog opens
    React.useEffect(() => {
        if (open) {
            const initialFields: Record<string, string> = {}
            customColumns.forEach(col => {
                initialFields[col.id] = ""
            })
            setCustomFieldValues(initialFields)
            // Reset variant state
            setVariantEnabled(false)
            setSelectedVariantValues({})
            setVariantGrid([])
        }
    }, [open, customColumns])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.categoryId) return

        setIsLoading(true)

        try {
            const category = categories.find(c => c.id === formData.categoryId)

            // Calculate total stock from variants if using variants
            const totalStock = variantEnabled && variantGrid.length > 0
                ? variantGrid.reduce((sum, v) => sum + v.currentStock, 0)
                : parseFloat(formData.currentStock) || 0

            const newProduct = {
                name: formData.name.trim(),
                unit: formData.unit,
                minStock: parseFloat(formData.minStock) || 0,
                currentStock: totalStock,
                expiresAt: formData.expiresAt || null,
                categoryId: formData.categoryId,
                categoryName: category?.name || "",
                unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : undefined,
                customFields: { ...customFieldValues },
                responsible: "Admin User",
                hasVariants: variantEnabled && variantGrid.length > 0,
                variants: variantEnabled && variantGrid.length > 0 ? variantGrid.map((v: any) => ({
                    currentStock: Number(v.currentStock),
                    sku: v.sku,
                    attributeValueIds: Object.values(v.attributes || {}) as string[] // Send IDs of selected values
                })) : undefined
            }

            await addProduct(newProduct)

            // If variants enabled, create them after product is created
            // Note: This would need the product ID returned from addProduct
            // For now, variants will need to be added separately or we need to update the API
            // to accept variants in product creation

            if (onProductCreated) {
                // Pass a placeholder ID as the list updates via context
                onProductCreated({ ...newProduct, id: "temp" })
            }

            setFormData({ name: "", unit: "kg", minStock: "0", currentStock: "0", expiresAt: "", categoryId: "", unitPrice: "" })
            setCustomFieldValues({})
            setVariantEnabled(false)
            setSelectedVariantValues({})
            setVariantGrid([])
            setOpen(false)
        } catch (error) {
            console.error("Failed to create product:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button>Adicionar Produto</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Novo Produto</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Adicione um novo produto ao estoque.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {/* Row 1: Category + Name */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-foreground">Categoria</Label>
                                <Select value={formData.categoryId} onValueChange={(v) => setFormData(prev => ({ ...prev, categoryId: v }))}>
                                    <SelectTrigger className="w-full bg-background border-input text-foreground">
                                        <SelectValue placeholder="Selecione..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="product-name" className="text-foreground">Nome</Label>
                                <Input
                                    id="product-name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Ex: Carne de Sol"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        {/* Row 2: Unit + Current Qty */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="unit" className="text-foreground">Unidade</Label>
                                <Select value={formData.unit} onValueChange={(v) => setFormData(prev => ({ ...prev, unit: v }))}>
                                    <SelectTrigger className="w-full bg-background border-input text-foreground">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="g">g</SelectItem>
                                        <SelectItem value="L">L</SelectItem>
                                        <SelectItem value="un">unidades</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg -mt-2">
                                <Label htmlFor="currentStock" className="text-green-700 dark:text-green-400 font-medium">Qtd Atual</Label>
                                <Input
                                    id="currentStock"
                                    type="number"
                                    step="0.1"
                                    value={formData.currentStock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, currentStock: e.target.value }))}
                                    placeholder="0"
                                    className="bg-background border-green-300 dark:border-green-700 text-foreground"
                                />
                            </div>
                        </div>

                        {/* Row 3: Min Stock + Unit Price */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="minStock" className="text-foreground">Estoque Mín.</Label>
                                <Input
                                    id="minStock"
                                    type="number"
                                    step="0.1"
                                    value={formData.minStock}
                                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unitPrice" className="text-foreground">Valor Unit. (R$)</Label>
                                <Input
                                    id="unitPrice"
                                    type="number"
                                    step="0.01"
                                    value={formData.unitPrice}
                                    onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: e.target.value }))}
                                    placeholder="0.00"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>

                        {/* Row 4: Expiry Date */}
                        <div className="space-y-2">
                            <Label htmlFor="expiresAt" className="text-foreground">Validade</Label>
                            <Input
                                id="expiresAt"
                                type="date"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        {/* Variant Selector - Only show for VESTUARIO business type */}
                        {businessType === "VESTUARIO" && (
                            <VariantSelector
                                enabled={variantEnabled}
                                onEnabledChange={setVariantEnabled}
                                selectedValues={selectedVariantValues}
                                onSelectedValuesChange={setSelectedVariantValues}
                                variantGrid={variantGrid}
                                onVariantGridChange={setVariantGrid}
                            />
                        )}

                        {/* Custom Columns */}
                        {customColumns.length > 0 && (
                            <div className="border-t border-border pt-4 mt-2 space-y-3">
                                <p className="text-sm text-muted-foreground">Campos Personalizados</p>
                                {customColumns.map(col => (
                                    <div key={col.id} className="space-y-2">
                                        <Label className="text-foreground">{col.name}</Label>
                                        <Input
                                            value={customFieldValues[col.id] || ""}
                                            onChange={(e) => setCustomFieldValues(prev => ({ ...prev, [col.id]: e.target.value }))}
                                            placeholder={`Digite ${col.name.toLowerCase()}`}
                                            className="bg-background border-input text-foreground"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.name.trim() || !formData.categoryId}>
                            {isLoading ? "Criando..." : "Criar Produto"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
