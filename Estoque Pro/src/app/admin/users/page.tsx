import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { UserManagementContent } from "@/components/user-management-content"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Gestão de Usuários - ChefControl",
    description: "Gerencie os usuários do sistema.",
}

export default async function UsersPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

    // Check admin access
    if (!context.isAdmin) {
        return (
            <div className="flex h-screen w-full items-center justify-center flex-col gap-4">
                <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
                <p>Apenas administradores podem acessar esta página.</p>
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
                    <p className="text-gray-500 mt-1">Gerencie os usuários do sistema.</p>
                </div>
                <Card className="bg-white">
                    <CardHeader>
                        <CardTitle>Lista de Usuários</CardTitle>
                        <CardDescription>Todos os usuários cadastrados no sistema.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <UserManagementContent currentUserEmail={context.userEmail} isAdmin={context.isAdmin || context.isSuperAdmin} />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
