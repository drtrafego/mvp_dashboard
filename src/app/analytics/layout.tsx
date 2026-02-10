import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";

export default async function AnalyticsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    if (!session) {
        redirect("/auth/signin");
    }

    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = session.user?.email && adminEmails.includes(session.user.email);
    const settings = await getAdAccountSettings();

    return (
        <DashboardShell
            userName={session.user?.name || "Usuário"}
            userImage={session.user?.image || null}
            isSuperAdmin={!!isSuperAdmin}
            metaDashboardType={settings?.metaDashboardType || "ecommerce"}
        >
            {children}
        </DashboardShell>
    );
}
