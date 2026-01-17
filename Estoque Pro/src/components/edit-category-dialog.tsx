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
import { Edit } from "lucide-react"

interface EditCategoryDialogProps {
    category: { id: string; name: string }
    trigger?: React.ReactNode
}

export function EditCategoryDialog({ category, trigger }: EditCategoryDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [name, setName] = React.useState(category.name)
    const [isLoading, setIsLoading] = React.useState(false)
    const { updateCategory } = useStock()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name.trim()) return

        setIsLoading(true)

        try {
            await updateCategory(category.id, name.trim())
            setOpen(false)
        } catch (error) {
            console.error("Failed to update category", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle className="text-foreground">Editar Categoria</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Atualize o nome da categoria.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="edit-cat-name" className="text-right text-foreground">
                                Nome
                            </Label>
                            <Input
                                id="edit-cat-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
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
                            {isLoading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
