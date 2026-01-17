"use client"

import { useEffect, useState } from "react"

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Building2, Users, Package, Calendar, CheckCircle, XCircle, RefreshCw, UserPlus, Trash2, Pencil } from "lucide-react"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Organization {
    id: string
    name: string
    slug: string
    plan: string
    isActive: boolean
    maxUsers: number
    maxProducts: number
    usersCount: number
    productsCount: number
    categoriesCount: number
    adminEmail: string
    adminName: string
    adminId?: string
    createdAt: string
}

interface StaffMember {
    id: string
    name: string | null
    email: string
    role: "ADMIN" | "STAFF" | "SUPER_ADMIN"
    createdAt: string
    isActive?: boolean
}

export default function AdminOrganizationsClient() {
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Staff Management State
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
    const [staffList, setStaffList] = useState<StaffMember[]>([])
    const [loadingStaff, setLoadingStaff] = useState(false)
    const [newStaffEmail, setNewStaffEmail] = useState("")
    const [newStaffName, setNewStaffName] = useState("")
    const [newStaffRole, setNewStaffRole] = useState<"ADMIN" | "STAFF">("STAFF")

    // Edit Organization State
    const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false)
    const [editOrgName, setEditOrgName] = useState("")
    const [editOrgSlug, setEditOrgSlug] = useState("")
    const [editOrgPlan, setEditOrgPlan] = useState("FREE")
    const [editOrgAdminEmail, setEditOrgAdminEmail] = useState("")
    const [editOrgMaxUsers, setEditOrgMaxUsers] = useState(0)
    const [editOrgMaxProducts, setEditOrgMaxProducts] = useState(0)
    const [editOrgIsActive, setEditOrgIsActive] = useState(true)

    const fetchOrganizations = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/organizations")
            if (!response.ok) {
                throw new Error("Failed to fetch organizations")
            }
            const data = await response.json()
            setOrganizations(data.organizations || [])
        } catch (err) {
            setError("Erro ao carregar organizações")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchOrganizations()
    }, [])

    const toggleActive = async (org: Organization) => {
        try {
            const response = await fetch("/api/admin/organizations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: org.id, isActive: !org.isActive })
            })
            if (response.ok) {
                fetchOrganizations()
            }
        } catch (err) {
            console.error("Error toggling organization:", err)
        }
    }

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR")
    }

    // Staff Management Functions
    const openStaffModal = async (org: Organization) => {
        setSelectedOrg(org)
        setIsStaffModalOpen(true)
        fetchStaff(org.id)
    }

    const fetchStaff = async (orgId: string) => {
        setLoadingStaff(true)
        try {
            const response = await fetch(`/api/admin/organizations/${orgId}/staff`)
            if (response.ok) {
                const data = await response.json()
                setStaffList(data.staff || [])
            }
        } catch (error) {
            console.error("Error fetching staff:", error)
        } finally {
            setLoadingStaff(false)
        }
    }

    const handleAddStaff = async () => {
        if (!selectedOrg || !newStaffEmail || !newStaffName) return

        try {
            const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/staff`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newStaffEmail,
                    name: newStaffName,
                    role: newStaffRole
                })
            })

            if (response.ok) {
                // Refresh staff list
                fetchStaff(selectedOrg.id)
                // Reset form
                setNewStaffEmail("")
                setNewStaffName("")
                setNewStaffRole("STAFF")
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao adicionar staff")
            }
        } catch (error) {
            console.error("Error adding staff:", error)
            alert("Erro ao adicionar staff")
        }
    }

    const handleRemoveStaff = async (email: string) => {
        if (!selectedOrg || !confirm("Tem certeza que deseja remover este membro?")) return

        try {
            const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/staff`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })

            if (response.ok) {
                fetchStaff(selectedOrg.id)
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao remover staff")
            }
        } catch (error) {
            console.error("Error removing staff:", error)
            alert("Erro ao remover staff")
        }
    }

    const handleUpdateStaff = async (userId: string, updates: Partial<StaffMember>) => {
        if (!selectedOrg) return

        try {
            // Need to transform 'isActive' to backend expected format if needed, but previously we implemented it as a direct field update.
            // Backend expects { userId, ...updates }
            const response = await fetch(`/api/admin/organizations/${selectedOrg.id}/staff`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, ...updates })
            })

            if (response.ok) {
                fetchStaff(selectedOrg.id)
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao atualizar staff")
            }
        } catch (error) {
            console.error("Error updating staff:", error)
            alert("Erro ao atualizar staff")
        }
    }

    const openEditOrgModal = (org: Organization) => {
        setSelectedOrg(org)
        setEditOrgName(org.name)
        setEditOrgSlug(org.slug)
        setEditOrgPlan(org.plan)
        setEditOrgAdminEmail(org.adminEmail)
        setEditOrgMaxUsers(org.maxUsers)
        setEditOrgMaxProducts(org.maxProducts)
        setEditOrgIsActive(org.isActive)
        fetchStaff(org.id)
        setIsEditOrgModalOpen(true)
    }

    const handleUpdateOrg = async () => {
        if (!selectedOrg) return

        try {
            const response = await fetch("/api/admin/organizations", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: selectedOrg.id,
                    name: editOrgName,
                    slug: editOrgSlug,
                    plan: editOrgPlan,
                    adminEmail: editOrgAdminEmail !== selectedOrg.adminEmail ? editOrgAdminEmail : undefined,
                    adminId: selectedOrg.adminId,
                    maxUsers: editOrgMaxUsers,
                    maxProducts: editOrgMaxProducts,
                    isActive: editOrgIsActive
                })
            })

            if (response.ok) {
                fetchOrganizations()
                setIsEditOrgModalOpen(false)
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao atualizar organização")
            }
        } catch (error) {
            console.error("Error updating org:", error)
        }
    }
    const handleDeleteOrg = async (orgId: string, orgName: string) => {
        if (!confirm(`Tem certeza que deseja EXCLUIR permanentemente a empresa "${orgName}"? Esta ação deletará todos os dados associados e não pode ser desfeita.`)) return

        try {
            const response = await fetch("/api/admin/organizations", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: orgId })
            })

            if (response.ok) {
                fetchOrganizations()
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao deletar organização")
            }
        } catch (error) {
            console.error("Error deleting org:", error)
            alert("Erro ao deletar organização")
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Organizações</h1>
                    <p className="text-muted-foreground">
                        Gerencie todas as empresas cadastradas no sistema
                    </p>
                </div>
                <Button onClick={fetchOrganizations} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{organizations.length}</p>
                                <p className="text-sm text-muted-foreground">Total de Empresas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {organizations.filter(o => o.isActive).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Ativas</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {organizations.reduce((acc, o) => acc + o.usersCount, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Package className="w-6 h-6 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {organizations.reduce((acc, o) => acc + o.productsCount, 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Total de Produtos</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Empresas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : organizations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhuma empresa cadastrada ainda
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Empresa</th>
                                        <th className="text-left py-3 px-4">Admin</th>
                                        <th className="text-left py-3 px-4">Plano</th>
                                        <th className="text-center py-3 px-4">Usuários</th>
                                        <th className="text-center py-3 px-4">Produtos</th>
                                        <th className="text-left py-3 px-4">Criado em</th>
                                        <th className="text-center py-3 px-4">Status</th>
                                        <th className="text-center py-3 px-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {organizations.map((org) => (
                                        <tr key={org.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{org.name}</p>
                                                    <p className="text-sm text-muted-foreground">/{org.slug}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm">{org.adminName}</p>
                                                    <p className="text-xs text-muted-foreground">{org.adminEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant={org.plan === "PRO" ? "default" : "secondary"}>
                                                    {org.plan}
                                                </Badge>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                {org.usersCount}/{org.maxUsers}
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                {org.productsCount}/{org.maxProducts}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{formatDate(org.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                {org.isActive ? (
                                                    <Badge variant="default" className="bg-green-500">Ativo</Badge>
                                                ) : (
                                                    <Badge variant="destructive">Inativo</Badge>
                                                )}
                                            </td>
                                            <td className="text-center py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openStaffModal(org)}
                                                        title="Gerenciar Staff"
                                                    >
                                                        <Users className="w-4 h-4 text-blue-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openEditOrgModal(org)}
                                                        title="Editar Empresa"
                                                    >
                                                        <Pencil className="w-4 h-4 text-orange-500" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleActive(org)}
                                                        title={org.isActive ? "Desativar" : "Ativar"}
                                                    >
                                                        {org.isActive ? (
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <CheckCircle className="w-4 h-4 text-green-500" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteOrg(org.id, org.name)}
                                                        title="Excluir Empresa Permanentemente"
                                                    >
                                                        <Trash2 className="w-4 h-4 text-red-700" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Edit Organization Dialog (Unified) */}
            <Dialog open={isEditOrgModalOpen} onOpenChange={setIsEditOrgModalOpen}>
                <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Editar Empresa e Membros</DialogTitle>
                        <DialogDescription>
                            Gerencie detalhes da organização e sua equipe.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue="company" className="w-full flex-1 flex flex-col overflow-hidden">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="company">Dados da Empresa</TabsTrigger>
                            <TabsTrigger value="members">Membros da Equipe ({staffList.length})</TabsTrigger>
                        </TabsList>

                        {/* TAB: Company Data */}
                        <TabsContent value="company" className="space-y-4 py-2 flex-1 overflow-y-auto pr-2">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nome da Empresa</Label>
                                    <Input
                                        value={editOrgName}
                                        onChange={(e) => setEditOrgName(e.target.value)}
                                        placeholder="Nome da organização"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Slug (URL)</Label>
                                    <Input
                                        value={editOrgSlug}
                                        onChange={(e) => setEditOrgSlug(e.target.value)}
                                        placeholder="slug-da-empresa"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email do Admin</Label>
                                    <Input
                                        value={editOrgAdminEmail}
                                        onChange={(e) => setEditOrgAdminEmail(e.target.value)}
                                        placeholder="Email do administrador"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Alterar este email atualizará o usuário administrador.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Plano</Label>
                                    <Select value={editOrgPlan} onValueChange={setEditOrgPlan}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o plano" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="FREE">Free</SelectItem>
                                            <SelectItem value="PRO">Pro</SelectItem>
                                            <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Max Usuários</Label>
                                        <Input
                                            type="number"
                                            value={editOrgMaxUsers}
                                            onChange={(e) => setEditOrgMaxUsers(parseInt(e.target.value))}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Max Produtos</Label>
                                        <Input
                                            type="number"
                                            value={editOrgMaxProducts}
                                            onChange={(e) => setEditOrgMaxProducts(parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="isActive"
                                        checked={editOrgIsActive}
                                        onChange={(e) => setEditOrgIsActive(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <Label htmlFor="isActive" className="cursor-pointer">Empresa Ativa</Label>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditOrgModalOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleUpdateOrg}>
                                    Salvar Dados da Empresa
                                </Button>
                            </div>
                        </TabsContent>

                        {/* TAB: Members */}
                        <TabsContent value="members" className="flex-1 flex flex-col overflow-hidden space-y-4 py-2">
                            <div className="p-4 bg-muted/30 rounded-lg border border-border">
                                <Label className="mb-2 block font-medium">Adicionar Novo Membro</Label>
                                <div className="flex items-end gap-2">
                                    <div className="grid grid-cols-2 gap-2 flex-1">
                                        <Input
                                            placeholder="Nome"
                                            value={newStaffName}
                                            onChange={(e) => setNewStaffName(e.target.value)}
                                            className="bg-background"
                                        />
                                        <Input
                                            placeholder="Email"
                                            value={newStaffEmail}
                                            onChange={(e) => setNewStaffEmail(e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                    <div className="w-[140px]">
                                        <Select value={newStaffRole} onValueChange={(v: "ADMIN" | "STAFF") => setNewStaffRole(v)}>
                                            <SelectTrigger className="bg-background">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STAFF">Staff</SelectItem>
                                                <SelectItem value="ADMIN">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={handleAddStaff}>
                                        <UserPlus className="w-4 h-4 mr-2" />
                                        Adicionar
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border flex-1 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-muted sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                        <tr>
                                            <th className="py-2 px-3 text-left font-medium">Nome/Email</th>
                                            <th className="py-2 px-3 text-left font-medium">Função</th>
                                            <th className="py-2 px-3 text-center font-medium">Status</th>
                                            <th className="py-2 px-3 text-right font-medium">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffList.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-muted-foreground">
                                                    Nenhum membro encontrado.
                                                </td>
                                            </tr>
                                        ) : (
                                            staffList.map((staff) => (
                                                <tr key={staff.id} className="border-t hover:bg-muted/50">
                                                    <td className="py-2 px-3">
                                                        <div>
                                                            <p className="font-medium">{staff.name}</p>
                                                            <p className="text-xs text-muted-foreground">{staff.email}</p>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-3">
                                                        <Badge variant="outline" className={staff.role === "ADMIN" ? "bg-blue-50 text-blue-700 border-blue-200" : ""}>
                                                            {staff.role}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        {staff.isActive === false ? (
                                                            <Badge variant="destructive" className="h-5 text-[10px]">Inativo</Badge>
                                                        ) : (
                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 h-5 text-[10px]">Ativo</Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-2 px-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {staff.role !== "SUPER_ADMIN" && (
                                                                <>
                                                                    <EditUserDialog
                                                                        user={staff as any}
                                                                        onUserUpdated={async (id, updates) => handleUpdateStaff(id, updates)}
                                                                    />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                                        onClick={() => handleRemoveStaff(staff.email)}
                                                                    >
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>
        </div>
    )
}
