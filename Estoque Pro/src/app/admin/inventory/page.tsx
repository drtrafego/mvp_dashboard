import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { InventoryManagerNew } from "@/components/inventory-manager-new"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Gestão de Estoque - ChefControl",
    description: "Gerencie o estoque do restaurante.",
}

export default async function AdminInventoryPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

    // All authenticated users with canManageStock can access inventory
    if (!context.canManageStock) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p>Você não tem permissão para acessar esta página.</p>
            </div>
        )
    }

    const userName = context.userName || "Usuário"
    const displayRole = context.isSuperAdmin ? "Super Administrador"
        : context.isAdmin ? "Administrador"
            : "Operador"

    return (
        <AppLayout
            userName={userName}
            userRole={displayRole}
            isAdmin={context.isAdmin}
            isSuperAdmin={context.isSuperAdmin}
        >
            <InventoryManagerNew isAdmin={context.canManageStock} />
        </AppLayout>
    )
}

