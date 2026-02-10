import { getAllOrganizations, isSuperAdmin } from "@/server/actions/super-admin";
import { auth } from "@/server/auth";
import { users, adAccountSettings } from "@/server/db/schema";
import { biDb } from "@/server/db";
import { eq } from "drizzle-orm";
import { OrgSwitcher } from "./org-switcher";
import { OrgDialog } from "@/components/admin/org-dialog";
import { OrgActions } from "@/components/admin/org-actions";
import { redirect } from "next/navigation";

export default async function AdminOrganizationsPage() {
    if (!(await isSuperAdmin())) {
        redirect("/dashboard");
    }

    const organizations = await getAllOrganizations();
    const session = await auth();

    let currentOrgId = "";
    if (session?.user?.id) {
        const u = await biDb.query.users.findFirst({ where: eq(users.id, session.user.id) });
        currentOrgId = u?.organizationId || "";
    }

    // Fetch metaDashboardType for each org
    const allSettings = await biDb.select({
        organizationId: adAccountSettings.organizationId,
        metaDashboardType: adAccountSettings.metaDashboardType,
    }).from(adAccountSettings);

    const settingsMap = new Map(allSettings.map(s => [s.organizationId, s.metaDashboardType || "ecommerce"]));

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Administração de Empresas</h1>
                <OrgDialog mode="create" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dashboard Meta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {organizations.map((org) => {
                            const dashType = settingsMap.get(org.id) || "ecommerce";
                            const dashLabel = dashType === "captacao" ? "Captação" : dashType === "lancamento" ? "Lançamento" : "E-commerce";
                            return (
                                <tr key={org.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {org.name}
                                        <div className="text-xs text-gray-400 font-normal">{org.slug}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                            {dashLabel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Ativo
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end items-center gap-2">
                                            <OrgSwitcher
                                                orgId={org.id}
                                                orgName={org.name || ""}
                                                currentOrgId={currentOrgId}
                                            />
                                            <OrgActions org={{ ...org, metaDashboardType: dashType }} />
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
