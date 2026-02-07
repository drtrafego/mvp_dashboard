
import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { getMetaAdsMetrics } from "@/server/actions/metrics";

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
        .limit(10);

    // 2. Action Result
    let actionResult = null;
    let actionError = null;
    try {
        actionResult = await getMetaAdsMetrics(30);
    } catch (e: any) {
        actionError = e.message;
    }

    return (
        <div className="p-10 space-y-8 font-mono text-sm">
            <h1 className="text-2xl font-bold text-red-600">🕵️‍♂️ Meta Ads Debugger</h1>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">1. Sessão & Usuário</h2>
                <div className="grid grid-cols-2 gap-2">
                    <div>Email:</div>
                    <div className="font-bold">{session?.user?.email}</div>
                    <div>Org ID (Session):</div>
                    <div className="font-bold">{user?.organizationId}</div>
                    <div>Server Time:</div>
                    <div>{new Date().toString()}</div>
                </div>
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">2. Banco de Dados (Raw - Últimos 10)</h2>
                <p className="mb-2">Total de registros encontrados: {rawMetrics.length} (limitado a 10)</p>
                {rawMetrics.length === 0 ? (
                    <div className="text-red-500 font-bold">❌ NENHUM DADO BRUTO ENCONTRADO PARA ESTA ORG!</div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="p-1 border">Date</th>
                                <th className="p-1 border">Campaign</th>
                                <th className="p-1 border">Impressions</th>
                                <th className="p-1 border">Spend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rawMetrics.map((m: any) => (
                                <tr key={m.id}>
                                    <td className="p-1 border">{new Date(m.date).toISOString().split('T')[0]}</td>
                                    <td className="p-1 border">{m.campaignName.substring(0, 20)}...</td>
                                    <td className="p-1 border">{m.impressions}</td>
                                    <td className="p-1 border">{m.spend}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="border p-4 rounded bg-gray-50">
                <h2 className="font-bold text-lg mb-2">3. Resultado da API do Dashboard (getMetaAdsMetrics)</h2>
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

            <section className="border p-4 rounded bg-yellow-50">
                <h2 className="font-bold text-lg mb-2">Diagnosis</h2>
                <ul className="list-disc ml-5 space-y-1">
                    <li>Se <strong>(1)</strong> estiver errado, você está na Org errada.</li>
                    <li>Se <strong>(2)</strong> estiver vazio, o banco está vazio (o script force-sync falhou ou escreveu em outra Org).</li>
                    <li>Se <strong>(2)</strong> tem dados mas <strong>(3)</strong> está zerado, é erro de FILTRO DE DATA (Data < 30 dias).</li>
                </ul>
            </section>

            <a href="/meta-ads" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Voltar para Dashboard
            </a>
        </div>
    );
}
