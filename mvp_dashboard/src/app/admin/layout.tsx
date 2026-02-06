import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import AdminShell from "@/components/layout/AdminShell";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = session?.user?.email && adminEmails.includes(session.user.email);

    if (!isSuperAdmin) {
        redirect("/dashboard");
    }

    return (
        <AdminShell>
            {children}
        </AdminShell>
    );
}
