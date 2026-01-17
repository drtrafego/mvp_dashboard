"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { CreateCategoryDialog } from "@/components/create-category-dialog"
import { EditCategoryDialog } from "@/components/edit-category-dialog"
import { CreateProductDialog } from "@/components/create-product-dialog"
import { Badge } from "@/components/ui/badge"
import { Trash2, Edit, Plus, Package, AlertTriangle, XCircle, Clock, Search, CheckCircle, X } from "lucide-react"
import { useStock, type Category, type Product, isLowStock, isOutOfStock, isExpiringSoon } from "@/context/stock-context"

interface InventoryManagerNewProps {
    isAdmin?: boolean
}

export function InventoryManagerNew({ isAdmin = true }: InventoryManagerNewProps) {
    const {
        categories, products, customColumns, settings,
        addCategory, updateCategory, deleteCategory, addProduct, updateProduct, deleteProduct,
        addCustomColumn, deleteCustomColumn, updateProductCustomField, updateCustomColumn
    } = useStock()
    const [activeTab, setActiveTab] = React.useState("items")
    const [searchTerm, setSearchTerm] = React.useState("")
    const [newColumnName, setNewColumnName] = React.useState("")
    const [isColumnDialogOpen, setIsColumnDialogOpen] = React.useState(false)
    const [editingColId, setEditingColId] = React.useState<string | null>(null)
    const [editingColName, setEditingColName] = React.useState("")

    const handleStartColEdit = (col: { id: string, name: string }) => {
        setEditingColId(col.id)
        setEditingColName(col.name)
    }

    const handleSaveColEdit = async (id: string) => {
        if (editingColName.trim()) {
            await updateCustomColumn(id, editingColName)
            setEditingColId(null)
            setEditingColName("")
        }
    }

    const handleCancelColEdit = () => {
        setEditingColId(null)
        setEditingColName("")
    }

    // Edit dialog state
    const [editProduct, setEditProduct] = React.useState<Product | null>(null)
    const [editName, setEditName] = React.useState("")
    const [editMinStock, setEditMinStock] = React.useState("")
    const [editUnitPrice, setEditUnitPrice] = React.useState("")
    const [editCategory, setEditCategory] = React.useState("")
    const [editExpiresAt, setEditExpiresAt] = React.useState("")

    // Calculate stats
    const totalItems = products.length
    const outOfStock = products.filter(isOutOfStock).length
    const lowStock = products.filter(p => isLowStock(p, settings.lowStockThreshold)).length
    const expiringCount = products.filter(p => isExpiringSoon(p, settings.expiryWarningDays)).length

    const handleCategoryCreated = (category: Category) => {
        // Category created by dialog via context
        // No need to call addCategory again
        console.log("Category created:", category.name)
    }

    const handleProductCreated = (product: Product) => {
        // Product created by dialog via context
        // No need to call addProduct again
        console.log("Product created:", product.name)
    }

    const handleDeleteProduct = (id: string) => {
        if (!isAdmin) {
            alert("Apenas administradores podem excluir produtos.")
            return
        }
        if (confirm("Tem certeza que deseja excluir este produto?")) {
            deleteProduct(id)
        }
    }

    const handleDeleteCategory = async (id: string) => {
        if (!isAdmin) {
            alert("Apenas administradores podem excluir categorias.")
            return
        }
        if (!confirm("Tem certeza que deseja excluir esta categoria?")) {
            return
        }
        const success = await deleteCategory(id)
        if (!success) {
            alert("Remova todos os produtos desta categoria antes de excluí-la.")
        }
    }

    const handleAddColumn = () => {
        if (!newColumnName.trim()) return
        const column = {
            id: `col-${Date.now()}`,
            name: newColumnName.trim(),
            createdAt: new Date().toISOString()
        }
        addCustomColumn(column)
        setNewColumnName("")
        setIsColumnDialogOpen(false)
    }

    const handleCustomFieldChange = (productId: string, columnId: string, value: string) => {
        updateProductCustomField(productId, columnId, value)
    }

    const openEditDialog = (product: Product) => {
        // Get fresh product data from context to ensure we have latest customFields
        const freshProduct = products.find(p => p.id === product.id) || product
        setEditProduct(freshProduct)
        setEditName(freshProduct.name)
        setEditMinStock(String(freshProduct.minStock))
        setEditUnitPrice(freshProduct.unitPrice ? String(freshProduct.unitPrice) : "")
        setEditCategory(freshProduct.categoryId)
        setEditExpiresAt(freshProduct.expiresAt || "")
    }

    const handleSaveEdit = () => {
        if (!editProduct) return
        const category = categories.find(c => c.id === editCategory)
        updateProduct(editProduct.id, {
            name: editName,
            minStock: parseFloat(editMinStock),
            unitPrice: editUnitPrice ? parseFloat(editUnitPrice) : undefined,
            categoryId: editCategory,
            categoryName: category?.name || editProduct.categoryName,
            expiresAt: editExpiresAt || null,
            customFields: editProduct.customFields
        })
        setEditProduct(null)
    }

    const getRowColor = (product: Product) => {
        const isOut = isOutOfStock(product)
        const isLow = isLowStock(product, settings.lowStockThreshold)
        const isExp = isExpiringSoon(product, settings.expiryWarningDays)

        if (isOut) return "bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40"
        if (isLow && isExp) return "bg-orange-50 dark:bg-orange-900/30 hover:bg-orange-100 dark:hover:bg-orange-900/40"
        if (isLow) return "bg-yellow-50 dark:bg-yellow-900/30 hover:bg-yellow-100 dark:hover:bg-yellow-900/40"
        if (isExp) return "bg-cyan-50 dark:bg-cyan-900/20 hover:bg-cyan-100 dark:hover:bg-cyan-900/30"
        return "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30"
    }

    const getExpiryColor = (product: Product) => {
        if (isExpiringSoon(product, settings.expiryWarningDays))
            return "text-cyan-700 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30 px-2 py-1 rounded"
        return "text-muted-foreground"
    }

    // Get multiple status badges for a product
    const getStatusBadges = (product: Product) => {
        const badges = []

        if (isOutOfStock(product)) {
            badges.push(<Badge key="out" className="bg-red-600 hover:bg-red-700 text-white text-xs">Sem Estoque</Badge>)
        } else if (isLowStock(product, settings.lowStockThreshold)) {
            badges.push(<Badge key="low" className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs">Baixo</Badge>)
        }

        if (isExpiringSoon(product, settings.expiryWarningDays)) {
            badges.push(<Badge key="exp" className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs">Vencendo</Badge>)
        }

        if (badges.length === 0) {
            badges.push(<Badge key="ok" className="bg-green-600 hover:bg-green-700 text-white text-xs">OK</Badge>)
        }

        return <div className="flex gap-1 justify-center flex-wrap">{badges}</div>
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const groupedProducts = React.useMemo(() => {
        const grouped: Record<string, Product[]> = {}
        filteredProducts.forEach(product => {
            if (!grouped[product.categoryName]) {
                grouped[product.categoryName] = []
            }
            grouped[product.categoryName].push(product)
        })
        return grouped
    }, [filteredProducts])

    const formatCurrency = (value?: number) => {
        if (!value) return "-"
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Gestão de Estoque</h1>
                <p className="text-muted-foreground mt-1">Gerencie itens, categorias e níveis mínimos.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-3 lg:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total</p>
                                <p className="text-xl lg:text-2xl font-bold text-foreground">{totalItems}</p>
                            </div>
                            <Package className="w-6 h-6 lg:w-8 lg:h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-3 lg:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Sem Estoque</p>
                                <p className="text-xl lg:text-2xl font-bold text-red-600 dark:text-red-400">{outOfStock}</p>
                            </div>
                            <XCircle className="w-6 h-6 lg:w-8 lg:h-8 text-red-600 dark:text-red-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-3 lg:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Baixo</p>
                                <p className="text-xl lg:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{lowStock}</p>
                            </div>
                            <AlertTriangle className="w-6 h-6 lg:w-8 lg:h-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card border-border">
                    <CardContent className="p-3 lg:p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Vencendo</p>
                                <p className="text-xl lg:text-2xl font-bold text-cyan-600 dark:text-cyan-400">{expiringCount}</p>
                            </div>
                            <Clock className="w-6 h-6 lg:w-8 lg:h-8 text-cyan-600 dark:text-cyan-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <TabsList className="bg-muted w-full sm:w-auto">
                        <TabsTrigger value="items" className="flex-1 sm:flex-none">Itens</TabsTrigger>
                        <TabsTrigger value="categories" className="flex-1 sm:flex-none">Categorias</TabsTrigger>
                    </TabsList>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1 sm:flex-none">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar itens..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full sm:w-[200px] bg-background border-input text-foreground"
                            />
                        </div>
                        {isAdmin && (
                            <div className="flex gap-2">
                                {/* Add Column Dialog */}
                                <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Gerenciar Colunas
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="bg-card border-border">
                                        <DialogHeader>
                                            <DialogTitle className="text-foreground">Colunas Personalizadas</DialogTitle>
                                            <DialogDescription className="text-muted-foreground">
                                                Adicione ou remova colunas da tabela de estoque.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label className="text-foreground">Nome da Coluna</Label>
                                                <Input
                                                    value={newColumnName}
                                                    onChange={(e) => setNewColumnName(e.target.value)}
                                                    placeholder="Ex: Fornecedor"
                                                    className="bg-background border-input text-foreground"
                                                />
                                            </div>
                                            {customColumns.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label className="text-foreground">Colunas Existentes</Label>
                                                    <div className="space-y-1">
                                                        {customColumns.map(col => (
                                                            <div key={col.id} className="flex items-center justify-between py-1 px-2 bg-muted rounded">
                                                                {editingColId === col.id ? (
                                                                    <div className="flex flex-1 items-center gap-2">
                                                                        <Input
                                                                            value={editingColName}
                                                                            onChange={(e) => setEditingColName(e.target.value)}
                                                                            className="h-8 text-sm"
                                                                            autoFocus
                                                                        />
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-green-600 hover:text-green-700"
                                                                            onClick={() => handleSaveColEdit(col.id)}
                                                                        >
                                                                            <CheckCircle className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                            onClick={handleCancelColEdit}
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                ) : (
                                                                    <>
                                                                        <span className="text-sm text-muted-foreground">{col.name}</span>
                                                                        <div className="flex items-center">
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                                onClick={() => handleStartColEdit(col)}
                                                                            >
                                                                                <Edit className="h-4 w-4" />
                                                                            </Button>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="icon"
                                                                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                                onClick={() => deleteCustomColumn(col.id)}
                                                                            >
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </Button>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button onClick={handleAddColumn} disabled={!newColumnName.trim()}>
                                                Adicionar Coluna
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />
                                <CreateProductDialog
                                    categories={categories}
                                    onProductCreated={handleProductCreated}
                                    customColumns={customColumns}
                                    trigger={
                                        <Button className="bg-green-600 hover:bg-green-700 text-sm">
                                            <Plus className="w-4 h-4 mr-1 lg:mr-2" />
                                            <span className="hidden sm:inline">Novo Item</span>
                                        </Button>
                                    }
                                />
                            </div>
                        )}
                    </div>
                </div>

                <TabsContent value="items" className="mt-4 space-y-6">
                    {Object.entries(groupedProducts).map(([categoryName, categoryProducts]) => (
                        <div key={categoryName}>
                            <h2 className="text-lg font-semibold text-foreground mb-3">{categoryName}</h2>
                            <Card className="bg-card border-border overflow-hidden">
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-muted">
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="font-semibold text-muted-foreground w-[180px]">Nome</TableHead>
                                                <TableHead className="text-muted-foreground w-[120px] text-center">Status</TableHead>
                                                <TableHead className="text-muted-foreground w-[80px] text-center">Atual</TableHead>
                                                <TableHead className="text-muted-foreground w-[80px] text-center">Mínimo</TableHead>
                                                <TableHead className="text-muted-foreground w-[80px] text-center">Unidade</TableHead>
                                                <TableHead className="text-muted-foreground w-[100px] text-center">Valor Unit.</TableHead>
                                                <TableHead className="text-muted-foreground w-[120px] text-center">Vencimento</TableHead>
                                                <TableHead className="text-muted-foreground w-[120px] text-center">Última Contagem</TableHead>
                                                {customColumns.map(col => (
                                                    <TableHead key={col.id} className="text-muted-foreground w-[120px] text-center">
                                                        {col.name}
                                                    </TableHead>
                                                ))}
                                                {isAdmin && <TableHead className="text-right text-muted-foreground w-[80px]">Ações</TableHead>}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {categoryProducts.map((item) => {
                                                // Format date directly from string to avoid timezone issues
                                                const formatDateDisplay = (dateValue: string | null | undefined): string => {
                                                    if (!dateValue) return "-";
                                                    // If it's ISO format (YYYY-MM-DD), parse manually
                                                    if (typeof dateValue === 'string' && dateValue.includes('-')) {
                                                        const parts = dateValue.split('T')[0].split('-');
                                                        if (parts.length === 3) {
                                                            return `${parts[2]}/${parts[1]}/${parts[0]}`;
                                                        }
                                                    }
                                                    // Fallback to Date object with T12:00:00 to avoid timezone shift
                                                    const d = new Date(dateValue + 'T12:00:00');
                                                    return d.toLocaleDateString("pt-BR");
                                                };
                                                const expiryDateStr = formatDateDisplay(item.expiresAt);
                                                const expiryDate = item.expiresAt ? new Date(item.expiresAt + 'T12:00:00') : null;
                                                return (
                                                    <TableRow
                                                        key={item.id}
                                                        className={cn("border-border", getRowColor(item))}
                                                    >
                                                        <TableCell className="font-medium text-foreground">{item.name}</TableCell>
                                                        <TableCell className="text-center">{getStatusBadges(item)}</TableCell>
                                                        <TableCell className="text-muted-foreground text-center">{item.currentStock}</TableCell>
                                                        <TableCell className="text-muted-foreground text-center">{item.minStock}</TableCell>
                                                        <TableCell className="text-muted-foreground text-center">{item.unit}</TableCell>
                                                        <TableCell className="text-muted-foreground text-center">{formatCurrency(item.unitPrice)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={getExpiryColor(item)}>
                                                                {expiryDateStr}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-center">
                                                            {formatDateDisplay(item.lastCountAt)}
                                                        </TableCell>
                                                        {customColumns.map(col => (
                                                            <TableCell key={col.id} className="text-center">
                                                                {isAdmin ? (
                                                                    <Input
                                                                        value={item.customFields?.[col.id] || ""}
                                                                        onChange={(e) => handleCustomFieldChange(item.id, col.id, e.target.value)}
                                                                        className="h-8 w-full text-xs bg-background border-input text-foreground"
                                                                        placeholder="-"
                                                                    />
                                                                ) : (
                                                                    <span className="text-muted-foreground">{item.customFields?.[col.id] || "-"}</span>
                                                                )}
                                                            </TableCell>
                                                        ))}
                                                        {isAdmin && (
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                    onClick={() => openEditDialog(item)}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                    onClick={() => handleDeleteProduct(item.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TableCell>
                                                        )}
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </Card>
                        </div>
                    ))}

                    {Object.keys(groupedProducts).length === 0 && (
                        <Card className="bg-card border-border">
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-muted-foreground mb-4">Nenhum produto encontrado.</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                <TabsContent value="categories" className="mt-4">
                    <Card className="bg-card border-border">
                        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <CardTitle className="text-foreground">Categorias</CardTitle>
                                <CardDescription>Gerencie as categorias de produtos</CardDescription>
                            </div>
                            {isAdmin && <CreateCategoryDialog onCategoryCreated={handleCategoryCreated} />}
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categories.map(cat => {
                                    const catProducts = products.filter(p => p.categoryId === cat.id)
                                    return (
                                        <div
                                            key={cat.id}
                                            className="p-4 bg-muted border border-border rounded-lg flex justify-between items-start"
                                        >
                                            <div>
                                                <h3 className="font-semibold text-foreground">{cat.name}</h3>
                                                <p className="text-sm text-muted-foreground">{catProducts.length} itens</p>
                                            </div>
                                            {isAdmin && (
                                                <div className="flex gap-1">
                                                    <EditCategoryDialog category={cat} />
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-red-500 hover:text-red-600"
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs >

            {/* Edit Product Dialog */}
            < Dialog open={!!editProduct
            } onOpenChange={(open) => !open && setEditProduct(null)}>
                <DialogContent className="bg-card border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Editar Produto</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Altere as informações do produto
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">Nome</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-foreground">Estoque Mínimo</Label>
                                <Input
                                    type="number"
                                    value={editMinStock}
                                    onChange={(e) => setEditMinStock(e.target.value)}
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-foreground">Valor Unidade (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={editUnitPrice}
                                    onChange={(e) => setEditUnitPrice(e.target.value)}
                                    placeholder="0.00"
                                    className="bg-background border-input text-foreground"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Categoria</Label>
                            <Select value={editCategory} onValueChange={setEditCategory}>
                                <SelectTrigger className="bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Data de Vencimento</Label>
                            <Input
                                type="date"
                                value={editExpiresAt}
                                onChange={(e) => setEditExpiresAt(e.target.value)}
                                className="bg-background border-input text-foreground"
                            />
                        </div>
                        {/* Custom Fields in Edit */}
                        {customColumns.length > 0 && editProduct && (
                            <div className="space-y-2">
                                <Label className="text-foreground">Campos Personalizados</Label>
                                {customColumns.map(col => (
                                    <div key={col.id} className="flex items-center gap-2">
                                        <span className="text-sm text-muted-foreground w-24">{col.name}:</span>
                                        <Input
                                            value={editProduct.customFields?.[col.id] || ""}
                                            onChange={(e) => {
                                                const newCustomFields = { ...editProduct.customFields, [col.id]: e.target.value }
                                                setEditProduct({ ...editProduct, customFields: newCustomFields })
                                            }}
                                            className="bg-background border-input text-foreground flex-1"
                                            placeholder="-"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditProduct(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit}>
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog >
        </div >
    )
}
