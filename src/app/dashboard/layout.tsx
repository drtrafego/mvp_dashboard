import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function DashboardLayout({
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

    return (
        <DashboardShell
            userName={session.user?.name || "Usuário"}
            userImage={session.user?.image || null}
            isSuperAdmin={!!isSuperAdmin}
        >
            {children}
        </DashboardShell>
    );
}
