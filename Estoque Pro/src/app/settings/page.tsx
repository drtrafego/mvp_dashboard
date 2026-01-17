import { Metadata } from "next"
import React from "react"
import { redirect } from "next/navigation"
import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { SettingsContent } from "@/components/settings-content"

// Força renderização dinâmica (usa cookies para autenticação)
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    title: "Configurações - Estoque Pro",
    description: "Gerencie as configurações do sistema.",
}

export default async function SettingsPage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

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
            <React.Suspense fallback={<div className="p-8">Carregando configurações...</div>}>
                <SettingsContent currentUserEmail={context.userEmail} isAdmin={context.isAdmin} />
            </React.Suspense>
        </AppLayout>
    )
}
