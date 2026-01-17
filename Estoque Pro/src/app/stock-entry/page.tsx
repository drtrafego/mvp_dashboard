import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { StockEntryNew } from "@/components/stock-entry-new"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Preenchimento de Estoque - Estoque Pro",
    description: "Registre as contagens de estoque rapidamente.",
}

export default async function StockEntryPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

    const userName = context.userName || "Usuário"
    const userRole = context.isAdmin ? "ADMIN" : "STAFF"
    const displayRole = userRole === "ADMIN" ? "Administrador" : "Operador"

    return (
        <AppLayout
            userName={userName}
            userRole={displayRole}
            isAdmin={context.isAdmin}
            isSuperAdmin={context.isSuperAdmin}
        >
            <StockEntryNew userName={userName} userRole={userRole} />
        </AppLayout>
    )
}
