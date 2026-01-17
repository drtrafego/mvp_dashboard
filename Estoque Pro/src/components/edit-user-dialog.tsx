"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF"
    isActive?: boolean
    password?: string
}

interface EditUserDialogProps {
    user: User
    onUserUpdated: (id: string, updates: Partial<User>) => Promise<void>
    trigger?: React.ReactNode
}

export function EditUserDialog({ user, onUserUpdated, trigger }: EditUserDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: user.name || "",
        email: user.email,
        role: user.role,
        isActive: user.isActive ?? true
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!(formData.name || "").trim() || !(formData.email || "").trim()) return

        setIsLoading(true)

        try {
            await onUserUpdated(user.id, {
                name: formData.name,
                email: formData.email,
                role: formData.role,
                isActive: formData.isActive,
                password: (formData as any).password || undefined // Pass password if set
            })
            setOpen(false)
        } catch (error) {
            console.error("Error updating user:", error)
            alert(error instanceof Error ? error.message : "Erro ao atualizar usuário.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon">
                        <Edit className="w-4 h-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Editar Usuário</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Atualize os dados e permissões do usuário.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-name" className="text-right text-foreground">Nome</Label>
                            <Input
                                id="edit-name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3 bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-email" className="text-right text-foreground">Email</Label>
                            <Input
                                id="edit-email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3 bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-role" className="text-right text-foreground">Função</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(v: "ADMIN" | "STAFF") => setFormData(prev => ({ ...prev, role: v }))}
                                disabled={user.role === "SUPER_ADMIN"}
                            >
                                <SelectTrigger className="col-span-3 bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="STAFF">Operador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-active" className="text-right text-foreground">Status</Label>
                            <div className="flex items-center gap-2 col-span-3">
                                <Checkbox
                                    id="edit-active"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isActive: checked }))}
                                />
                                <span className="text-sm text-muted-foreground">
                                    {formData.isActive ? "Ativo (Pode acessar o sistema)" : "Inativo (Acesso bloqueado)"}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-password" className="text-right text-foreground">Nova Senha</Label>
                            <div className="col-span-3 relative">
                                <Input
                                    id="edit-password"
                                    type="password"
                                    placeholder="Deixe em branco para não alterar"
                                    className="bg-background border-input text-foreground pr-8"
                                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                />
                                <span className="text-[10px] text-muted-foreground absolute right-2 top-2.5">Opcional</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !(formData.name || "").trim()}>
                            {isLoading ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
