"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganization, updateOrganization } from "@/server/actions/organizations";
import { updateOrgMetaDashboardType } from "@/server/actions/org-settings";
import { getOrgUsers, addOrgUser, updateOrgUser, deleteOrgUser } from "@/server/actions/org-users";
import { Trash2, Pencil, Plus, UserPlus, X, Check, Mail, Users } from "lucide-react";

type OrgUser = {
    id: string;
    name: string | null;
    email: string;
    role: string | null;
    createdAt: Date;
};

type OrgDialogProps = {
    trigger?: React.ReactNode;
    mode: "create" | "edit";
    org?: {
        id: string;
        name: string;
        slug: string;
        metaDashboardType?: string;
    };
    onSuccess?: () => void;
};

export function OrgDialog({ trigger, mode, org, onSuccess }: OrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(org?.name || "");
    const [slug, setSlug] = useState(org?.slug || "");
    const [metaDashboard, setMetaDashboard] = useState(org?.metaDashboardType || "ecommerce");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // User management state
    const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [newName, setNewName] = useState("");
    const [addingUser, setAddingUser] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editEmail, setEditEmail] = useState("");
    const [editName, setEditName] = useState("");
    const [userError, setUserError] = useState("");

    // Load users when dialog opens in edit mode
    useEffect(() => {
        if (open && mode === "edit" && org?.id) {
            loadUsers();
        }
    }, [open, mode, org?.id]);

    const loadUsers = async () => {
        if (!org?.id) return;
        setLoadingUsers(true);
        try {
            const users = await getOrgUsers(org.id);
            setOrgUsers(users);
        } catch (e: any) {
            console.error("Failed to load users:", e);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            setError("");

            if (mode === "create") {
                await createOrganization({ name, slug });
            } else {
                if (org) {
                    await updateOrganization(org.id, { name, slug });
                    await updateOrgMetaDashboardType(org.id, metaDashboard);
                }
            }

            setOpen(false);
            if (onSuccess) onSuccess();
        } catch (e: any) {
            setError(e.message || "Erro ao salvar");
        } finally {
            setLoading(false);
        }
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setName(val);
        if (mode === "create") {
            setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    };

    const handleAddUser = async () => {
        if (!org?.id || !newEmail.trim()) return;
        setAddingUser(true);
        setUserError("");
        try {
            await addOrgUser(org.id, newEmail.trim(), newName.trim() || undefined);
            setNewEmail("");
            setNewName("");
            setShowAddForm(false);
            await loadUsers();
        } catch (e: any) {
            setUserError(e.message || "Erro ao adicionar usuário");
        } finally {
            setAddingUser(false);
        }
    };

    const handleUpdateUser = async (userId: string) => {
        setUserError("");
        try {
            await updateOrgUser(userId, {
                email: editEmail.trim() || undefined,
                name: editName.trim() || undefined,
            });
            setEditingUserId(null);
            await loadUsers();
        } catch (e: any) {
            setUserError(e.message || "Erro ao atualizar usuário");
        }
    };

    const handleDeleteUser = async (userId: string, userEmail: string) => {
        if (!confirm(`Tem certeza que deseja remover o usuário "${userEmail}"?`)) return;
        setUserError("");
        try {
            await deleteOrgUser(userId);
            await loadUsers();
        } catch (e: any) {
            setUserError(e.message || "Erro ao excluir usuário");
        }
    };

    const startEditing = (user: OrgUser) => {
        setEditingUserId(user.id);
        setEditEmail(user.email);
        setEditName(user.name || "");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant={mode === "create" ? "default" : "outline"}>{mode === "create" ? "Nova Empresa" : "Editar"}</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Nova Empresa" : "Editar Empresa"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Crie uma nova organização no sistema." : "Altere os dados da empresa."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* Name */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Nome
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={handleNameChange}
                            className="col-span-3"
                        />
                    </div>
                    {/* Slug */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="slug" className="text-right">
                            Slug
                        </Label>
                        <Input
                            id="slug"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    {/* Dashboard Meta */}
                    {mode === "edit" && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="metaDashboard" className="text-right">
                                Dashboard Meta
                            </Label>
                            <select
                                id="metaDashboard"
                                value={metaDashboard}
                                onChange={(e) => setMetaDashboard(e.target.value)}
                                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <option value="ecommerce">E-commerce</option>
                                <option value="captacao">Captação</option>
                                <option value="lancamento">Lançamento</option>
                            </select>
                        </div>
                    )}

                    {/* ===== USER MANAGEMENT SECTION ===== */}
                    {mode === "edit" && org?.id && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                        Usuários ({orgUsers.length})
                                    </h4>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setShowAddForm(!showAddForm)}
                                    className="h-7 text-xs gap-1"
                                >
                                    {showAddForm ? <X className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                                    {showAddForm ? "Cancelar" : "Adicionar"}
                                </Button>
                            </div>

                            {/* Add User Form */}
                            {showAddForm && (
                                <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg mb-3 space-y-2">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="text-sm h-8"
                                            type="email"
                                        />
                                        <Input
                                            placeholder="Nome (opcional)"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="text-sm h-8 w-40"
                                        />
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={handleAddUser}
                                        disabled={addingUser || !newEmail.trim()}
                                        className="h-7 text-xs w-full"
                                    >
                                        {addingUser ? "Adicionando..." : "Adicionar Usuário"}
                                    </Button>
                                </div>
                            )}

                            {/* User Error */}
                            {userError && (
                                <p className="text-red-500 text-xs mb-2">{userError}</p>
                            )}

                            {/* Users List */}
                            {loadingUsers ? (
                                <div className="flex items-center justify-center py-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                    <span className="ml-2 text-xs text-gray-400">Carregando...</span>
                                </div>
                            ) : orgUsers.length === 0 ? (
                                <p className="text-xs text-gray-400 text-center py-4">
                                    Nenhum usuário vinculado a esta empresa.
                                </p>
                            ) : (
                                <div className="space-y-1 max-h-[200px] overflow-y-auto">
                                    {orgUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 group transition-colors"
                                        >
                                            {editingUserId === user.id ? (
                                                // Edit Mode
                                                <div className="flex-1 flex items-center gap-2">
                                                    <Input
                                                        value={editEmail}
                                                        onChange={(e) => setEditEmail(e.target.value)}
                                                        className="text-xs h-7 flex-1"
                                                        type="email"
                                                    />
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="text-xs h-7 w-28"
                                                        placeholder="Nome"
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => handleUpdateUser(user.id)}
                                                    >
                                                        <Check className="h-3 w-3 text-green-500" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-6 w-6"
                                                        onClick={() => setEditingUserId(null)}
                                                    >
                                                        <X className="h-3 w-3 text-gray-400" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                // Display Mode
                                                <>
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                                                            <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                                                {user.name || user.email.split("@")[0]}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 truncate">
                                                                {user.email}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <span className="text-[10px] text-gray-400 mr-1">
                                                            {user.role || "member"}
                                                        </span>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => startEditing(user)}
                                                        >
                                                            <Pencil className="h-3 w-3 text-gray-400" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6"
                                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-400" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {error && <p className="text-red-500 text-sm">{error}</p>}
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Salvando..." : "Salvar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
