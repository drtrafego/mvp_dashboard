import { getAuthenticatedUser } from "@/lib/auth-helper";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";

export default async function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthenticatedUser();

    if (!user) {
        redirect("/auth/signin");
    }

    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = user.email && adminEmails.includes(user.email);

    const settings = await getAdAccountSettings();

    return (
        <DashboardShell
            userName={user.name || "Usuário"}
            userImage={user.image || null}
            isSuperAdmin={!!isSuperAdmin}
            metaDashboardType={settings?.metaDashboardType || "ecommerce"}
        >
            {children}
        </DashboardShell>
    );
}
