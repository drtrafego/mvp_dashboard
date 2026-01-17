"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

type Product = {
    id: string
    name: string
    unit: string
    minStock: number
    currentStock: number
    expiresAt: Date | null
    lastCountAt: Date
    responsible: string
}

const data: Product[] = [
    {
        id: "1",
        name: "Carne de Sol",
        unit: "kg",
        minStock: 10,
        currentStock: 15,
        expiresAt: new Date("2026-01-15"),
        lastCountAt: new Date(),
        responsible: "Admin"
    },
    {
        id: "2",
        name: "Queijo Coalho",
        unit: "kg",
        minStock: 5,
        currentStock: 2,
        expiresAt: new Date("2026-01-05"),
        lastCountAt: new Date(),
        responsible: "Admin"
    },
    {
        id: "3",
        name: "Leite",
        unit: "L",
        minStock: 20,
        currentStock: 25,
        expiresAt: new Date("2025-12-30"),
        lastCountAt: new Date(),
        responsible: "Staff"
    }
]

export function InventoryTable() {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(today.getDate() + 1)

    return (
        <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px]">
                <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="w-[200px]">Produto</TableHead>
                        <TableHead>Unidade</TableHead>
                        <TableHead>Mínimo</TableHead>
                        <TableHead>Atual</TableHead>
                        <TableHead>Validade</TableHead>
                        <TableHead className="hidden md:table-cell">Responsável</TableHead>
                        <TableHead className="hidden md:table-cell">Última Contagem</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((item, index) => {
                        const isLowStock = item.currentStock < item.minStock
                        const isExpiring = item.expiresAt ? item.expiresAt <= tomorrow : false
                        return (
                            <TableRow
                                key={item.id}
                                className={cn(
                                    index % 2 === 0 ? "bg-background" : "bg-muted/30",
                                    isExpiring && "bg-red-50 hover:bg-red-100 dark:bg-red-900/20"
                                )}
                            >
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell>{item.minStock}</TableCell>
                                <TableCell className={cn(
                                    isLowStock && "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200 font-bold"
                                )}>{item.currentStock}</TableCell>
                                <TableCell>{item.expiresAt?.toLocaleDateString("pt-BR") || "-"}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.responsible}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.lastCountAt.toLocaleDateString("pt-BR")}</TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}

