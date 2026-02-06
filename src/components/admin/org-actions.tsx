"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteOrganization } from "@/server/actions/organizations";
import { Trash2, Pencil } from "lucide-react";
import { OrgDialog } from "./org-dialog";

export function OrgActions({ org }: { org: any }) {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        if (!confirm(`Tem certeza que deseja excluir a empresa "${org.name}"? Isso pode quebrar dados vinculados.`)) return;
        try {
            setLoading(true);
            await deleteOrganization(org.id);
            // Revalidate happens in server action, but we might need router refresh if client navigation needs it?
            // Server action revalidatePath handles it.
        } catch (e) {
            alert("Erro ao excluir");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex justify-end gap-2">
            <OrgDialog
                mode="edit"
                org={org}
                trigger={
                    <Button variant="ghost" size="icon" title="Editar">
                        <Pencil className="h-4 w-4" />
                    </Button>
                }
            />
            <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleDelete}
                disabled={loading}
                title="Excluir"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    )
}
