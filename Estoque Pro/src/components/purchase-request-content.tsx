"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
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
    Plus,
    ShoppingCart,
    AlertTriangle,
    Clock,
    Send,
    Mail,
    MessageCircle,
    Trash2,
    Check,
    Package,
    Copy,
    CheckCircle,
    Edit,
    User,
    Calendar,
    FileText,
    Download
} from "lucide-react"
import { useStock, isLowStock, isOutOfStock, isExpiringSoon } from "@/context/stock-context"

interface PurchaseItem {
    productId: string
    name: string
    category: string
    unit: string
    currentStock: number
    minStock: number
    suggestedQty: number
    requestedQty: number
    reason: "low" | "expiring" | "out" | "manual"
}

interface PurchaseRequest {
    id: string
    items: PurchaseItem[]
    supplier: string
    notes: string
    status: "draft" | "sent" | "received"
    createdAt: string
    sentAt?: string
}

export function PurchaseRequestContent() {
    const { products, categories, settings } = useStock()
    const [requests, setRequests] = React.useState<PurchaseRequest[]>([])
    const [selectedItems, setSelectedItems] = React.useState<Map<string, PurchaseItem>>(new Map())
    const [isSendOpen, setIsSendOpen] = React.useState(false)
    const [activeTab, setActiveTab] = React.useState("create")
    const [editingRequest, setEditingRequest] = React.useState<PurchaseRequest | null>(null)

    // Send form
    const [sendData, setSendData] = React.useState({
        supplier: "",
        notes: "",
        whatsappNumber: "",
        emails: ""
    })
    const [isLoading, setIsLoading] = React.useState(true)

    // Carregar requisições da API
    React.useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await fetch("/api/purchase-requests")
                if (response.ok) {
                    const data = await response.json()
                    setRequests(data.requests || [])
                }
            } catch (error) {
                console.error("Erro ao carregar requisições:", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchRequests()
    }, [])

    // Get products that need restocking
    const outOfStockProducts = products.filter(isOutOfStock)
    const lowStockProducts = products.filter(p => isLowStock(p, settings.lowStockThreshold) && !isOutOfStock(p))
    const expiringProducts = products.filter(p => isExpiringSoon(p, settings.expiryWarningDays))

    const getCategoryName = (categoryId: string) => {
        return categories.find(c => c.id === categoryId)?.name || "Outros"
    }

    const toggleItem = (product: typeof products[0], reason: PurchaseItem["reason"]) => {
        const newMap = new Map(selectedItems)
        if (newMap.has(product.id)) {
            newMap.delete(product.id)
        } else {
            const suggestedQty = Math.max(product.minStock - product.currentStock, 0) + product.minStock * 0.2
            newMap.set(product.id, {
                productId: product.id,
                name: product.name,
                category: getCategoryName(product.categoryId),
                unit: product.unit,
                currentStock: product.currentStock,
                minStock: product.minStock,
                suggestedQty: Math.ceil(suggestedQty),
                requestedQty: Math.ceil(suggestedQty),
                reason
            })
        }
        setSelectedItems(newMap)
    }

    const selectAllOutOfStock = () => {
        const newMap = new Map(selectedItems)
        outOfStockProducts.forEach(p => {
            // Out of Stock overrides everything (Highest Priority)
            const suggestedQty = p.minStock + p.minStock * 0.2
            newMap.set(p.id, {
                productId: p.id,
                name: p.name,
                category: getCategoryName(p.categoryId),
                unit: p.unit,
                currentStock: p.currentStock,
                minStock: p.minStock,
                suggestedQty: Math.ceil(suggestedQty),
                requestedQty: Math.ceil(suggestedQty),
                reason: "out"
            })
        })
        setSelectedItems(newMap)
    }

    const selectAllLowStock = () => {
        const newMap = new Map(selectedItems)
        lowStockProducts.forEach(p => {
            // User requested "no preference" / equal priority
            // So clicking this button should simply apply this status to these items
            // overriding whatever was there before.
            const suggestedQty = Math.max(p.minStock - p.currentStock, 0) + p.minStock * 0.2
            newMap.set(p.id, {
                productId: p.id,
                name: p.name,
                category: getCategoryName(p.categoryId),
                unit: p.unit,
                currentStock: p.currentStock,
                minStock: p.minStock,
                suggestedQty: Math.ceil(suggestedQty),
                requestedQty: Math.ceil(suggestedQty),
                reason: "low"
            })
        })
        setSelectedItems(newMap)
    }

    const selectAllExpiring = () => {
        const newMap = new Map(selectedItems)
        expiringProducts.forEach(p => {
            // Always apply expiring status if clicked
            const suggestedQty = p.minStock
            newMap.set(p.id, {
                productId: p.id,
                name: p.name,
                category: getCategoryName(p.categoryId),
                unit: p.unit,
                currentStock: p.currentStock,
                minStock: p.minStock,
                suggestedQty: Math.ceil(suggestedQty),
                requestedQty: Math.ceil(suggestedQty),
                reason: "expiring"
            })
        })
        setSelectedItems(newMap)
    }

    // Select all products
    const selectAllProducts = () => {
        if (selectedItems.size === products.length) {
            // If all selected, deselect all
            setSelectedItems(new Map())
        } else {
            // Select all
            const newMap = new Map<string, PurchaseItem>()
            products.forEach(p => {
                let reason: PurchaseItem["reason"] = "manual"
                if (isOutOfStock(p)) reason = "out"
                else if (isExpiringSoon(p, settings.expiryWarningDays)) reason = "expiring"
                else if (isLowStock(p, settings.lowStockThreshold)) reason = "low"

                const suggestedQty = Math.max(p.minStock - p.currentStock, 0) + p.minStock * 0.2
                newMap.set(p.id, {
                    productId: p.id,
                    name: p.name,
                    category: getCategoryName(p.categoryId),
                    unit: p.unit,
                    currentStock: p.currentStock,
                    minStock: p.minStock,
                    suggestedQty: Math.ceil(suggestedQty),
                    requestedQty: Math.ceil(suggestedQty),
                    reason
                })
            })
            setSelectedItems(newMap)
        }
    }

    const updateRequestedQty = (productId: string, qty: number) => {
        const newMap = new Map(selectedItems)
        const item = newMap.get(productId)
        if (item) {
            newMap.set(productId, { ...item, requestedQty: qty })
        }
        setSelectedItems(newMap)
    }

    const removeItem = (productId: string) => {
        const newMap = new Map(selectedItems)
        newMap.delete(productId)
        setSelectedItems(newMap)
    }

    // Group items by category for WhatsApp format
    const groupItemsByCategory = (items: PurchaseItem[]) => {
        const grouped: Record<string, PurchaseItem[]> = {}
        items.forEach(item => {
            const cat = item.category || "Outros"
            if (!grouped[cat]) grouped[cat] = []
            grouped[cat].push(item)
        })
        return grouped
    }

    // Generate GestorChef-style WhatsApp message
    const generateRequestText = (forWhatsApp = false) => {
        const items = Array.from(selectedItems.values())
        const grouped = groupItemsByCategory(items)
        const date = new Date().toLocaleDateString("pt-BR")
        const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

        let text = ""

        if (forWhatsApp) {
            // Simple text format without emojis to ensure proper encoding
            text += "🛒 *LISTA DE COMPRAS*\n\n"
            text += "👤 Solicitado por: Admin User\n"
            text += "📅 Data: " + date + ", " + time + "\n\n"

            // Group by category - using simpler format
            Object.entries(grouped).forEach(([category, catItems]) => {
                text += "📦 *" + category.toUpperCase() + "*\n"
                catItems.forEach(item => {
                    text += "- " + item.name + " - " + item.requestedQty + " " + item.unit + "\n"
                })
                text += "\n"
            })

            if (sendData.notes) {
                text += "📝 *OBSERVACOES:*\n" + sendData.notes + "\n"
            }
        } else {
            text += "🛒 LISTA DE COMPRAS\n\n"
            text += `👤 Solicitado por: Admin User\n`
            text += `📅 Data: ${date}, ${time}\n`
            if (sendData.supplier) text += `🏭 Fornecedor: ${sendData.supplier}\n`
            text += "\n---\n\n"

            Object.entries(grouped).forEach(([category, catItems]) => {
                text += `${category.toUpperCase()}\n`
                catItems.forEach(item => {
                    text += `• ${item.name} - ${item.requestedQty} ${item.unit}\n`
                })
                text += "\n"
            })

            if (sendData.notes) {
                text += `OBSERVAÇÕES:\n${sendData.notes}\n`
            }
        }

        return text
    }

    const sendViaWhatsApp = () => {
        const text = generateRequestText(true)
        const number = sendData.whatsappNumber.replace(/\D/g, "")
        const url = `https://api.whatsapp.com/send?phone=${number}&text=${encodeURIComponent(text)}`
        window.open(url, "_blank")
        saveRequest("sent")
    }

    const sendViaGmail = () => {
        const date = new Date().toLocaleDateString("pt-BR")
        const subject = encodeURIComponent(`Lista de Compras - ${date}`)
        const body = encodeURIComponent(generateRequestText(false))
        const emails = sendData.emails.split(",").map(e => e.trim()).join(",")

        const url = `https://mail.google.com/mail/?view=cm&to=${emails}&su=${subject}&body=${body}`
        window.open(url, "_blank")

        saveRequest("sent")
    }

    const copyToClipboard = () => {
        const text = generateRequestText(false)
        navigator.clipboard.writeText(text)
        alert("Copiado para a área de transferência!")
    }

    // Export to PDF
    const exportToPDF = async () => {
        const { jsPDF } = await import('jspdf')
        const doc = new jsPDF()
        const items = Array.from(selectedItems.values())
        const grouped = groupItemsByCategory(items)
        const date = new Date().toLocaleDateString("pt-BR")
        const time = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })

        // Header
        doc.setFontSize(20)
        doc.setFont("helvetica", "bold")
        doc.text("LISTA DE COMPRAS", 105, 20, { align: "center" })

        // Info
        doc.setFontSize(11)
        doc.setFont("helvetica", "normal")
        doc.text(`Data: ${date}, ${time}`, 20, 35)
        doc.text(`Solicitado por: Admin User`, 20, 42)
        if (sendData.supplier) {
            doc.text(`Fornecedor: ${sendData.supplier}`, 20, 49)
        }

        let y = 60

        // Items by category
        Object.entries(grouped).forEach(([category, catItems]) => {
            doc.setFillColor(34, 197, 94)
            doc.rect(20, y, 170, 8, "F")
            doc.setTextColor(255, 255, 255)
            doc.setFont("helvetica", "bold")
            doc.text(category.toUpperCase(), 25, y + 6)
            doc.setTextColor(0, 0, 0)
            y += 12

            doc.setFont("helvetica", "normal")
            catItems.forEach((item, i) => {
                if (i % 2 === 0) {
                    doc.setFillColor(245, 245, 245)
                    doc.rect(20, y - 4, 170, 8, "F")
                }
                doc.text(`• ${item.name}`, 25, y + 2)
                doc.text(`${item.requestedQty} ${item.unit}`, 150, y + 2)
                y += 8
            })
            y += 5
        })

        // Notes
        if (sendData.notes) {
            y += 5
            doc.setFont("helvetica", "bold")
            doc.text("OBSERVAÇÕES:", 20, y)
            doc.setFont("helvetica", "normal")
            y += 7
            doc.text(sendData.notes, 20, y)
        }

        // Footer
        doc.setTextColor(128, 128, 128)
        doc.setFontSize(8)
        doc.text(`Gerado em ${date}`, 105, 285, { align: "center" })

        doc.save(`lista-compras-${date.replace(/\//g, '-')}.pdf`)
    }

    const saveRequest = async (status: PurchaseRequest["status"]) => {
        const items = Array.from(selectedItems.values())

        if (items.length === 0) {
            alert("Selecione pelo menos um produto para salvar.")
            return
        }

        const requestData = {
            id: editingRequest?.id,
            items,
            supplier: sendData.supplier,
            notes: sendData.notes,
            status
        }

        try {
            const method = editingRequest ? "PUT" : "POST"
            const response = await fetch("/api/purchase-requests", {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(requestData)
            })

            if (response.ok) {
                // Show success message
                const message = status === "draft" ? "Rascunho salvo com sucesso!" : "Requisição enviada com sucesso!"
                alert(message)

                // Reload list
                const listResponse = await fetch("/api/purchase-requests")
                if (listResponse.ok) {
                    const data = await listResponse.json()
                    setRequests(data.requests || [])
                }

                // Close dialogs and clear form
                setIsSendOpen(false)
                setIsRequestDialogOpen(false)
                setSelectedItems(new Map())
                setSendData({ supplier: "", notes: "", whatsappNumber: "", emails: "" })
                setEditingRequest(null)
            } else {
                const error = await response.json()
                alert("Erro ao salvar requisição: " + (error.error || "Erro desconhecido"))
            }
        } catch (error) {
            console.error("Erro ao salvar:", error)
            alert("Erro ao salvar requisição. Verifique sua conexão.")
        }
    }

    // State for the main dialog
    const [isRequestDialogOpen, setIsRequestDialogOpen] = React.useState(false)

    // Ajustar loadRequestForEdit para abrir o dialog
    const loadRequestForEdit = (req: PurchaseRequest) => {
        const newMap = new Map<string, PurchaseItem>()
        req.items.forEach(item => {
            if (products.some(p => p.id === item.productId)) {
                newMap.set(item.productId, item)
            }
        })

        if (newMap.size === 0 && req.items.length > 0) {
            alert("Os produtos desta requisição não existem mais no estoque.")
            return
        }

        setSelectedItems(newMap)
        setSendData({
            supplier: req.supplier || "",
            notes: req.notes || "",
            whatsappNumber: "",
            emails: ""
        })
        setEditingRequest(req)
        setIsRequestDialogOpen(true)
    }

    const openNewRequest = () => {
        setEditingRequest(null)
        setSelectedItems(new Map())
        setSendData({ supplier: "", notes: "", whatsappNumber: "", emails: "" })
        setIsRequestDialogOpen(true)
    }

    const getReasonBadge = (reason: PurchaseItem["reason"]) => {
        switch (reason) {
            case "out": return <Badge className="bg-red-600">Sem Estoque</Badge>
            case "low": return <Badge className="bg-yellow-600">Baixo</Badge>
            case "expiring": return <Badge className="bg-cyan-600">Vencendo</Badge>
            default: return <Badge className="bg-gray-600">Manual</Badge>
        }
    }

    const selectedCount = selectedItems.size

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Requisição de Compra</h1>
                    <p className="text-muted-foreground mt-1">Crie listas de compra e envie para fornecedores.</p>
                </div>
                <Button onClick={openNewRequest} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Requisição
                </Button>
            </div>

            {/* Dialog de Criação/Edição (Substitui a Tab "Create") */}
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl max-h-[90vh] overflow-y-auto bg-card border-border flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{editingRequest ? "Editar Requisição" : "Nova Requisição"}</DialogTitle>
                        <DialogDescription>Selecione os produtos para compor a lista de compras.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4 flex-1">
                        {/* Quick Select Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-red-900/10 border-red-800/30 cursor-pointer hover:bg-red-900/20 transition" onClick={selectAllOutOfStock}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-red-900/30 flex items-center justify-center">
                                            <Package className="w-5 h-5 text-red-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Sem Estoque</p>
                                            <p className="text-sm text-muted-foreground">{outOfStockProducts.length} itens</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-400 hover:bg-red-900/20">
                                        Adicionar
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-yellow-900/10 border-yellow-800/30 cursor-pointer hover:bg-yellow-900/20 transition" onClick={selectAllLowStock}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-yellow-900/30 flex items-center justify-center">
                                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Estoque Baixo</p>
                                            <p className="text-sm text-muted-foreground">{lowStockProducts.length} itens</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-yellow-500 hover:text-yellow-400 hover:bg-yellow-900/20">
                                        Adicionar
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="bg-cyan-900/10 border-cyan-800/30 cursor-pointer hover:bg-cyan-900/20 transition" onClick={selectAllExpiring}>
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-cyan-900/30 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-cyan-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">Vencendo</p>
                                            <p className="text-sm text-muted-foreground">{expiringProducts.length} itens</p>
                                        </div>
                                    </div>
                                    <Button size="sm" variant="ghost" className="text-cyan-500 hover:text-cyan-400 hover:bg-cyan-900/20">
                                        Adicionar
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Product Selection List */}
                            <Card className="bg-card border-border flex flex-col h-[500px]">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-base text-foreground">Catálogo de Produtos</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-0">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-muted z-10">
                                            <TableRow className="border-border hover:bg-transparent">
                                                <TableHead className="w-[40px] pl-4">
                                                    <Checkbox
                                                        checked={selectedItems.size === products.length && products.length > 0}
                                                        onCheckedChange={() => selectAllProducts()}
                                                    />
                                                </TableHead>
                                                <TableHead>Produto</TableHead>
                                                <TableHead className="text-center">Status</TableHead>
                                                <TableHead className="text-center">Atual</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.map(product => {
                                                const isSelected = selectedItems.has(product.id)
                                                let reason: PurchaseItem["reason"] = "manual"
                                                if (isOutOfStock(product)) reason = "out"
                                                else if (isExpiringSoon(product, settings.expiryWarningDays)) reason = "expiring"
                                                else if (isLowStock(product, settings.lowStockThreshold)) reason = "low"

                                                return (
                                                    <TableRow
                                                        key={product.id}
                                                        className={`border-border cursor-pointer ${isSelected ? "bg-primary/10" : "hover:bg-muted/50"}`}
                                                        onClick={() => toggleItem(product, reason)}
                                                    >
                                                        <TableCell className="pl-4">
                                                            <Checkbox
                                                                checked={isSelected}
                                                                onCheckedChange={() => toggleItem(product, reason)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium text-foreground">{product.name}</div>
                                                            <div className="text-xs text-muted-foreground">{getCategoryName(product.categoryId)}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center px-1">
                                                            {reason !== "manual" && getReasonBadge(reason)}
                                                        </TableCell>
                                                        <TableCell className="text-center text-muted-foreground">
                                                            {product.currentStock} {product.unit}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>

                            {/* Selected Items List */}
                            <Card className="bg-card border-border flex flex-col h-[500px]">
                                <CardHeader className="py-3 flex flex-row items-center justify-between">
                                    <CardTitle className="text-base text-foreground">Itens Selecionados ({selectedCount})</CardTitle>
                                    <Button
                                        onClick={() => setIsSendOpen(true)}
                                        disabled={selectedCount === 0}
                                        size="sm"
                                        className="gap-2 bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Send className="w-3 h-3" />
                                        Processar
                                    </Button>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-auto p-0">
                                    {selectedCount === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
                                            <ShoppingCart className="w-8 h-8 mb-2 opacity-50" />
                                            <p>Selecione produtos ao lado para montar sua lista.</p>
                                        </div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="sticky top-0 bg-muted z-10">
                                                <TableRow className="border-border hover:bg-transparent">
                                                    <TableHead className="pl-4">Produto</TableHead>
                                                    <TableHead className="text-center">Qtd</TableHead>
                                                    <TableHead className="w-[40px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {Array.from(selectedItems.values()).map(item => (
                                                    <TableRow key={item.productId} className="border-border hover:bg-muted/30">
                                                        <TableCell className="pl-4">
                                                            <div className="font-medium text-foreground">{item.name}</div>
                                                            <div className="text-xs text-muted-foreground">{item.category}</div>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Input
                                                                    type="number"
                                                                    value={item.requestedQty}
                                                                    onChange={(e) => updateRequestedQty(item.productId, parseFloat(e.target.value) || 0)}
                                                                    className="w-16 h-7 text-center bg-background border-input text-foreground px-1"
                                                                />
                                                                <span className="text-xs text-muted-foreground w-6 text-left">{item.unit}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    removeItem(item.productId)
                                                                }}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* History List */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground">Histórico de Requisições</h2>
                {requests.length === 0 ? (
                    <Card className="bg-card border-border">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <ShoppingCart className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">Nenhuma requisição enviada ainda.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {requests.map(req => (
                            <Card key={req.id} className="bg-card border-border hover:border-border/80 transition">
                                <CardHeader className="pb-2">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-foreground text-base flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                Requisição de {new Date(req.createdAt).toLocaleDateString("pt-BR")}
                                            </CardTitle>
                                            <CardDescription className="flex items-center gap-2 mt-1 text-xs">
                                                <span>{req.items.length} itens</span>
                                                {req.supplier && <span>• {req.supplier}</span>}
                                                <span className="text-muted-foreground text-[10px]">• {new Date(req.createdAt).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</span>
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={req.status === "sent" ? "bg-green-600/80 hover:bg-green-600" : "bg-gray-500/80 hover:bg-gray-500"}>
                                                {req.status === "sent" ? "Enviada" : "Rascunho"}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 gap-1"
                                                onClick={() => loadRequestForEdit(req)}
                                            >
                                                <Edit className="w-3 h-3" />
                                                Abrir
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pt-2 pb-3">
                                    <div className="text-sm text-muted-foreground line-clamp-2">
                                        {req.items.slice(0, 5).map(i => i.name).join(", ")}
                                        {req.items.length > 5 && "..."}
                                    </div>
                                    {req.notes && (
                                        <div className="mt-2 text-xs text-muted-foreground italic">
                                            "{req.notes}"
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Send Dialog (Nested) */}
            <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
                <DialogContent className="bg-card border-border max-w-lg z-[60]">
                    <DialogHeader>
                        <DialogTitle className="text-foreground flex items-center gap-2">
                            <Send className="w-5 h-5" />
                            Finalizar e Enviar
                        </DialogTitle>
                        <DialogDescription>
                            Escolha como deseja enviar esta lista.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">Fornecedor (Opcional)</Label>
                            <Input
                                value={sendData.supplier}
                                onChange={(e) => setSendData({ ...sendData, supplier: e.target.value })}
                                placeholder="Nome do fornecedor"
                                className="bg-background border-input text-foreground"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">Observações</Label>
                            <Textarea
                                value={sendData.notes}
                                onChange={(e) => setSendData({ ...sendData, notes: e.target.value })}
                                placeholder="Ex: Entrega urgente"
                                className="bg-background border-input text-foreground h-20"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-foreground">Número do WhatsApp</Label>
                            <Input
                                value={sendData.whatsappNumber}
                                onChange={(e) => setSendData({ ...sendData, whatsappNumber: e.target.value })}
                                placeholder="Ex: 5511999999999"
                                className="bg-background border-input text-foreground"
                            />
                            <p className="text-xs text-muted-foreground">Digite o número com código do país (55) + DDD + número</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <Button onClick={sendViaWhatsApp} className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                                <MessageCircle className="w-4 h-4 mr-2" />
                                WhatsApp
                            </Button>
                            <Button onClick={sendViaGmail} className="w-full bg-red-600 hover:bg-red-700 text-white">
                                <Mail className="w-4 h-4 mr-2" />
                                Gmail
                            </Button>
                            <Button onClick={exportToPDF} variant="outline" className="w-full">
                                <Download className="w-4 h-4 mr-2" />
                                PDF
                            </Button>
                            <Button onClick={copyToClipboard} variant="outline" className="w-full">
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar
                            </Button>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:justify-between">
                        <Button variant="ghost" onClick={() => setIsSendOpen(false)}>
                            Voltar
                        </Button>
                        <Button onClick={() => saveRequest("draft")} variant="secondary">
                            Salvar como Rascunho
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
