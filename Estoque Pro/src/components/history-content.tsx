"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useStock } from "@/context/stock-context"
import { History, ArrowUp, ArrowDown, Minus } from "lucide-react"

export function HistoryContent() {
    const { history } = useStock()

    const getChangeIcon = (prev: number, curr: number) => {
        if (curr > prev) return <ArrowUp className="w-4 h-4 text-green-600 dark:text-green-400" />
        if (curr < prev) return <ArrowDown className="w-4 h-4 text-red-600 dark:text-red-400" />
        return <Minus className="w-4 h-4 text-muted-foreground" />
    }

    const getChangeBadge = (prev: number, curr: number) => {
        const diff = curr - prev
        if (diff > 0) return <Badge className="bg-green-600">+{diff}</Badge>
        if (diff < 0) return <Badge className="bg-red-600">{diff}</Badge>
        return <Badge className="bg-gray-500">0</Badge>
    }

    const formatDate = (timestamp: string) => {
        const date = new Date(timestamp)
        return date.toLocaleDateString("pt-BR") + " " + date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Histórico de Alterações</h1>
                <p className="text-muted-foreground mt-1">Registro de todas as alterações de estoque</p>
            </div>

            {/* History Table */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <History className="w-5 h-5 text-muted-foreground" />
                        <CardTitle className="text-foreground">Últimas Alterações</CardTitle>
                    </div>
                    <CardDescription>
                        Mostrando as {history.length} alterações mais recentes
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {history.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Nenhuma alteração registrada ainda.</p>
                            <p className="text-sm text-muted-foreground mt-2">As alterações aparecerão aqui quando você atualizar o estoque.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted">
                                    <TableRow className="border-border hover:bg-transparent">
                                        <TableHead className="text-muted-foreground">Data/Hora</TableHead>
                                        <TableHead className="text-muted-foreground">Produto</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Anterior</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Novo</TableHead>
                                        <TableHead className="text-muted-foreground text-center">Diferença</TableHead>
                                        <TableHead className="text-muted-foreground">Responsável</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {history.map((entry, index) => (
                                        <TableRow
                                            key={entry.id}
                                            className={`border-border ${index % 2 === 0 ? 'bg-card' : 'bg-muted/30'}`}
                                        >
                                            <TableCell className="text-muted-foreground whitespace-nowrap">
                                                {formatDate(entry.timestamp)}
                                            </TableCell>
                                            <TableCell className="font-medium text-foreground">
                                                {entry.productName}
                                            </TableCell>
                                            <TableCell className="text-center text-muted-foreground">
                                                {entry.previousQuantity}
                                            </TableCell>
                                            <TableCell className="text-center text-foreground font-medium">
                                                {entry.newQuantity}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {getChangeIcon(entry.previousQuantity, entry.newQuantity)}
                                                    {getChangeBadge(entry.previousQuantity, entry.newQuantity)}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {entry.responsible}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
