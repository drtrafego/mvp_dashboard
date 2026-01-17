"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react"

// Mock data
const initialCategories = [
    { id: "all", name: "Todas" },
    { id: "cat-1", name: "Proteínas" },
    { id: "cat-2", name: "Laticínios" },
    { id: "cat-3", name: "Bebidas" },
]

const initialProducts = [
    { id: "1", name: "Carne de Sol", unit: "kg", minStock: 10, currentStock: 15, expiresAt: "2026-01-15", categoryId: "cat-1", category: "Proteínas" },
    { id: "2", name: "Frango", unit: "kg", minStock: 8, currentStock: 12, expiresAt: "2026-01-10", categoryId: "cat-1", category: "Proteínas" },
    { id: "3", name: "Queijo Coalho", unit: "kg", minStock: 5, currentStock: 2, expiresAt: "2026-01-05", categoryId: "cat-2", category: "Laticínios" },
    { id: "4", name: "Leite", unit: "L", minStock: 20, currentStock: 25, expiresAt: "2025-12-30", categoryId: "cat-2", category: "Laticínios" },
    { id: "5", name: "Água Mineral", unit: "L", minStock: 50, currentStock: 100, expiresAt: "", categoryId: "cat-3", category: "Bebidas" },
    { id: "6", name: "Refrigerante", unit: "L", minStock: 30, currentStock: 45, expiresAt: "2026-06-15", categoryId: "cat-3", category: "Bebidas" },
]

interface StockEntryFormProps {
    userId: string
}

interface StockChange {
    qty: string
    exp: string
    changed: boolean
}

export function StockEntryForm({ userId }: StockEntryFormProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSaved, setIsSaved] = React.useState(false)
    const [selectedCategory, setSelectedCategory] = React.useState("all")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [stockData, setStockData] = React.useState<Record<string, StockChange>>({})
    const [saveResult, setSaveResult] = React.useState<{ updated: number; lowStock: number; expiring: number } | null>(null)

    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)
    const todayStr = today.toLocaleDateString("pt-BR")

    const filteredProducts = initialProducts.filter(p => {
        const matchesCategory = selectedCategory === "all" || p.categoryId === selectedCategory
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const handleQtyChange = (productId: string, value: string) => {
        setStockData(prev => ({
            ...prev,
            [productId]: { ...prev[productId], qty: value, changed: true }
        }))
        setIsSaved(false)
        setSaveResult(null)
    }

    const handleExpChange = (productId: string, value: string) => {
        setStockData(prev => ({
            ...prev,
            [productId]: { ...prev[productId], exp: value, changed: true }
        }))
        setIsSaved(false)
        setSaveResult(null)
    }

    const handleSave = async () => {
        setIsLoading(true)

        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000))

        const changedItems = Object.entries(stockData).filter(([_, data]) => data.changed)
        let lowStockCount = 0
        let expiringCount = 0

        changedItems.forEach(([id, data]) => {
            const product = initialProducts.find(p => p.id === id)
            if (product) {
                const newQty = parseFloat(data.qty) || product.currentStock
                if (newQty < product.minStock) lowStockCount++

                if (data.exp) {
                    const expDate = new Date(data.exp)
                    if (expDate <= tomorrow) expiringCount++
                }
            }
        })

        setSaveResult({
            updated: changedItems.length,
            lowStock: lowStockCount,
            expiring: expiringCount
        })
        setIsSaved(true)
        setIsLoading(false)
    }

    const handleDiscard = () => {
        setStockData({})
        setSaveResult(null)
        setIsSaved(false)
    }

    const changedCount = Object.values(stockData).filter(d => d.changed).length

    return (
        <div className="space-y-4">
            {/* Header with filters and actions */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-muted/30 p-4 rounded-lg">
                <div className="flex gap-2 flex-wrap">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-[180px] bg-background">
                            <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            {initialCategories.map(cat => (
                                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder="Buscar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-[200px] bg-background"
                    />
                </div>
                <div className="flex gap-2 items-center">
                    {changedCount > 0 && (
                        <span className="text-sm text-muted-foreground">
                            {changedCount} {changedCount === 1 ? "alteração" : "alterações"}
                        </span>
                    )}
                    <Button variant="outline" onClick={handleDiscard} disabled={isLoading || changedCount === 0}>
                        Descartar
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading || changedCount === 0}>
                        {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>

            {/* Save result feedback */}
            {saveResult && (
                <Card className={cn(
                    "border-2",
                    saveResult.lowStock > 0 || saveResult.expiring > 0
                        ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20"
                        : "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}>
                    <CardContent className="py-4">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium">{saveResult.updated} itens atualizados</span>
                            </div>
                            {saveResult.lowStock > 0 && (
                                <div className="flex items-center gap-2 text-yellow-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    <span>{saveResult.lowStock} abaixo do estoque mínimo</span>
                                </div>
                            )}
                            {saveResult.expiring > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <XCircle className="h-5 w-5" />
                                    <span>{saveResult.expiring} próximo do vencimento</span>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Stock entry table */}
            <div className="rounded-md border overflow-x-auto bg-background">
                <Table>
                    <TableHeader className="bg-gray-100 dark:bg-gray-800">
                        <TableRow>
                            <TableHead className="w-[200px] font-bold">Produto</TableHead>
                            <TableHead>Unidade</TableHead>
                            <TableHead>Mínimo</TableHead>
                            <TableHead className="bg-blue-50 dark:bg-blue-950/30">Qtd Atual</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="bg-blue-50 dark:bg-blue-950/30">Validade</TableHead>
                            <TableHead>Responsável</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product, index) => {
                            const currentQty = stockData[product.id]?.qty !== undefined
                                ? parseFloat(stockData[product.id].qty)
                                : product.currentStock
                            const isLowStock = currentQty < product.minStock
                            const currentExp = stockData[product.id]?.exp || product.expiresAt
                            const expDate = currentExp ? new Date(currentExp) : null
                            const isExpiring = expDate ? expDate <= tomorrow : false

                            return (
                                <TableRow
                                    key={product.id}
                                    className={cn(
                                        index % 2 === 0 ? "bg-background" : "bg-muted/30",
                                        isExpiring && "bg-red-50 dark:bg-red-950/20"
                                    )}
                                >
                                    <TableCell className="font-bold">{product.name}</TableCell>
                                    <TableCell>{product.unit}</TableCell>
                                    <TableCell>{product.minStock}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.1"
                                            placeholder={String(product.currentStock)}
                                            value={stockData[product.id]?.qty ?? ""}
                                            onChange={(e) => handleQtyChange(product.id, e.target.value)}
                                            className={cn(
                                                "w-24 focus:ring-2 focus:ring-blue-500",
                                                isLowStock && "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/30"
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{todayStr}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="date"
                                            value={stockData[product.id]?.exp ?? product.expiresAt ?? ""}
                                            onChange={(e) => handleExpChange(product.id, e.target.value)}
                                            className={cn(
                                                "w-40 focus:ring-2 focus:ring-blue-500",
                                                isExpiring && "border-red-500 bg-red-50 dark:bg-red-900/30"
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">Você</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhum produto encontrado com os filtros atuais.
                </div>
            )}
        </div>
    )
}
