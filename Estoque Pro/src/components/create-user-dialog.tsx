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
import { UserPlus } from "lucide-react"

interface CreateUserDialogProps {
    onUserCreated: (user: {
        id: string
        name: string
        email: string
        role: "ADMIN" | "STAFF"
        createdAt: string
        password?: string
    }) => Promise<void>
    trigger?: React.ReactNode
}

export function CreateUserDialog({ onUserCreated, trigger }: CreateUserDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [isLoading, setIsLoading] = React.useState(false)
    const [formData, setFormData] = React.useState({
        name: "",
        email: "",
        password: "",
        role: "STAFF" as "ADMIN" | "STAFF"
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.name.trim() || !formData.email.trim() || !formData.password) return

        setIsLoading(true)

        try {
            const newUser = {
                id: `user-${Date.now()}`,
                name: formData.name.trim(),
                email: formData.email.trim(),
                role: formData.role,
                createdAt: new Date().toISOString(),
                password: formData.password // Pass password for API
            }

            await onUserCreated(newUser)
            setFormData({ name: "", email: "", password: "", role: "STAFF" })
            setOpen(false)
        } catch (error) {
            console.error("Error creating user:", error)
            alert("Erro ao criar usuário. Tente novamente.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <UserPlus className="w-4 h-4" />
                        Adicionar Usuário
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Novo Usuário</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Adicione um novo usuário ao sistema.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-foreground">Nome</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="col-span-3 bg-background border-input text-foreground"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right text-foreground">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="col-span-3 bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="password" className="text-right text-foreground">Senha</Label>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                className="col-span-3 bg-background border-input text-foreground"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="role" className="text-right text-foreground">Função</Label>
                            <Select value={formData.role} onValueChange={(v: "ADMIN" | "STAFF") => setFormData(prev => ({ ...prev, role: v }))}>
                                <SelectTrigger className="col-span-3 bg-background border-input text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border">
                                    <SelectItem value="ADMIN">Administrador</SelectItem>
                                    <SelectItem value="STAFF">Operador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.name.trim() || !formData.email.trim() || !formData.password}>
                            {isLoading ? "Criando..." : "Criar Usuário"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
