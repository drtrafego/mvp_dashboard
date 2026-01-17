import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { PurchaseRequestContent } from "@/components/purchase-request-content"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Requisição de Compra - Estoque Pro",
    description: "Gerencie requisições de compra.",
}

export default async function PurchaseRequestPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
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
            <PurchaseRequestContent />
        </AppLayout>
    )
}
