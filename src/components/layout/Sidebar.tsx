"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export const navItems = [
    {
        name: "Dashboard",
        href: "/dashboard",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
    },
    {
        name: "Meta Ads",
        href: "/meta-ads",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
            </svg>
        ),
        color: "text-blue-500",
    },
    {
        name: "Google Ads",
        href: "/google-ads",
        icon: (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
        ),
        color: "text-red-500",
    },
    {
        name: "Analytics",
        href: "/analytics",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        color: "text-orange-500",
    },
    {
        name: "Configurações",
        href: "/settings",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
    {
        name: "Logs",
        href: "/admin/logs",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        color: "text-gray-500",
    },
    {
        name: "Empresas",
        href: "/admin/organizations",
        icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        color: "text-purple-600",
        adminOnly: true,
    },
];

interface SidebarProps {
    collapsed: boolean;
    setCollapsed: (v: boolean) => void;
    isMobileOpen: boolean;
    setIsMobileOpen: (v: boolean) => void;
    isSuperAdmin?: boolean;
}

export default function Sidebar({ collapsed, setCollapsed, isMobileOpen, setIsMobileOpen, isSuperAdmin = false }: SidebarProps) {
    const pathname = usePathname();

    return (
        <>
            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-0 z-50 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white flex flex-col transition-all duration-300",
                    collapsed ? "w-16" : "w-64",
                    // Mobile: fixed off-screen if closed, slide in if open
                    "md:translate-x-0",
                    isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
                    {!collapsed && (
                        <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-500 bg-clip-text text-transparent truncate">
                            HyperDash
                        </h1>
                    )}

                    {/* Desktop Toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-500 dark:text-gray-400"
                    >
                        <svg
                            className={cn("w-5 h-5 transition-transform", collapsed ? "rotate-180" : "")}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Mobile Close */}
                    <button
                        onClick={() => setIsMobileOpen(false)}
                        className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition text-gray-500 dark:text-gray-400"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 overflow-y-auto">
                    <ul className="space-y-1 px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.name === "Meta Ads" && pathname.startsWith("/meta-ads"));

                            // Filter admin items
                            if ((item as any).adminOnly && !isSuperAdmin) return null;

                            // Special case for Meta Ads Submenu
                            if (item.name === "Meta Ads") {
                                return (
                                    <li key={item.href} className="space-y-1">
                                        <div
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all cursor-pointer group",
                                                isActive
                                                    ? "bg-blue-600/10 text-blue-500"
                                                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                            )}
                                            onClick={() => !collapsed && setCollapsed(false)} // Expand if collapsed
                                        >
                                            <span className={item.color && !isActive ? item.color : "text-blue-500"}>
                                                {item.icon}
                                            </span>
                                            {!collapsed && (
                                                <div className="flex-1 flex items-center justify-between">
                                                    <span className="font-medium">Meta Ads</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Submenu */}
                                        {!collapsed && (
                                            <div className="pl-10 space-y-1">
                                                <Link
                                                    href="/meta-ads/ecommerce"
                                                    onClick={() => setIsMobileOpen(false)}
                                                    className={cn(
                                                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                                                        pathname === "/meta-ads/ecommerce" || pathname === "/meta-ads"
                                                            ? "bg-blue-600 text-white font-medium"
                                                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    E-commerce
                                                </Link>
                                                <Link
                                                    href="/meta-ads/captacao"
                                                    onClick={() => setIsMobileOpen(false)}
                                                    className={cn(
                                                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                                                        pathname === "/meta-ads/captacao"
                                                            ? "bg-blue-600 text-white font-medium"
                                                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    Captação
                                                </Link>
                                                <Link
                                                    href="/meta-ads/launch"
                                                    onClick={() => setIsMobileOpen(false)}
                                                    className={cn(
                                                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                                                        pathname === "/meta-ads/launch"
                                                            ? "bg-blue-600 text-white font-medium"
                                                            : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                                                    )}
                                                >
                                                    Lançamento
                                                </Link>
                                            </div>
                                        )}
                                    </li>
                                );
                            }

                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        onClick={() => setIsMobileOpen(false)} // Close on mobile click
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                            isActive
                                                ? "bg-blue-600 text-white"
                                                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                        )}
                                    >
                                        <span className={item.color && !isActive ? item.color : ""}>
                                            {item.icon}
                                        </span>
                                        {!collapsed && <span className="font-medium">{item.name}</span>}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    {!collapsed && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                            <p>HyperDash v2.0</p>
                            <p>Multi-tenant BI SaaS</p>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
