import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import AdminUsersClient from "./client"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Usuários - Super Admin",
    description: "Gerencie todos os usuários do sistema.",
}

export default async function AdminUsersPage() {
    const context = await getTenantContext()

    if (!context || !context.isSuperAdmin) {
        redirect("/dashboard")
    }

    const userName = context.userName || "Super Admin"

    return (
        <AppLayout
            userName={userName}
            userRole="Super Administrador"
            isAdmin={true}
            isSuperAdmin={true}
        >
            <AdminUsersClient />
        </AppLayout>
    )
}
