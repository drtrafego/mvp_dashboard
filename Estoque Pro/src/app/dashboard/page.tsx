import { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { DashboardContent } from "@/components/dashboard-content"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Dashboard - Estoque Pro",
    description: "Painel de controle do estoque.",
}

export default async function DashboardPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

    // If user has no organization and is not a super admin, send to onboarding
    // if (!context.organizationId && !context.isSuperAdmin) {
    //     redirect("/onboarding")
    // }

    const userName = context.userName || "Usuário"
    const userRole = context.role === "SUPER_ADMIN" ? "Super Administrador"
        : context.role === "ADMIN" ? "Administrador"
            : "Operador"

    return (
        <AppLayout
            userName={userName}
            userRole={userRole}
            isAdmin={context.isAdmin}
            isSuperAdmin={context.isSuperAdmin}
        >
            <Suspense fallback={<div className="p-8 text-center text-slate-500">Carregando painel...</div>}>
                <DashboardContent userName={userName} />
            </Suspense>
        </AppLayout>
    )
}
