"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Users, Shield, UserCheck, Calendar, RefreshCw, UserPlus, Trash2, Search, Building2 } from "lucide-react"
import { EditUserDialog } from "@/components/edit-user-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface User {
    id: string
    email: string
    name: string | null
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF"
    phone: string | null
    position: string | null
    organizationId: string | null
    organizationName: string
    organizationSlug: string | null
    createdAt: string
    isActive?: boolean
}

interface Organization {
    id: string
    name: string
    slug: string
}

export default function AdminUsersClient() {
    const [users, setUsers] = useState<User[]>([])
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [filteredUsers, setFilteredUsers] = useState<User[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    // Add User State
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [newUserEmail, setNewUserEmail] = useState("")
    const [newUserName, setNewUserName] = useState("")
    const [newUserRole, setNewUserRole] = useState<"ADMIN" | "STAFF">("STAFF")
    const [newUserOrgId, setNewUserOrgId] = useState("")

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const response = await fetch("/api/admin/users")
            if (!response.ok) {
                throw new Error("Failed to fetch users")
            }
            const data = await response.json()
            setUsers(data.users || [])
            setFilteredUsers(data.users || [])
        } catch (err) {
            setError("Erro ao carregar usuários")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const fetchOrganizations = async () => {
        try {
            const response = await fetch("/api/admin/organizations")
            if (response.ok) {
                const data = await response.json()
                setOrganizations(data.organizations || [])
            }
        } catch (err) {
            console.error("Error fetching organizations", err)
        }
    }

    useEffect(() => {
        fetchUsers()
        fetchOrganizations()
    }, [])

    useEffect(() => {
        const lowerSearch = searchTerm.toLowerCase()
        const filtered = users.filter(user =>
            (user.name?.toLowerCase().includes(lowerSearch) || false) ||
            user.email.toLowerCase().includes(lowerSearch) ||
            user.organizationName.toLowerCase().includes(lowerSearch)
        )
        setFilteredUsers(filtered)
    }, [searchTerm, users])

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("pt-BR")
    }

    const getRoleBadge = (role: string) => {
        switch (role) {
            case "SUPER_ADMIN":
                return <Badge className="bg-purple-600">Super Admin</Badge>
            case "ADMIN":
                return <Badge className="bg-blue-600">Admin</Badge>
            case "STAFF":
                return <Badge variant="secondary">Staff</Badge>
            default:
                return <Badge variant="outline">{role}</Badge>
        }
    }

    const handleAddUser = async () => {
        if (!newUserEmail || !newUserName || !newUserOrgId) {
            alert("Preencha todos os campos obrigatórios")
            return
        }

        try {
            const response = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newUserEmail,
                    name: newUserName,
                    role: newUserRole,
                    organizationId: newUserOrgId
                })
            })

            if (response.ok) {
                fetchUsers()
                setIsAddUserOpen(false)
                setNewUserEmail("")
                setNewUserName("")
                setNewUserOrgId("")
                setNewUserRole("STAFF")
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao criar usuário")
            }
        } catch (error) {
            console.error("Error creating user:", error)
            alert("Erro ao criar usuário")
        }
    }

    const handleUpdateUser = async (userId: string, updates: Partial<User>) => {
        try {
            const response = await fetch("/api/admin/users", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId, ...updates })
            })

            if (response.ok) {
                fetchUsers()
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao atualizar usuário")
            }
        } catch (error) {
            console.error("Error updating user:", error)
        }
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm("Tem certeza que deseja excluir permanentemente este usuário?")) return

        try {
            const response = await fetch("/api/admin/users", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: userId })
            })

            if (response.ok) {
                fetchUsers()
            } else {
                const data = await response.json()
                alert(data.error || "Erro ao excluir usuário")
            }
        } catch (error) {
            console.error("Error deleting user:", error)
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold">Usuários</h1>
                    <p className="text-muted-foreground">
                        Gerencie todos os usuários do sistema
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => setIsAddUserOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Novo Usuário
                    </Button>
                    <Button onClick={fetchUsers} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Atualizar
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <Users className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{users.length}</p>
                                <p className="text-sm text-muted-foreground">Total de Usuários</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => u.role === "SUPER_ADMIN").length}
                                </p>
                                <p className="text-sm text-muted-foreground">Super Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <UserCheck className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => u.role === "ADMIN").length}
                                </p>
                                <p className="text-sm text-muted-foreground">Admins</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gray-100 rounded-lg">
                                <Users className="w-6 h-6 text-gray-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">
                                    {users.filter(u => u.role === "STAFF").length}
                                </p>
                                <p className="text-sm text-muted-foreground">Staff</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 max-w-sm">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por nome, email ou empresa..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Usuários ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum usuário encontrado.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Usuário</th>
                                        <th className="text-left py-3 px-4">Função</th>
                                        <th className="text-left py-3 px-4">Empresa</th>
                                        <th className="text-left py-3 px-4">Criado em</th>
                                        <th className="text-right py-3 px-4">Ações</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{user.name || "Sem nome"}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {getRoleBadge(user.role)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <div>
                                                        <p className="text-sm">{user.organizationName}</p>
                                                        {user.organizationSlug && (
                                                            <p className="text-xs text-muted-foreground">/{user.organizationSlug}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <EditUserDialog
                                                        user={user as any}
                                                        onUserUpdated={async (id, updates) => handleUpdateUser(id, updates)}
                                                    />
                                                    {user.role !== "SUPER_ADMIN" && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDeleteUser(user.id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
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

            {/* Add User Dialog */}
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Novo Usuário</DialogTitle>
                        <DialogDescription>
                            Adicione um novo usuário ao sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nome</Label>
                            <Input
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Nome completo"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="usuario@email.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Empresa</Label>
                            <Select value={newUserOrgId} onValueChange={setNewUserOrgId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a empresa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Função</Label>
                            <Select value={newUserRole} onValueChange={(v: "ADMIN" | "STAFF") => setNewUserRole(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="STAFF">Staff</SelectItem>
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddUser}>
                            Criar Usuário
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
