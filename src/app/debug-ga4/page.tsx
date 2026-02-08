
import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { eq, desc, and } from "drizzle-orm";
// Verify if this action exists, otherwise we might need to create/import the correct one.
// Assuming getAnalyticsMetrics or similar exists, or we use raw queries.
import { getAnalyticsMetrics } from "@/server/actions/analytics"; // Placeholder, will verify import
import { DebugControls } from "../debug-meta/debug-client";

export default async function DebugGA4Page() {
    const session = await auth();
    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session?.user?.email || ""),
    });

    const orgId = user?.organizationId || "no-org";

    // 1. Raw Data Check (GA4 specific)
    // We need to join with integrations to ensure we are looking at GA4 data
    const rawMetrics = await biDb.select({
        date: campaignMetrics.date,
        campaign: campaignMetrics.campaignName,
        sessions: campaignMetrics.sessions,
        users: campaignMetrics.activeUsers,
        conversions: campaignMetrics.conversions,
        provider: integrations.provider
    })
        .from(campaignMetrics)
        .innerJoin(integrations, eq(campaignMetrics.integrationId, integrations.id))
        .where(
            and(
                eq(campaignMetrics.organizationId, orgId),
                eq(integrations.provider, "google_analytics")
            )
        )
        .orderBy(desc(campaignMetrics.date))
        .limit(20);

    // 2. Action Result
    let actionResult = null;
    let actionError = null;
    try {
        // Try to fetch via the official dashboard action if possible
        // If imports fail, we might comment this out or use a generic fetcher
        actionResult = await getAnalyticsMetrics();
    } catch (e: any) {
        actionError = e.message;
    }

    // 3. DB Check
    const dbUrl = process.env.BI_DATABASE_URL || "MISSING";
    const maskedDb = dbUrl.length > 20 ? dbUrl.substring(0, 15) + "..." : dbUrl;

    return (
        <div className="p-10 space-y-8 font-mono text-sm min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold text-orange-600">🕵️‍♂️ Google Analytics Debugger (GA4)</h1>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">1. Sessão & Ambiente</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div>Email:</div>
                    <div className="font-bold">{session?.user?.email}</div>
                    <div>Org ID:</div>
                    <div className="font-bold">{orgId}</div>
                    <div>DB:</div>
                    <div className={dbUrl === "MISSING" ? "text-red-600 font-bold" : "text-green-600"}>
                        {maskedDb}
                    </div>
                </div>
            </section>

            <section className="border p-4 rounded bg-blue-50">
                <h2 className="font-bold text-lg mb-2">⚡ Ações de Reparo</h2>
                <DebugControls />
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">2. Banco de Dados (Raw - Últimos 20 GA4)</h2>
                <p className="mb-2">Total de registros encontrados: {rawMetrics.length}</p>
                {rawMetrics.length === 0 ? (
                    <div className="text-red-500 font-bold">❌ NENHUM DADO GA4 ENCONTRADO! (Verifique se o sync rodou)</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-1 border">Date</th>
                                <th className="p-1 border">Campaign</th>
                                <th className="p-1 border">Sessions</th>
                                <th className="p-1 border">Users</th>
                                <th className="p-1 border">Conversions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rawMetrics.map((m: any, i: number) => (
                                <tr key={i}>
                                    <td className="p-1 border">{new Date(m.date).toISOString().split('T')[0]}</td>
                                    <td className="p-1 border">{m.campaign?.substring(0, 20)}...</td>
                                    <td className="p-1 border">{m.sessions}</td>
                                    <td className="p-1 border">{m.users}</td>
                                    <td className="p-1 border">{m.conversions}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">3. Resultado do Dashboard (90 dias)</h2>
                {actionError ? (
                    <div className="text-red-600 font-bold">Erro na Action: {actionError}</div>
                ) : (
                    <pre className="bg-white p-2 border rounded overflow-auto max-h-60">
                        {JSON.stringify(actionResult || {}, null, 2)}
                    </pre>
                )}
            </section>

            <a href="/analytics" className="inline-block bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                Voltar para Analytics
            </a>
        </div>
    );
}
