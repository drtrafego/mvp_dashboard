
import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import { getAnalyticsMetrics } from "@/server/actions/analytics";
import { DebugControls } from "../debug-meta/debug-client";
import { subDays } from "date-fns";

export default async function DebugGA4Page() {
    const session = await auth();
    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session?.user?.email || ""),
    });

    const orgId = user?.organizationId || "no-org";

    // Date Ranges for Debugging
    const now = new Date();
    const last30DaysStart = subDays(now, 30);
    const last90DaysStart = subDays(now, 90);

    // 1. Check Raw Counts
    const counts = await biDb.select({
        period: sql<string>`'Last 30 Days'`,
        count: sql<number>`count(*)`
    })
        .from(campaignMetrics)
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            gte(campaignMetrics.date, last30DaysStart)
        ));

    // 2. Fetch recent raw rows
    const rawMetrics = await biDb.select({
        date: campaignMetrics.date,
        campaign: campaignMetrics.campaignName,
        sessions: campaignMetrics.sessions,
        users: campaignMetrics.activeUsers,
        conversions: campaignMetrics.conversions,
    })
        .from(campaignMetrics)
        .where(eq(campaignMetrics.organizationId, orgId))
        .orderBy(desc(campaignMetrics.date))
        .limit(50);

    // 3. Action Result (Test the actual function used in Dashboard)
    let actionResult = null;
    let actionError = null;
    try {
        actionResult = await getAnalyticsMetrics();
    } catch (e: any) {
        actionError = e.message;
    }

    return (
        <div className="p-10 space-y-8 font-mono text-sm min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
            <h1 className="text-2xl font-bold text-orange-600">🕵️‍♂️ Google Analytics Debugger (v2.1)</h1>

            {/* Environment Info */}
            <section className="border p-4 rounded bg-gray-50 dark:bg-gray-800">
                <h2 className="font-bold text-lg mb-2">1. Ambiente & Org</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div>User:</div><div className="font-bold">{session?.user?.email}</div>
                    <div>Org ID:</div><div className="font-bold">{orgId}</div>
                    <div>Data Server (UTC):</div><div>{new Date().toISOString()}</div>
                </div>
            </section>

            {/* Action Result */}
            <section className="border p-4 rounded bg-gray-50 dark:bg-gray-800">
                <h2 className="font-bold text-lg mb-2">2. Dados Processados (Dashboard Action)</h2>
                {actionError ? (
                    <div className="text-red-500 font-bold">Erro: {actionError}</div>
                ) : (
                    <div>
                        <div className="grid grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-100 p-2 rounded dark:bg-blue-900">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</div>
                                <div className="text-xl font-bold">{actionResult?.totals.sessions}</div>
                            </div>
                            <div className="bg-green-100 p-2 rounded dark:bg-green-900">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Total Users</div>
                                <div className="text-xl font-bold">{actionResult?.totals.users}</div>
                            </div>
                            <div className="bg-yellow-100 p-2 rounded dark:bg-yellow-900">
                                <div className="text-xs text-gray-500 dark:text-gray-400">Rows Found (Daily)</div>
                                <div className="text-xl font-bold">{actionResult?.daily.length}</div>
                            </div>
                        </div>
                        <details>
                            <summary className="cursor-pointer text-blue-500">Ver JSON Completo</summary>
                            <pre className="mt-2 bg-gray-100 dark:bg-black p-2 rounded overflow-auto max-h-60 text-xs">
                                {JSON.stringify(actionResult, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}
            </section>

            {/* Raw Data Table */}
            <section className="border p-4 rounded bg-gray-50 dark:bg-gray-800">
                <h2 className="font-bold text-lg mb-2">3. Dados Brutos (Últimos 50 registros)</h2>
                <div className="mb-2 text-xs text-gray-500">
                    Isso mostra o que está DIRETAMENTE no banco de dados, sem filtros de data do dashboard.
                </div>
                {rawMetrics.length === 0 ? (
                    <div className="text-red-500 font-bold p-4 border border-red-200 bg-red-50 rounded">
                        ❌ NENHUM DADO ENCONTRADO NO BANCO!
                        <br />
                        A sincronização não deve ter rodado ou falhou.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-gray-200 dark:bg-gray-700">
                                    <th className="p-2 border dark:border-gray-600">Data (UTC)</th>
                                    <th className="p-2 border dark:border-gray-600">Date Local Estimate</th>
                                    <th className="p-2 border dark:border-gray-600">Campaign</th>
                                    <th className="p-2 border dark:border-gray-600">Sessions</th>
                                    <th className="p-2 border dark:border-gray-600">Users</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rawMetrics.map((m, i) => (
                                    <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="p-2 border dark:border-gray-600">{m.date ? new Date(m.date).toISOString() : 'N/A'}</td>
                                        <td className="p-2 border dark:border-gray-600">{m.date ? new Date(m.date).toLocaleDateString() : 'N/A'}</td>
                                        <td className="p-2 border dark:border-gray-600 truncate max-w-[200px]">{m.campaign}</td>
                                        <td className="p-2 border dark:border-gray-600">{m.sessions}</td>
                                        <td className="p-2 border dark:border-gray-600">{m.users}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            <section className="border p-4 rounded bg-blue-50 dark:bg-blue-900/20">
                <h2 className="font-bold text-lg mb-2">⚡ Ações de Reparo</h2>
                <DebugControls />
            </section>

            <div className="flex justify-between">
                <a href="/analytics" className="text-blue-600 hover:underline">← Voltar para Analytics</a>
            </div>
        </div>
    );
}
