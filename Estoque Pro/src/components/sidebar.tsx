"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@stackframe/stack"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Package,
    ClipboardList,
    Settings,
    LogOut,
    Menu,
    X,
    History,
    ShoppingCart,
    Building2,
    Users,
    GraduationCap,
    Grid3X3,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStock } from "@/context/stock-context"

interface NavItem {
    name: string
    href: string
    icon: React.ElementType
    adminOnly?: boolean
    superAdminOnly?: boolean
}

const navigation: NavItem[] = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Gestão de Estoque", href: "/admin/inventory", icon: Package, adminOnly: true },
    { name: "Preenchimento", href: "/stock-entry", icon: ClipboardList },
    { name: "Requisição de Compra", href: "/purchase-request", icon: ShoppingCart },
    { name: "Histórico", href: "/history", icon: History },
    { name: "Configurações", href: "/settings", icon: Settings, adminOnly: true },
    { name: "Mini Curso", href: "/mini-course", icon: GraduationCap },
    // Super Admin Only
    { name: "Empresas", href: "/super-admin/organizations", icon: Building2, superAdminOnly: true },
    { name: "Todos Usuários", href: "/super-admin/users", icon: Users, superAdminOnly: true },
]

interface SidebarProps {
    userName?: string
    userRole?: string
    isAdmin?: boolean
    isSuperAdmin?: boolean
}

// Componente de Logout que usa Stack Auth
function LogoutButton() {
    const [isLoading, setIsLoading] = React.useState(false)
    const user = useUser()
    const router = useRouter()

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            if (user) {
                await user.signOut()
            }
            // Redirecionar para a landing page
            router.push("/")
        } catch (error) {
            console.error("Erro ao fazer logout:", error)
            router.push("/")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 mt-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50 w-full"
        >
            <LogOut className="w-4 h-4" />
            {isLoading ? "Saindo..." : "Sair"}
        </button>
    )
}

export function Sidebar({ userName = "Admin User", userRole = "Administrador", isAdmin = true, isSuperAdmin = false }: SidebarProps) {
    const pathname = usePathname()
    const { settings } = useStock()
    const [isMobileOpen, setIsMobileOpen] = React.useState(false)

    // Filter navigation based on role and business type
    const filteredNavigation = navigation.filter(item => {
        // Super admin sees everything
        if (isSuperAdmin) return true

        // Super admin only items hidden from regular users
        if (item.superAdminOnly) return false

        // Admin only items shown to admins
        if (isAdmin) return true

        // Regular users (Staff) don't see adminOnly items
        if (item.adminOnly) return false

        return true
    })

    // Add Vestuario specific link
    if (settings.businessType === "VESTUARIO") {
        const entryIndex = filteredNavigation.findIndex(n => n.href === "/stock-entry")
        if (entryIndex >= 0) {
            filteredNavigation.splice(entryIndex + 1, 0, {
                name: "Entrada em Grade",
                href: "/stock-entry-grid",
                icon: Grid3X3
            })
        }
    }

    const displayName = settings.ownerName || userName
    const companyName = settings.companyName || "Estoque Pro"

    const SidebarContent = () => (
        <div className="flex flex-col h-full">
            {/* Logo - Fixed at top */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10 flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                    <Package className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-lg">{companyName}</h1>
                    <p className="text-xs text-gray-400">Controle de Estoque</p>
                </div>
            </div>

            {/* Navigation - Scrollable */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto min-h-0">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4 px-2">Navegação</p>
                <ul className="space-y-1">
                    {filteredNavigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                                        isActive
                                            ? "bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg"
                                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {item.name}
                                </Link>
                            </li>
                        )
                    })}
                </ul>
            </nav>

            {/* User Section - Fixed at bottom */}
            <div className="border-t border-white/10 p-4 flex-shrink-0">
                <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-sm font-bold">
                        {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{displayName}</p>
                        <p className="text-xs text-gray-400">{userRole}</p>
                    </div>
                </div>
                <LogoutButton />
            </div>
        </div>
    )

    return (
        <>
            {/* Mobile Menu Button */}
            <Button
                variant="ghost"
                size="icon"
                className="fixed top-4 left-4 z-50 lg:hidden bg-[#1a1a2e] text-white hover:bg-[#2a2a4e]"
                onClick={() => setIsMobileOpen(!isMobileOpen)}
            >
                {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 z-40 h-[100dvh] w-64 bg-[#1a1a2e] text-white flex flex-col transition-transform duration-300 lg:hidden",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 bg-[#1a1a2e] text-white flex-col">
                <SidebarContent />
            </aside>
        </>
    )
}
