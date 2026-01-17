"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { CheckCircle, AlertTriangle, XCircle, Clock, Save, Info, Grid3X3 } from "lucide-react"
import { useStock, isLowStock, isOutOfStock, isExpiringSoon } from "@/context/stock-context"
import Link from "next/link"

interface StockEntryNewProps {
    userName?: string
    userRole?: "ADMIN" | "STAFF"
}

export function StockEntryNew({ userName = "Admin User", userRole = "ADMIN" }: StockEntryNewProps) {
    const { categories, products, settings, updateStock } = useStock()
    const [activeTab, setActiveTab] = React.useState("individual")
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [submitMessage, setSubmitMessage] = React.useState("")

    // Individual form state
    const [selectedProduct, setSelectedProduct] = React.useState("")
    const [quantity, setQuantity] = React.useState("")
    const [expiryDate, setExpiryDate] = React.useState("")

    // Batch form state
    const [batchData, setBatchData] = React.useState<Record<string, { qty: string, exp: string }>>({})

    const displayName = userName === "Admin User" ? (settings.ownerName || userName) : userName

    const handleIndividualSubmit = async () => {
        if (!selectedProduct || (!quantity && !expiryDate)) return

        setIsSubmitting(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        const product = products.find(p => p.id === selectedProduct)
        const qtyToSave = quantity ? parseFloat(quantity) : (product?.currentStock || 0)

        updateStock(
            selectedProduct,
            qtyToSave,
            expiryDate || undefined,
            displayName
        )

        setSubmitMessage("Estoque atualizado com sucesso!")
        setTimeout(() => setSubmitMessage(""), 3000)
        setSelectedProduct("")
        setQuantity("")
        setExpiryDate("")
        setIsSubmitting(false)
    }



    const handleBatchSave = async () => {
        const updates = Object.entries(batchData).filter(([_, data]) => {
            const hasQty = data.qty !== undefined && data.qty !== ""
            const hasExp = data.exp !== undefined && data.exp !== ""
            return hasQty || hasExp
        })

        if (updates.length === 0) {
            setSubmitMessage("Nenhuma alteração detectada. Preencha pelo menos a Quantidade ou a Validade.")
            setTimeout(() => setSubmitMessage(""), 3000)
            return
        }

        setIsSubmitting(true)
        await new Promise(resolve => setTimeout(resolve, 500))

        for (const [productId, data] of updates) {
            const product = products.find(p => p.id === productId)
            const qtyToSave = data.qty !== "" ? parseFloat(data.qty) : (product?.currentStock || 0)

            await updateStock(
                productId,
                qtyToSave,
                data.exp || undefined,
                displayName
            )
        }

        setSubmitMessage(`${updates.length} item(s) atualizado(s) com sucesso!`)
        setTimeout(() => setSubmitMessage(""), 3000)
        setBatchData({})
        setIsSubmitting(false)
    }

    const handleQtyChange = (productId: string, value: string) => {
        setBatchData(prev => ({
            ...prev,
            [productId]: { ...prev[productId], qty: value, exp: prev[productId]?.exp || "" }
        }))
    }

    const handleExpChange = (productId: string, value: string) => {
        setBatchData(prev => ({
            ...prev,
            [productId]: { ...prev[productId], exp: value, qty: prev[productId]?.qty || "" }
        }))
    }

    const getRowColor = (product: typeof products[0]) => {
        if (isOutOfStock(product)) return "bg-red-50 dark:bg-red-900/30"
        if (isLowStock(product, settings.lowStockThreshold)) return "bg-yellow-50 dark:bg-yellow-900/30"
        return "bg-green-50 dark:bg-green-900/20"
    }

    const getExpiryColor = (product: typeof products[0]) => {
        if (isExpiringSoon(product, settings.expiryWarningDays)) return "text-cyan-600 dark:text-cyan-400"
        return "text-muted-foreground"
    }

    const getStatusIcon = (product: typeof products[0]) => {
        if (isOutOfStock(product)) return <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
        if (isLowStock(product, settings.lowStockThreshold)) return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Preenchimento de Estoque</h1>
                        <p className="text-muted-foreground mt-1">Registre as quantidades atuais do estoque.</p>
                    </div>
                    {settings.businessType === "VESTUARIO" && (
                        <Link href="/stock-entry-grid">
                            <Button variant="outline" className="gap-2">
                                <Grid3X3 className="w-4 h-4" />
                                Entrada em Grade
                            </Button>
                        </Link>
                    )}
                </div>
            </div>

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30">
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center shrink-0">
                            <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <p className="text-sm text-foreground font-medium">Como funciona</p>
                            <p className="text-xs text-muted-foreground mt-1">
                                A quantidade inserida <strong className="text-blue-600 dark:text-blue-400">substitui</strong> a quantidade atual, não adiciona.
                                Por exemplo: se há 10kg e você digita 15, o estoque ficará com 15kg.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-muted">
                    <TabsTrigger value="individual">Individual</TabsTrigger>
                    <TabsTrigger value="batch">Em Lote</TabsTrigger>
                </TabsList>

                {/* Individual Tab */}
                <TabsContent value="individual" className="mt-6">
                    <Card className="bg-card border-border max-w-2xl">
                        <CardHeader>
                            <CardTitle className="text-foreground">Registro Individual</CardTitle>
                            <CardDescription>
                                Atualize o estoque de um produto específico
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">Produto</Label>
                                <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                    <SelectTrigger className="bg-background border-input text-foreground">
                                        <SelectValue placeholder="Selecione um produto" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border max-h-80">
                                        {categories.map(cat => (
                                            <React.Fragment key={cat.id}>
                                                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground bg-muted">
                                                    {cat.name}
                                                </div>
                                                {products
                                                    .filter(p => p.categoryId === cat.id)
                                                    .map(product => (
                                                        <SelectItem key={product.id} value={product.id}>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(product)}
                                                                <span>{product.name}</span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    ({product.currentStock} {product.unit})
                                                                </span>
                                                            </div>
                                                        </SelectItem>
                                                    ))
                                                }
                                            </React.Fragment>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-foreground">Quantidade Atual</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="Digite a quantidade"
                                        className="bg-background border-input text-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Esta quantidade substituirá a atual
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground">Data de Validade (opcional)</Label>
                                    <Input
                                        type="date"
                                        value={expiryDate}
                                        onChange={(e) => setExpiryDate(e.target.value)}
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <Button
                                    onClick={handleIndividualSubmit}
                                    disabled={isSubmitting || !selectedProduct || (!quantity && !expiryDate)}
                                    className="gap-2"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSubmitting ? "Salvando..." : "Salvar"}
                                </Button>
                                {submitMessage && (
                                    <span className="text-sm text-green-600 dark:text-green-400">{submitMessage}</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Batch Tab */}
                <TabsContent value="batch" className="mt-6 space-y-6">
                    {categories.map(cat => {
                        const catProducts = products.filter(p => p.categoryId === cat.id)
                        if (catProducts.length === 0) return null

                        return (
                            <Card key={cat.id} className="bg-card border-border">
                                <CardHeader>
                                    <CardTitle className="text-foreground">{cat.name}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted">
                                                <TableRow className="border-border hover:bg-transparent">
                                                    <TableHead className="text-muted-foreground w-[60px]">Status</TableHead>
                                                    <TableHead className="text-muted-foreground w-[180px]">Produto</TableHead>
                                                    <TableHead className="text-muted-foreground w-[100px] text-center">Atual</TableHead>
                                                    <TableHead className="text-muted-foreground w-[80px] text-center">Mínimo</TableHead>
                                                    <TableHead className="text-muted-foreground w-[120px] text-center">Vencimento</TableHead>
                                                    <TableHead className="text-muted-foreground w-[120px] text-center">Nova Qtd</TableHead>
                                                    <TableHead className="text-muted-foreground w-[150px] text-center">Nova Validade</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {catProducts.map(product => (
                                                    <TableRow
                                                        key={product.id}
                                                        className={cn("border-border", getRowColor(product))}
                                                    >
                                                        <TableCell>
                                                            {getStatusIcon(product)}
                                                        </TableCell>
                                                        <TableCell className="font-medium text-foreground">
                                                            {product.name}
                                                        </TableCell>
                                                        <TableCell className="text-center text-muted-foreground">
                                                            {product.currentStock} {product.unit}
                                                        </TableCell>
                                                        <TableCell className="text-center text-muted-foreground">
                                                            {product.minStock}
                                                        </TableCell>
                                                        <TableCell className={cn("text-center", getExpiryColor(product))}>
                                                            {product.expiresAt
                                                                ? new Date(product.expiresAt).toLocaleDateString("pt-BR")
                                                                : "-"
                                                            }
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                value={batchData[product.id]?.qty || ""}
                                                                onChange={(e) => handleQtyChange(product.id, e.target.value)}
                                                                placeholder={String(product.currentStock)}
                                                                className="w-24 h-8 text-center bg-background border-input text-foreground"
                                                            />
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <Input
                                                                type="date"
                                                                value={batchData[product.id]?.exp || ""}
                                                                onChange={(e) => handleExpChange(product.id, e.target.value)}
                                                                className="w-36 h-8 bg-background border-input text-foreground"
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}

                    <div className="flex items-center gap-4">
                        <Button
                            onClick={handleBatchSave}
                            disabled={isSubmitting}
                            size="lg"
                            className="gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? "Salvando..." : "Salvar Alterações (Atualizado)"}
                        </Button>
                        {submitMessage && (
                            <span className="text-sm text-green-600 dark:text-green-400">{submitMessage}</span>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
