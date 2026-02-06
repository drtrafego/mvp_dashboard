"use client";

import { useState } from "react";
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

type OrgDialogProps = {
    trigger?: React.ReactNode;
    mode: "create" | "edit";
    org?: {
        id: string;
        name: string;
        slug: string;
    };
    onSuccess?: () => void;
};

export function OrgDialog({ trigger, mode, org, onSuccess }: OrgDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState(org?.name || "");
    const [slug, setSlug] = useState(org?.slug || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        try {
            setLoading(true);
            setError("");

            if (mode === "create") {
                await createOrganization({ name, slug });
            } else {
                if (org) {
                    await updateOrganization(org.id, { name, slug });
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
        // Auto-generate slug only if creating and user hasn't manually edited slug massively (simple heuristic: empty or matches previous)
        if (mode === "create") {
            setSlug(val.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || <Button variant={mode === "create" ? "default" : "outline"}>{mode === "create" ? "Nova Empresa" : "Editar"}</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{mode === "create" ? "Nova Empresa" : "Editar Empresa"}</DialogTitle>
                    <DialogDescription>
                        {mode === "create" ? "Crie uma nova organização no sistema." : "Altere os dados da empresa."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
