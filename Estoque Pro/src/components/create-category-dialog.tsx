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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStock } from "@/context/stock-context"

interface CreateCategoryDialogProps {
    onCategoryCreated: (category: { id: string; name: string }) => void
    trigger?: React.ReactNode
}

export function CreateCategoryDialog({ onCategoryCreated, trigger }: CreateCategoryDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [name, setName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const { addCategory } = useStock()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)

        try {
            await addCategory({ name: name.trim() })
            setName("")
            setOpen(false)
            if (onCategoryCreated) {
                // Pass a placeholder ID as the list updates via context
                onCategoryCreated({ id: "temp", name: name.trim() })
            }
        } catch (error) {
            console.error("Failed to create category", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant="outline">Adicionar Categoria</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Nova Categoria</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Crie uma nova categoria para organizar seus produtos.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right text-foreground">
                                Nome
                            </Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex: Proteínas, Laticínios..."
                                className="col-span-3 bg-background border-input text-foreground"
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isLoading || !name.trim()}>
                            {isLoading ? "Criando..." : "Criar Categoria"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
