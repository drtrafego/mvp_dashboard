
import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMetaAdsMetrics } from "@/server/actions/metrics";
import { DebugControls } from "./debug-client";

export default async function DebugMetaPage() {
    const session = await auth();
    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session?.user?.email || ""),
    });

    // 1. Raw Data Check
    const rawMetrics = await biDb.select()
        .from(campaignMetrics)
        .where(eq(campaignMetrics.organizationId, user?.organizationId || "no-org"))
        .orderBy(desc(campaignMetrics.date))
        .limit(20);

    // 2. Action Result
    let actionResult = null;
    let actionError = null;
    try {
        actionResult = await getMetaAdsMetrics(90); // Updated to 90 to match new default
    } catch (e: any) {
        actionError = e.message;
    }

    // 3. DB Check
    const dbUrl = process.env.BI_DATABASE_URL || "MISSING";
    const maskedDb = dbUrl.length > 20 ? dbUrl.substring(0, 15) + "..." : dbUrl;

    return (
        <div className="p-10 space-y-8 font-mono text-sm min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <h1 className="text-2xl font-bold text-red-600">🕵️‍♂️ Meta Ads Debugger (V3)</h1>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">1. Sessão & Ambiente</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div>Email:</div>
                    <div className="font-bold">{session?.user?.email}</div>
                    <div>Org ID (Session):</div>
                    <div className="font-bold">{user?.organizationId}</div>
                    <div>Server Time:</div>
                    <div>{new Date().toString()}</div>
                    <div>DB Connection:</div>
                    <div className={dbUrl === "MISSING" ? "text-red-600 font-bold" : "text-green-600"}>
                        {maskedDb}
                    </div>
                </div>
            </section>

            <section className="border p-4 rounded bg-blue-50">
                <h2 className="font-bold text-lg mb-2">⚡ Ações de Reparo (Force Sync)</h2>
                <DebugControls />
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">2. Banco de Dados (Raw - Últimos 20)</h2>
                <p className="mb-2">Total de registros encontrados: {rawMetrics.length}</p>
                {rawMetrics.length === 0 ? (
                    <div className="text-red-500 font-bold">❌ NENHUM DADO BRUTO ENCONTRADO PARA ESTA ORG!</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-1 border">Date</th>
                                <th className="p-1 border">Campaign</th>
                                <th className="p-1 border">Impr</th>
                                <th className="p-1 border">Spend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rawMetrics.map((m: any) => (
                                <tr key={m.id}>
                                    <td className="p-1 border">{new Date(m.date).toISOString().split('T')[0]}</td>
                                    <td className="p-1 border">{m.campaignName?.substring(0, 20)}...</td>
                                    <td className="p-1 border">{m.impressions}</td>
                                    <td className="p-1 border">{m.spend}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">3. Resultado do Dashboard (90 dias)</h2>
                {actionError ? (
                    <div className="text-red-600 font-bold">Erro: {actionError}</div>
                ) : (
                    <pre className="bg-white p-2 border rounded overflow-auto max-h-60">
                        {JSON.stringify(actionResult?.totals || {}, null, 2)}
                    </pre>
                )}
                <div className="mt-2">
                    <strong>Campanhas Retornadas:</strong> {actionResult?.campaigns?.length || 0}
                </div>
            </section>

            <a href="/meta-ads" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Voltar para Dashboard
            </a>
        </div>
    );
}
