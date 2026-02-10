"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Topbar from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";

type Props = {
    children: React.ReactNode;
    userName: string;
    userImage: string | null;
    isSuperAdmin?: boolean;
    metaDashboardType?: string;
};

export default function DashboardShell({ children, userName, userImage, isSuperAdmin = false, metaDashboardType }: Props) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Sidebar
                collapsed={isSidebarCollapsed}
                setCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileOpen}
                setIsMobileOpen={setIsMobileOpen}
                isSuperAdmin={isSuperAdmin}
                metaDashboardType={metaDashboardType}
            />

            <div
                className={cn(
                    "transition-all duration-300 min-h-screen flex flex-col",
                    isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
                )}
            >
                <div className="sticky top-0 z-30">
                    <Topbar
                        userName={userName}
                        userImage={userImage}
                        onMenuClick={() => setIsMobileOpen(!isMobileOpen)}
                    />
                </div>
                <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
                    {children}
                </main>
            </div>
        </div>
    );
}
