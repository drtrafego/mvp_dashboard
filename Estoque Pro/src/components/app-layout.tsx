"use client"

import { Sidebar } from "@/components/sidebar"
import { Package } from "lucide-react"

interface AppLayoutProps {
    children: React.ReactNode
    userName?: string
    userRole?: string
    isAdmin?: boolean
    isSuperAdmin?: boolean
}

export function AppLayout({ children, userName, userRole, isAdmin, isSuperAdmin }: AppLayoutProps) {
    // Default to admin for development until multi-tenant auth is fully set up
    const adminStatus = isAdmin ?? true
    const superAdminStatus = isSuperAdmin ?? false

    return (
        <div className="min-h-screen bg-background">
            <Sidebar
                userName={userName}
                userRole={userRole}
                isAdmin={adminStatus}
                isSuperAdmin={superAdminStatus}
            />

            {/* Main Content */}
            <div className="lg:ml-64">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 bg-card border-b border-border px-4 lg:px-8 py-4">
                    <div className="flex items-center gap-3 ml-12 lg:ml-0">
                        <Package className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Sistema de Controle de Estoque</span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
