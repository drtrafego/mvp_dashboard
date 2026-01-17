"use client"
// Revert verification

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useTheme } from "next-themes"
import { useStock, type User } from "@/context/stock-context"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { Trash2, Building2, Sliders, Users, CreditCard, Sparkles, Lock, Eye, EyeOff } from "lucide-react"
import { useStackApp } from "@stackframe/stack"
import { BusinessTypeSettings } from "@/components/business-type-settings"

interface SettingsContentProps {
    currentUserEmail?: string
    isAdmin?: boolean
}

export function SettingsContent({ currentUserEmail, isAdmin = true }: SettingsContentProps) {
    const { settings, updateSettings, users, addUser, updateUser, deleteUser, subscriptionStatus, subscriptionExpiresAt } = useStock()
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Get active tab from URL or default to 'company'
    const activeTab = searchParams.get('tab') || 'company'

    const [mounted, setMounted] = React.useState(false)

    const [companyName, setCompanyName] = React.useState(settings.companyName)
    const [companyEmail, setCompanyEmail] = React.useState(settings.companyEmail || "")
    const [ownerName, setOwnerName] = React.useState(settings.ownerName)
    const [expiryDays, setExpiryDays] = React.useState(String(settings.expiryWarningDays))
    const [lowStockPercent, setLowStockPercent] = React.useState(String(Math.round(settings.lowStockThreshold * 100)))
    const [isSaving, setIsSaving] = React.useState(false)
    const [saveMessage, setSaveMessage] = React.useState("")

    React.useEffect(() => {
        setMounted(true)
    }, [])

    const handleTabChange = (value: string) => {
        // Create new URLSearchParams to avoid losing other params if any existed (though usually specific to page)
        // Actually for settings typically just ?tab=... works.
        const params = new URLSearchParams(searchParams)
        params.set('tab', value)
        router.push(`${pathname}?${params.toString()}`)
    }

    const handleSaveCompany = async () => {
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        updateSettings({ companyName, companyEmail, ownerName })
        setSaveMessage("Configurações salvas com sucesso!")
        setTimeout(() => setSaveMessage(""), 3000)
        setIsSaving(false)
    }

    const handleSaveAlerts = async () => {
        setIsSaving(true)
        await new Promise(resolve => setTimeout(resolve, 500))
        updateSettings({
            expiryWarningDays: parseInt(expiryDays) || 2,
            lowStockThreshold: (parseInt(lowStockPercent) || 10) / 100
        })
        setSaveMessage("Configurações de alertas salvas!")
        setTimeout(() => setSaveMessage(""), 3000)
        setIsSaving(false)
    }

    const handleUserCreated = async (user: User) => {
        await addUser(user)
    }

    const handleDeleteUser = (id: string, email: string) => {
        if (email === currentUserEmail) {
            alert("Você não pode excluir seu próprio usuário.")
            return
        }
        if (confirm("Tem certeza que deseja excluir este usuário?")) {
            deleteUser(id)
        }
    }

    return (
        <SettingsContext.Provider value={{ currentUserEmail }}>
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
                    <p className="text-muted-foreground mt-1">Gerencie a empresa, alertas e usuários</p>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="bg-muted">
                        <TabsTrigger value="company" className="gap-2">
                            <Building2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Empresa</span>
                        </TabsTrigger>
                        <TabsTrigger value="alerts" className="gap-2">
                            <Sliders className="w-4 h-4" />
                            <span className="hidden sm:inline">Alertas</span>
                        </TabsTrigger>
                        {isAdmin && (
                            <TabsTrigger value="users" className="gap-2">
                                <Users className="w-4 h-4" />
                                <span className="hidden sm:inline">Usuários</span>
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="account" className="gap-2">
                            <Lock className="w-4 h-4" />
                            <span className="hidden sm:inline">Minha Conta</span>
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="gap-2">
                            <CreditCard className="w-4 h-4" />
                            <span className="hidden sm:inline">Assinatura</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* Company Tab */}
                    <TabsContent value="company" className="mt-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Informações da Empresa</CardTitle>
                                <CardDescription>
                                    Configure o nome da empresa e do responsável
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-foreground">Nome da Empresa</Label>
                                    <Input
                                        value={companyName}
                                        onChange={(e) => setCompanyName(e.target.value)}
                                        placeholder="Nome da sua empresa"
                                        className="bg-background border-input text-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Este nome aparece no menu lateral
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground">Email da Empresa</Label>
                                    <Input
                                        value={companyEmail}
                                        onChange={(e) => setCompanyEmail(e.target.value)}
                                        placeholder="contato@empresa.com"
                                        type="email"
                                        className="bg-background border-input text-foreground"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground">Nome do Responsável</Label>
                                    <Input
                                        value={ownerName}
                                        onChange={(e) => setOwnerName(e.target.value)}
                                        placeholder="Seu nome"
                                        className="bg-background border-input text-foreground"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Este nome aparece na saudação do Dashboard
                                    </p>
                                </div>

                                {mounted && (
                                    <div className="space-y-2">
                                        <Label className="text-foreground">Tema</Label>
                                        <Select value={theme} onValueChange={setTheme}>
                                            <SelectTrigger className="w-[200px] bg-background border-input text-foreground">
                                                <SelectValue placeholder="Selecione o tema" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border">
                                                <SelectItem value="system">Automático (Sistema)</SelectItem>
                                                <SelectItem value="light">Claro</SelectItem>
                                                <SelectItem value="dark">Escuro</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <Button onClick={handleSaveCompany} disabled={isSaving}>
                                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                                    </Button>
                                    {saveMessage && (
                                        <span className="text-sm text-green-600 dark:text-green-400">{saveMessage}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Security Card - Password Change */}
                        <Card className="bg-card border-border mt-6">
                            <CardHeader>
                                <CardTitle className="text-foreground">Segurança</CardTitle>
                                <CardDescription>
                                    Altere sua senha de acesso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <PasswordChangeForm />
                            </CardContent>
                        </Card>

                        {/* Business Type Settings */}
                        <BusinessTypeSettings isAdmin={isAdmin} />
                    </TabsContent>

                    {/* Alerts Tab */}
                    <TabsContent value="alerts" className="mt-6">
                        <Card className="bg-card border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground">Configurações de Alertas</CardTitle>
                                <CardDescription>
                                    Defina quando os alertas devem ser exibidos
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-foreground">Alerta de Vencimento</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={expiryDays}
                                            onChange={(e) => setExpiryDays(e.target.value)}
                                            className="w-20 bg-background border-input text-foreground"
                                        />
                                        <span className="text-muted-foreground">dias antes do vencimento</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Itens serão destacados quando faltarem este número de dias para vencer
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-foreground">Alerta de Estoque Baixo</Label>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={lowStockPercent}
                                            onChange={(e) => setLowStockPercent(e.target.value)}
                                            className="w-20 bg-background border-input text-foreground"
                                        />
                                        <span className="text-muted-foreground">% do estoque mínimo</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Itens serão marcados como &quot;estoque baixo&quot; quando a quantidade atual for igual ou menor que esta % do mínimo
                                    </p>
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button onClick={handleSaveAlerts} disabled={isSaving}>
                                        {isSaving ? "Salvando..." : "Salvar Alertas"}
                                    </Button>
                                    {saveMessage && (
                                        <span className="text-sm text-green-600 dark:text-green-400">{saveMessage}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Users Tab */}
                    {isAdmin && (
                        <TabsContent value="users" className="mt-6">
                            <Card className="bg-card border-border">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <div>
                                        <CardTitle className="text-foreground">Usuários</CardTitle>
                                        <CardDescription>
                                            Gerencie os usuários do sistema
                                        </CardDescription>
                                    </div>
                                    <CreateUserDialog onUserCreated={handleUserCreated} />
                                </CardHeader>
                                <CardContent>
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-muted">
                                                <TableRow className="border-border hover:bg-transparent">
                                                    <TableHead className="text-muted-foreground">Nome</TableHead>
                                                    <TableHead className="text-muted-foreground">Email</TableHead>
                                                    <TableHead className="text-muted-foreground">Função</TableHead>
                                                    <TableHead className="text-muted-foreground hidden sm:table-cell">Criado em</TableHead>
                                                    <TableHead className="text-right text-muted-foreground">Ações</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {users.map((user, index) => (
                                                    <TableRow
                                                        key={user.id}
                                                        className="border-border"
                                                    >
                                                        <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                                                {user.role === "ADMIN" ? "Administrador" : "Operador"}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground hidden sm:table-cell">
                                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                <EditUserDialog
                                                                    user={user}
                                                                    onUserUpdated={updateUser}
                                                                />
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500 hover:text-red-600"
                                                                    onClick={() => handleDeleteUser(user.id, user.email)}
                                                                    disabled={user.email === currentUserEmail}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    )}



                    {/* Minha Conta Tab - Password Change */}
                    <TabsContent value="account">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Lock className="w-5 h-5" />
                                    Minha Conta
                                </CardTitle>
                                <CardDescription>
                                    Altere sua senha de acesso ao sistema
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4 max-w-md">
                                    <div className="p-3 rounded-lg bg-muted/50 border">
                                        <p className="text-sm font-medium">Email da conta:</p>
                                        <p className="text-sm text-muted-foreground">{currentUserEmail || "Não identificado"}</p>
                                    </div>

                                    <DirectPasswordChangeForm currentUserEmail={currentUserEmail} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing">
                        <Card>
                            <CardHeader>
                                <CardTitle>Assinatura & Plano</CardTitle>
                                <CardDescription>
                                    Gerencie sua assinatura e métodos de pagamento
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border">
                                    <div className="space-y-1">
                                        <p className="font-medium flex items-center gap-2">
                                            Status da Assinatura
                                            {subscriptionStatus === 'active' && <Badge className="bg-green-500">Ativa</Badge>}
                                            {subscriptionStatus === 'trialing' && <Badge className="bg-blue-500">Teste Grátis</Badge>}
                                            {(!subscriptionStatus || subscriptionStatus === 'canceled' || subscriptionStatus === 'past_due') && <Badge variant="destructive">Inativa / Vencida</Badge>}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {subscriptionExpiresAt ? `Renova/Expira em: ${new Date(subscriptionExpiresAt).toLocaleDateString()}` : "Nenhuma assinatura ativa"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            try {
                                                setIsSaving(true) // Reuse saving state for loading
                                                const res = await fetch("/api/stripe/portal", { method: "POST" })
                                                if (res.ok) {
                                                    const data = await res.json()
                                                    window.location.href = data.url
                                                } else {
                                                    alert("Não foi possível abrir o portal de faturamento.")
                                                }
                                            } catch (e) {
                                                console.error(e)
                                            } finally {
                                                setIsSaving(false)
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "Carregando..." : "Gerenciar Assinatura"}
                                    </Button>
                                </div>

                                {(!subscriptionStatus || subscriptionStatus !== 'active') && (
                                    <div className="p-4 rounded-lg border border-orange-200 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-500/20">
                                        <h4 className="font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            Regularize seu acesso
                                        </h4>
                                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1 mb-3">
                                            Sua assinatura não está ativa. Para continuar usando todas as funcionalidades do sistema, por favor reative seu plano.
                                        </p>
                                        <Button
                                            className="bg-orange-600 hover:bg-orange-700 text-white"
                                            onClick={() => window.location.href = "/"}
                                        >
                                            Ver Planos
                                        </Button>
                                    </div>
                                )}

                                {/* Cancel Subscription Section */}
                                {subscriptionStatus && subscriptionStatus !== 'canceled' && subscriptionStatus !== 'cancel_at_period_end' && (
                                    <div className="border-t border-border pt-6 mt-6 space-y-4">
                                        <h3 className="font-semibold text-foreground">Cancelar Assinatura</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Você pode cancelar sua assinatura a qualquer momento, sem taxas de cancelamento.
                                        </p>
                                        <Button
                                            variant="outline"
                                            className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                            onClick={async () => {
                                                const daysSincePayment = subscriptionExpiresAt
                                                    ? Math.max(0, 30 - Math.floor((new Date(subscriptionExpiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                                                    : 999;

                                                const withinRefundPeriod = daysSincePayment <= 7;

                                                let confirmMsg = `Tem certeza que deseja cancelar sua assinatura?\n\n`;

                                                if (withinRefundPeriod) {
                                                    confirmMsg += `✅ Você está dentro do período de 7 dias para reembolso.\n`;
                                                    confirmMsg += `Se confirmar, você receberá o reembolso integral e o acesso será encerrado imediatamente.\n\n`;
                                                } else {
                                                    confirmMsg += `⚠️ O período de 7 dias para reembolso já passou.\n`;
                                                    confirmMsg += `Se confirmar, você manterá acesso até ${subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'o fim do período pago'}.\n\n`;
                                                }

                                                confirmMsg += `Após o término, seus dados serão removidos automaticamente.`;

                                                if (!confirm(confirmMsg)) return;

                                                try {
                                                    setIsSaving(true);
                                                    const response = await fetch("/api/user/cancel-subscription", {
                                                        method: "POST",
                                                        headers: { "Content-Type": "application/json" },
                                                        body: JSON.stringify({ requestRefund: withinRefundPeriod })
                                                    });
                                                    const data = await response.json();

                                                    if (response.ok) {
                                                        let message = data.message;
                                                        if (data.refundIssued) {
                                                            message += `\n\nReembolso de ${data.refundAmount} será processado em até 10 dias úteis.`;
                                                        }
                                                        alert(message);
                                                        window.location.reload();
                                                    } else {
                                                        alert(data.error || "Erro ao cancelar assinatura");
                                                    }
                                                } catch (e) {
                                                    console.error(e);
                                                    alert("Erro ao cancelar assinatura");
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            disabled={isSaving}
                                        >
                                            Cancelar Assinatura
                                        </Button>
                                    </div>
                                )}

                                {/* Show if subscription is set to cancel */}
                                {subscriptionStatus === 'cancel_at_period_end' && (
                                    <div className="border-t border-border pt-6 mt-6 space-y-4">
                                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                            <h3 className="font-semibold text-yellow-600 dark:text-yellow-400">Assinatura Cancelada</h3>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Sua assinatura foi cancelada mas você ainda tem acesso até{' '}
                                                <strong>{subscriptionExpiresAt ? new Date(subscriptionExpiresAt).toLocaleDateString() : 'o fim do período'}</strong>.
                                            </p>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Após essa data, seus dados serão removidos automaticamente.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* LGPD Section - Export Data */}
                                <div className="border-t border-border pt-6 mt-6 space-y-4">
                                    <h3 className="font-semibold text-foreground">Seus Direitos (LGPD)</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar e exportar seus dados.
                                    </p>

                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            try {
                                                const response = await fetch("/api/user/export-data")
                                                if (response.ok) {
                                                    const blob = await response.blob()
                                                    const url = window.URL.createObjectURL(blob)
                                                    const a = document.createElement('a')
                                                    a.href = url
                                                    a.download = `meus-dados-estoquepro-${new Date().toISOString().split('T')[0]}.json`
                                                    document.body.appendChild(a)
                                                    a.click()
                                                    a.remove()
                                                    window.URL.revokeObjectURL(url)
                                                } else {
                                                    alert("Erro ao exportar dados")
                                                }
                                            } catch (e) {
                                                console.error(e)
                                                alert("Erro ao exportar dados")
                                            }
                                        }}
                                    >
                                        Exportar Meus Dados
                                    </Button>
                                </div>

                                {/* Delete Account Section - Separate and clear */}
                                <div className="border-t border-border pt-6 mt-6 space-y-4">
                                    <h3 className="font-semibold text-destructive">Excluir Conta</h3>
                                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 space-y-2">
                                        <p className="text-sm text-foreground font-medium">
                                            ⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!
                                        </p>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                                            <li>Todos os seus dados serão removidos permanentemente</li>
                                            <li>Produtos, categorias, fichas técnicas, histórico - tudo será perdido</li>
                                            <li>Sua assinatura será cancelada automaticamente</li>
                                            <li>Compra há 7 dias ou menos: você receberá reembolso integral</li>
                                        </ul>
                                    </div>
                                    <Button
                                        variant="destructive"
                                        onClick={async () => {
                                            const confirmMsg = `⚠️ AÇÃO IRREVERSÍVEL!\n\nAo excluir sua conta:\n• Todos os dados serão PERDIDOS permanentemente\n• Sua assinatura será cancelada\n• Se a compra foi há 7 dias ou menos: reembolso integral\n\nDigite "EXCLUIR" para confirmar:`

                                            const input = prompt(confirmMsg)
                                            if (input !== "EXCLUIR") {
                                                if (input !== null) {
                                                    alert("Confirmação incorreta. A conta não foi excluída.")
                                                }
                                                return
                                            }

                                            try {
                                                setIsSaving(true)
                                                const response = await fetch("/api/user/delete-account", {
                                                    method: "DELETE"
                                                })
                                                const data = await response.json()

                                                if (response.ok) {
                                                    let message = "Conta excluída com sucesso!"
                                                    if (data.refundIssued) {
                                                        message += `\n\nReembolso de ${data.refundAmount} será processado em até 10 dias úteis.`
                                                    }
                                                    alert(message)
                                                    window.location.href = "/"
                                                } else {
                                                    alert(data.error || "Erro ao excluir conta")
                                                }
                                            } catch (e) {
                                                console.error(e)
                                                alert("Erro ao excluir conta")
                                            } finally {
                                                setIsSaving(false)
                                            }
                                        }}
                                        disabled={isSaving}
                                    >
                                        Excluir Minha Conta
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </SettingsContext.Provider>
    )
}

// Password Change Form Component - Uses email-based reset flow
function PasswordChangeForm() {
    const { currentUserEmail } = React.useContext(SettingsContext) || { currentUserEmail: undefined }
    const stackApp = useStackApp()
    const [isLoading, setIsLoading] = React.useState(false)
    const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleResetPassword = async () => {
        if (!currentUserEmail) {
            setMessage({ type: "error", text: "Email do usuário não encontrado." })
            return
        }

        setIsLoading(true)
        setMessage(null)

        try {
            await stackApp.sendForgotPasswordEmail(currentUserEmail)
            setMessage({
                type: "success",
                text: `Email enviado para ${currentUserEmail}! Clique no link recebido para definir sua nova senha.`
            })
        } catch (error: any) {
            console.error(error)
            setMessage({ type: "error", text: error.message || "Erro ao enviar email de redefinição." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                    Para definir ou alterar sua senha, enviaremos um link seguro para o seu email.
                </p>
                {currentUserEmail && (
                    <p className="text-sm font-medium text-foreground">
                        Email: {currentUserEmail}
                    </p>
                )}
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === "success"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}>
                    {message.text}
                </div>
            )}

            <Button onClick={handleResetPassword} disabled={isLoading || !currentUserEmail} className="gap-2">
                <Lock className="w-4 h-4" />
                {isLoading ? "Enviando..." : "Enviar Link de Redefinição"}
            </Button>
        </div>
    )
}

// Context to pass currentUserEmail to PasswordChangeForm
const SettingsContext = React.createContext<{ currentUserEmail?: string } | null>(null)

// Direct Password Change Form - Uses API to change password directly
function DirectPasswordChangeForm({ currentUserEmail }: { currentUserEmail?: string }) {
    const [newPassword, setNewPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [showNewPassword, setShowNewPassword] = React.useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [message, setMessage] = React.useState<{ type: "success" | "error"; text: string } | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newPassword || newPassword.length < 6) {
            setMessage({ type: "error", text: "A nova senha deve ter pelo menos 6 caracteres" })
            return
        }

        if (newPassword !== confirmPassword) {
            setMessage({ type: "error", text: "As senhas não coincidem" })
            return
        }

        setIsLoading(true)
        setMessage(null)

        try {
            const response = await fetch("/api/users/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ newPassword })
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: "success", text: data.message || "Senha alterada com sucesso!" })
                setNewPassword("")
                setConfirmPassword("")
            } else {
                setMessage({ type: "error", text: data.error || "Erro ao alterar senha" })
            }
        } catch (error) {
            setMessage({ type: "error", text: "Erro de conexão. Tente novamente." })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="newPassword">Nova Senha</Label>
                <div className="relative">
                    <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                <div className="relative">
                    <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Digite novamente"
                        className="pr-10"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                </div>
            </div>

            {message && (
                <div className={`p-3 rounded-lg text-sm ${message.type === "success"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                    }`}>
                    {message.text}
                </div>
            )}

            <Button type="submit" disabled={isLoading} className="gap-2">
                <Lock className="w-4 h-4" />
                {isLoading ? "Salvando..." : "Alterar Senha"}
            </Button>
        </form>
    )
}

