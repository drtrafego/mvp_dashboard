import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { HistoryContent } from "@/components/history-content"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Histórico - ChefControl",
    description: "Histórico de alterações de estoque.",
}

export default async function HistoryPage() {
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
            <HistoryContent />
        </AppLayout>
    )
}
