import { auth } from "@/server/auth";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import { getAggregatedMetrics, AggregatedMetrics } from "@/server/actions/metrics-aggregated";
import DashboardAggregated from "./dashboard-aggregated";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
    const settings = await getAdAccountSettings();
    const params = await searchParams;

    const hasSettings = Boolean(
        settings?.googleAdsCustomerId ||
        settings?.facebookAdAccountId ||
        settings?.ga4PropertyId
    );

    let metrics: AggregatedMetrics | null = null;
    let error: string | null = null;

    if (hasSettings) {
        try {
            metrics = await getAggregatedMetrics(params.from, params.to);
        } catch (e: any) {
            console.error("Error fetching aggregated metrics:", e);
            error = e.message;
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Geral</h1>
                    <p className="text-gray-500 dark:text-gray-400">Visão consolidada de todas as plataformas</p>
                </div>
            </div>

            {!hasSettings ? (
                <EmptyState />
            ) : error ? (
                <div className="p-8 text-center bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
                    Erro ao carregar dados: {error}
                </div>
            ) : metrics ? (
                <DashboardAggregated metrics={metrics} settings={settings} />
            ) : (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Configure suas contas</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Conecte Google Ads, Meta Ads e GA4 para ver métricas.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
                Configurar Contas
            </a>
        </div>
    );
}
