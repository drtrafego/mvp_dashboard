"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Grid3X3, ArrowLeft } from "lucide-react"
import { useStock } from "@/context/stock-context"
import { VariantStockGrid } from "@/components/variant-stock-grid"
import Link from "next/link"

export function StockEntryGridContent() {
    const { products, categories } = useStock()
    const [searchTerm, setSearchTerm] = React.useState("")
    const [selectedCategory, setSelectedCategory] = React.useState<string>("all")
    const [selectedProduct, setSelectedProduct] = React.useState<{ id: string, name: string } | null>(null)

    // Filter products that have variants
    const variantProducts = products.filter(p =>
        p.hasVariants && // Assuming this flag exists on product type in context
        (selectedCategory === "all" || p.categoryId === selectedCategory) &&
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/stock-entry">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Entrada em Grade</h1>
                    <p className="text-muted-foreground mt-1">Gerenciamento de estoque por matriz de variantes</p>
                </div>
            </div>

            {selectedProduct ? (
                <div className="space-y-4">
                    <Button variant="ghost" onClick={() => setSelectedProduct(null)} className="mb-2">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar para lista
                    </Button>
                    <VariantStockGrid
                        productId={selectedProduct.id}
                        productName={selectedProduct.name}
                        onClose={() => setSelectedProduct(null)}
                    />
                </div>
            ) : (
                <Card className="bg-card border-border">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row gap-4 justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-foreground">Selecione um Produto</CardTitle>
                                <CardDescription>Produtos cadastrados com variantes</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar produto..."
                                        className="pl-8 w-[200px] bg-background border-input text-foreground"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                >
                                    <option value="all">Todas Categorias</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {variantProducts.length === 0 ? (
                                <div className="col-span-full text-center py-12 text-muted-foreground">
                                    Nenhum produto com variantes encontrado.
                                    <br />
                                    Cadastre produtos com o tipo de negócio "Vestuário" habilitado.
                                </div>
                            ) : (
                                variantProducts.map(product => (
                                    <Button
                                        key={product.id}
                                        variant="outline"
                                        className="h-auto p-4 flex flex-col items-start gap-2 bg-muted/50 hover:bg-muted border-border"
                                        onClick={() => setSelectedProduct({ id: product.id, name: product.name })}
                                    >
                                        <div className="flex w-full items-start justify-between">
                                            <span className="font-semibold text-lg">{product.name}</span>
                                            <Badge variant="secondary"><Grid3X3 className="w-3 h-3 mr-1" /> Grade</Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground w-full flex justify-between">
                                            <span>{product.categoryName}</span>
                                            <span>{product.currentStock} {product.unit} total</span>
                                        </div>
                                    </Button>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
