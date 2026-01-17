"use client"

import * as React from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CreateUserDialog } from "@/components/create-user-dialog"
import { Trash2 } from "lucide-react"
import { useStock, type User } from "@/context/stock-context"

interface UserManagementContentProps {
    currentUserEmail?: string
    isAdmin?: boolean
}

export function UserManagementContent({ currentUserEmail, isAdmin = true }: UserManagementContentProps) {
    const { users, addUser, deleteUser } = useStock()

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
        <div className="space-y-4">
            {isAdmin && (
                <div className="flex justify-end">
                    <CreateUserDialog onUserCreated={handleUserCreated} />
                </div>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Função</TableHead>
                            <TableHead>Criado em</TableHead>
                            {isAdmin && <TableHead className="text-right">Ações</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, index) => (
                            <TableRow key={user.id} className={cn(index % 2 === 0 ? "bg-background" : "bg-muted/30")}>
                                <TableCell className="font-medium">{user.name}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                        {user.role === "ADMIN" ? "Administrador" : "Operador"}
                                    </Badge>
                                </TableCell>
                                <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}</TableCell>
                                {isAdmin && (
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleDeleteUser(user.id, user.email)}
                                            disabled={user.email === currentUserEmail}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {users.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                    Nenhum usuário cadastrado.
                </div>
            )}
        </div>
    )
}
