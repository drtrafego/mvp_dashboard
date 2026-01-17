import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import AdminOrganizationsClient from "./client" // Creating a client component for the logic

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Organizações - Super Admin",
    description: "Gerencie todas as empresas.",
}

export default async function AdminOrganizationsPage() {
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
            isSuperAdmin={true} // Explicitly true since we checked above
        >
            <AdminOrganizationsClient />
        </AppLayout>
    )
}
