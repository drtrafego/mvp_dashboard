"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function AdminShell({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Admin Sidebar */}
            <aside
                className={cn(
                    "w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-50 transition-transform duration-300",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                )}
            >
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">
                            HyperDash Admin
                        </h1>
                        <p className="text-xs text-slate-400 mt-1">Super Admin Panel</p>
                    </div>
                    {/* Mobile Close */}
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="p-4 space-y-2">
                    <Link
                        href="/admin"
                        onClick={() => setIsSidebarOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        🏢 Organizações
                    </Link>
                    <Link
                        href="/admin/logs"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
                    >
                        📜 Logs do Sistema
                    </Link>
                    <Link
                        href="/dashboard"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:text-white mt-8 border-t border-slate-800 pt-8"
                    >
                        ← Voltar ao App
                    </Link>
                </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen w-full transition-all duration-300">
                {/* Mobile Header */}
                <header className="md:hidden h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 justify-between sticky top-0 z-30">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <span className="font-bold text-gray-900 dark:text-white">Admin</span>
                    <div className="w-8"></div> {/* Spacer */}
                </header>


                <main className="p-4 md:p-8 pt-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
