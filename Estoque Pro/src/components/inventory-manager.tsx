"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreateCategoryDialog } from "@/components/create-category-dialog"
import { CreateProductDialog } from "@/components/create-product-dialog"
import { Trash2, Edit } from "lucide-react"

// Initial mock data
const initialCategories = [
    { id: "cat-1", name: "Proteínas" },
    { id: "cat-2", name: "Laticínios" },
    { id: "cat-3", name: "Bebidas" },
]

const initialProducts = [
    { id: "1", name: "Carne de Sol", unit: "kg", minStock: 10, currentStock: 15, expiresAt: "2026-01-15", categoryId: "cat-1", categoryName: "Proteínas", responsible: "Admin" },
    { id: "2", name: "Frango", unit: "kg", minStock: 8, currentStock: 12, expiresAt: "2026-01-10", categoryId: "cat-1", categoryName: "Proteínas", responsible: "Admin" },
    { id: "3", name: "Queijo Coalho", unit: "kg", minStock: 5, currentStock: 2, expiresAt: "2026-01-05", categoryId: "cat-2", categoryName: "Laticínios", responsible: "Admin" },
    { id: "4", name: "Leite", unit: "L", minStock: 20, currentStock: 25, expiresAt: "2025-12-30", categoryId: "cat-2", categoryName: "Laticínios", responsible: "Staff" },
    { id: "5", name: "Água Mineral", unit: "L", minStock: 50, currentStock: 100, expiresAt: null, categoryId: "cat-3", categoryName: "Bebidas", responsible: "Admin" },
]

interface Category {
    id: string
    name: string
}

interface Product {
    id: string
    name: string
    unit: string
    minStock: number
    currentStock: number
    expiresAt: string | null
    categoryId: string
    categoryName: string
    responsible?: string
}

export function InventoryManager() {
    const [categories, setCategories] = React.useState<Category[]>(initialCategories)
    const [products, setProducts] = React.useState<Product[]>(initialProducts)
    const [activeTab, setActiveTab] = React.useState("all")

    const handleCategoryCreated = (category: Category) => {
        setCategories(prev => [...prev, category])
    }

    const handleProductCreated = (product: Product) => {
        setProducts(prev => [...prev, { ...product, responsible: "Admin" }])
    }

    const handleDeleteProduct = (id: string) => {
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            setProducts(prev => prev.filter(p => p.id !== id))
        }
    }

    const handleDeleteCategory = (id: string) => {
        const hasProducts = products.some(p => p.categoryId === id)
        if (hasProducts) {
            alert("Remova todos os produtos desta categoria antes de excluí-la.")
            return
        }
        if (confirm("Tem certeza que deseja excluir esta categoria?")) {
            setCategories(prev => prev.filter(c => c.id !== id))
        }
    }

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    const getFilteredProducts = () => {
        if (activeTab === "all") return products
        return products.filter(p => p.categoryId === activeTab)
    }

    const groupedProducts = React.useMemo(() => {
        const filtered = getFilteredProducts()
        const grouped: Record<string, Product[]> = {}

        filtered.forEach(product => {
            if (!grouped[product.categoryName]) {
                grouped[product.categoryName] = []
            }
            grouped[product.categoryName].push(product)
        })

        return grouped
    }, [products, activeTab])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Estoque</h2>
                <div className="flex items-center space-x-2">
                    <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
                    <CreateProductDialog
                        categories={categories}
                        onProductCreated={handleProductCreated}
                        trigger={<Button variant="default">Adicionar Produto</Button>}
                    />
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">Todos</TabsTrigger>
                    {categories.map(cat => (
                        <TabsTrigger key={cat.id} value={cat.id}>
                            {cat.name}
                            <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat.id); }}
                                className="ml-2 text-muted-foreground hover:text-destructive"
                            >
                                ×
                            </button>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={activeTab} className="space-y-4">
                    {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
                        <Card key={categoryName}>
                            <CardHeader className="py-3">
                                <CardTitle className="text-lg font-bold uppercase tracking-wide text-primary">
                                    {categoryName}
                                </CardTitle>
                                <CardDescription>
                                    {categoryProducts.length} {categoryProducts.length === 1 ? "item" : "itens"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-blue-50 dark:bg-blue-950/20">
                                            <TableRow>
                                                <TableHead className="w-[200px] font-bold">Produto</TableHead>
                                                <TableHead>Unidade</TableHead>
                                                <TableHead>Mínimo</TableHead>
                                                <TableHead>Atual</TableHead>
                                                <TableHead>Validade</TableHead>
                                                <TableHead className="hidden md:table-cell">Responsável</TableHead>
                                                <TableHead className="text-right">Ações</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categoryProducts.map((item, index) => {
                                                const isLowStock = item.currentStock < item.minStock
                                                const expiryDate = item.expiresAt ? new Date(item.expiresAt) : null
                                                const isExpiring = expiryDate ? expiryDate <= tomorrow : false

                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        className={cn(
                                                            index % 2 === 0 ? "bg-background" : "bg-muted/30",
                                                            isExpiring && "bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                                                        )}
                                                    >
                                                        <TableCell className="font-medium">{item.name}</TableCell>
                                                        <TableCell>{item.unit}</TableCell>
                                                        <TableCell>{item.minStock}</TableCell>
                                                        <TableCell className={cn(
                                                            isLowStock && "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200 font-bold"
                                                        )}>
                                                            {item.currentStock}
                                                            {isLowStock && <Badge variant="outline" className="ml-2 text-xs">Baixo</Badge>}
                                                        </TableCell>
                                                        <TableCell>
                                                            {expiryDate?.toLocaleDateString("pt-BR") || "-"}
                                                            {isExpiring && <Badge variant="destructive" className="ml-2 text-xs">Vencendo!</Badge>}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell">{item.responsible || "-"}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-destructive"
                                                                onClick={() => handleDeleteProduct(item.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {Object.keys(groupedProducts).length === 0 && (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-muted-foreground mb-4">Nenhum produto cadastrado nesta categoria.</p>
                                <CreateProductDialog
                                    categories={categories}
                                    onProductCreated={handleProductCreated}
                                />
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
