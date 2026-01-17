"use client"

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

// Mock data - will be replaced with real data
const mockUsers = [
    { id: "1", name: "Admin", email: "dr.trafego@gmail.com", role: "ADMIN", createdAt: "2024-12-01" },
    { id: "2", name: "Staff", email: "staff@gmail.com", role: "STAFF", createdAt: "2024-12-01" },
]

export function UserManagementTable() {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Criado em</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mockUsers.map((user, index) => (
                        <TableRow key={user.id} className={cn(index % 2 === 0 ? "bg-background" : "bg-muted/30")}>
                            <TableCell className="font-medium">{user.name}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                                    {user.role === "ADMIN" ? "Administrador" : "Operador"}
                                </Badge>
                            </TableCell>
                            <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString("pt-BR") : "-"}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="sm" disabled={user.email === "dr.trafego@gmail.com"}>
                                    Excluir
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
