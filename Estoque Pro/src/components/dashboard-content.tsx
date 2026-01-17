"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, AlertTriangle, XCircle, Clock, DollarSign, Loader2, CreditCard } from "lucide-react"
import { useStock, isLowStock, isOutOfStock, isExpiringSoon } from "@/context/stock-context"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useEffect, useState } from "react"

interface DashboardContentProps {
    userName?: string
}

export function DashboardContent({ userName = "Admin User" }: DashboardContentProps) {
    const { categories, products, settings, subscriptionStatus } = useStock()
    const searchParams = useSearchParams()
    const plan = searchParams.get("plan")
    const router = useRouter()
    const [isProcessingPlan, setIsProcessingPlan] = useState(false)

    useEffect(() => {
        if (plan && !isProcessingPlan) {
            const initiateCheckout = async () => {
                setIsProcessingPlan(true)
                try {
                    console.log("[DASHBOARD] Initiating checkout for plan:", plan)
                    const response = await fetch("/api/stripe/checkout", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ priceId: plan })
                    })

                    const data = await response.json()
                    if (data.url) {
                        console.log("[DASHBOARD] Redirecting to Checkout:", data.url)
                        window.location.href = data.url
                    } else {
                        console.error("[DASHBOARD] Checkout failed:", data.error)
                        // Allow user to continue to dashboard if checkout fails, but maybe log/alert
                        setIsProcessingPlan(false)
                        // Optional: remove query param to prevent loop/retry
                        const newUrl = window.location.pathname
                        window.history.replaceState({}, '', newUrl)
                    }
                } catch (err) {
                    console.error("[DASHBOARD] Checkout error:", err)
                    setIsProcessingPlan(false)
                }
            }
            initiateCheckout()
        }
    }, [plan, isProcessingPlan])

    const today = new Date()

    if (isProcessingPlan) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="p-4 rounded-full bg-orange-500/10 mb-2">
                    <Loader2 className="w-10 h-10 text-orange-500 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    Processando sua assinatura...
                </h2>
                <p className="text-slate-500 max-w-md">
                    Estamos preparando seu checkout seguro. Você será redirecionado em instantes para finalizar a contratação do plano <strong>{plan}</strong>.
                </p>
            </div>
        )
    }

    // Calculate stats using configurable settings
    const totalItems = products.length
    const outOfStockProducts = products.filter(isOutOfStock)
    const lowStockProducts = products.filter(p => isLowStock(p, settings.lowStockThreshold))
    const expiringProducts = products.filter(p => isExpiringSoon(p, settings.expiryWarningDays))

    // Calculate total stock value
    // Calculate total stock value
    const totalStockValue = products.reduce((sum, p) => {
        // If product has variants, calculate sum of variant values
        if (p.hasVariants && p.variants && p.variants.length > 0) {
            const variantsValue = p.variants.reduce((vSum: number, v: any) => {
                const price = v.unitPrice || p.unitPrice || 0
                return vSum + (price * v.currentStock)
            }, 0)
            return sum + variantsValue
        }

        // Standard product
        if (p.unitPrice && p.currentStock > 0) {
            return sum + (p.unitPrice * p.currentStock)
        }
        return sum
    }, 0)

    // Get category stats with specific items
    const categoryStats = categories.map(cat => {
        const catProducts = products.filter(p => p.categoryId === cat.id)
        const lowItems = catProducts.filter(p => isLowStock(p, settings.lowStockThreshold))
        const outItems = catProducts.filter(isOutOfStock)
        const expiringItems = catProducts.filter(p => isExpiringSoon(p, settings.expiryWarningDays))
        return {
            ...cat,
            total: catProducts.length,
            lowStockItems: lowItems,
            outOfStockItems: outItems,
            expiringItems: expiringItems
        }
    })

    const getGreeting = () => {
        const hour = today.getHours()
        if (hour < 12) return "Bom dia"
        if (hour < 18) return "Boa tarde"
        return "Boa noite"
    }

    const displayName = settings.ownerName || userName

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value)
    }

    return (
        <div className="space-y-6 lg:space-y-8">
            {/* Payment Failure Banner */}
            {(subscriptionStatus === 'past_due' || subscriptionStatus === 'unpaid') && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-red-500/20 rounded-full">
                            <CreditCard className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-red-400 font-semibold">⚠️ Problema com seu pagamento</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                Sua última cobrança falhou. Atualize seu método de pagamento para continuar usando todas as funcionalidades.
                            </p>
                        </div>
                    </div>
                    <Link href="/settings?tab=billing">
                        <Button variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 whitespace-nowrap">
                            Atualizar pagamento
                        </Button>
                    </Link>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                    {getGreeting()}, {displayName}!
                </h1>
                <p className="text-muted-foreground mt-1">Aqui está um resumo do seu estoque atual</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                <Card className="bg-card border-border">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs lg:text-sm text-muted-foreground">Total de Itens</p>
                                <p className="text-2xl lg:text-3xl font-bold text-foreground mt-1">{totalItems}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <Package className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs lg:text-sm text-muted-foreground">Sem Estoque</p>
                                <p className="text-2xl lg:text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{outOfStockProducts.length}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <XCircle className="w-5 h-5 lg:w-6 lg:h-6 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs lg:text-sm text-muted-foreground">Estoque Baixo</p>
                                <p className="text-2xl lg:text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{lowStockProducts.length}</p>
                                <p className="text-[10px] lg:text-xs text-muted-foreground">≤{Math.round(settings.lowStockThreshold * 100)}% do mínimo</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5 lg:w-6 lg:h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs lg:text-sm text-muted-foreground">Vencendo</p>
                                <p className="text-2xl lg:text-3xl font-bold text-cyan-600 dark:text-cyan-400 mt-1">{expiringProducts.length}</p>
                                <p className="text-[10px] lg:text-xs text-muted-foreground">≤{settings.expiryWarningDays} dias</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <Clock className="w-5 h-5 lg:w-6 lg:h-6 text-cyan-600 dark:text-cyan-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs lg:text-sm text-muted-foreground">Valor Total</p>
                                <p className="text-lg lg:text-xl font-bold text-green-600 dark:text-green-400 mt-1">{formatCurrency(totalStockValue)}</p>
                            </div>
                            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <DollarSign className="w-5 h-5 lg:w-6 lg:h-6 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Alert Cards with specific items */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Low Stock */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                            <CardTitle className="text-lg text-foreground">Estoque Baixo</CardTitle>
                        </div>
                        <CardDescription>≤{Math.round(settings.lowStockThreshold * 100)}% do estoque mínimo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {lowStockProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum item com estoque baixo</p>
                        ) : (
                            lowStockProducts.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-yellow-600 dark:text-yellow-400">{product.currentStock} {product.unit}</p>
                                        <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Out of Stock */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <CardTitle className="text-lg text-foreground">Sem Estoque</CardTitle>
                        </div>
                        <CardDescription>Itens zerados</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {outOfStockProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Todos os itens têm estoque</p>
                        ) : (
                            outOfStockProducts.map(product => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                                    <div>
                                        <p className="font-medium text-sm text-foreground">{product.name}</p>
                                        <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600 dark:text-red-400">0 {product.unit}</p>
                                        <p className="text-xs text-muted-foreground">Mín: {product.minStock}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Expiring */}
                <Card className="bg-card border-border">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            <CardTitle className="text-lg text-foreground">Próximo ao Vencimento</CardTitle>
                        </div>
                        <CardDescription>Vence em até {settings.expiryWarningDays} dias</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 max-h-60 overflow-y-auto">
                        {expiringProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum item próximo do vencimento</p>
                        ) : (
                            expiringProducts.map(product => {
                                const expDate = new Date(product.expiresAt!)
                                const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                return (
                                    <div key={product.id} className="flex items-center justify-between p-3 bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800/30 rounded-lg">
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{product.name}</p>
                                            <p className="text-xs text-muted-foreground">{product.categoryName}</p>
                                        </div>
                                        <Badge className="bg-cyan-600 text-white text-xs">
                                            {daysLeft <= 0 ? "Vencido" : `${daysLeft} dia${daysLeft > 1 ? "s" : ""}`}
                                        </Badge>
                                    </div>
                                )
                            })
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Category Overview */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-foreground">Visão geral das categorias cadastradas</CardTitle>
                    <CardDescription>Detalhes específicos por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categoryStats.map(cat => (
                            <div key={cat.id} className="p-4 bg-muted border border-border rounded-lg">
                                <h3 className="font-semibold text-lg text-foreground">{cat.name}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{cat.total} {cat.total === 1 ? "item" : "itens"}</p>

                                {cat.outOfStockItems.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Sem estoque:</p>
                                        {cat.outOfStockItems.map(item => (
                                            <p key={item.id} className="text-xs text-muted-foreground pl-2">• {item.name}</p>
                                        ))}
                                    </div>
                                )}

                                {cat.lowStockItems.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Estoque baixo:</p>
                                        {cat.lowStockItems.map(item => (
                                            <p key={item.id} className="text-xs text-muted-foreground pl-2">• {item.name} ({item.currentStock} {item.unit})</p>
                                        ))}
                                    </div>
                                )}

                                {cat.expiringItems.length > 0 && (
                                    <div className="mt-3 space-y-1">
                                        <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">Próximo ao vencimento:</p>
                                        {cat.expiringItems.map(item => {
                                            const expDate = new Date(item.expiresAt!)
                                            const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                                            return (
                                                <p key={item.id} className="text-xs text-muted-foreground pl-2">• {item.name} ({daysLeft}d)</p>
                                            )
                                        })}
                                    </div>
                                )}

                                {cat.outOfStockItems.length === 0 && cat.lowStockItems.length === 0 && cat.expiringItems.length === 0 && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">✓ Todos os itens OK</p>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
