import { getAllOrganizations, isSuperAdmin } from "@/server/actions/super-admin";
import { auth } from "@/server/auth";
import { users } from "@/server/db/schema";
import { biDb } from "@/server/db";
import { eq } from "drizzle-orm";
import { OrgSwitcher } from "./org-switcher";
import { redirect } from "next/navigation";

export default async function AdminOrganizationsPage() {
    if (!(await isSuperAdmin())) {
        redirect("/dashboard");
    }

    const organizations = await getAllOrganizations();
    const session = await auth();

    // Get current org ID from user in DB to be sure
    let currentOrgId = "";
    if (session?.user?.id) {
        const u = await biDb.query.users.findFirst({ where: eq(users.id, session.user.id) });
        currentOrgId = u?.organizationId || "";
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Administração de Empresas</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {organizations.map((org) => (
                            <tr key={org.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                    {org.name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {org.id}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        Ativo
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <OrgSwitcher
                                        orgId={org.id}
                                        orgName={org.name || ""}
                                        currentOrgId={currentOrgId}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
