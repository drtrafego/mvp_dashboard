import { getAnalyticsMetrics } from "@/server/actions/analytics";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import AnalyticsDashboard from "./dashboard-analytics";

export default async function AnalyticsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.ga4PropertyId);

    // Fetch data regardless (metrics action handles empty/auth check internally or returns empty structure)
    // But for "Not Connected" state, we check settings.

    // We fetch data if connected
    let metrics = null;
    if (isConnected) {
        try {
            metrics = await getAnalyticsMetrics(90);
        } catch (e) {
            console.error("Failed to fetch analytics", e);
        }
    }

    return (
        <div className="min-h-screen bg-[#050505]">
            {!isConnected ? (
                <div className="p-8">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-2xl font-bold text-white">📊 Analytics Center</h1>
                                <p className="text-gray-500">Fluxo de tráfego e comportamento</p>
                            </div>
                        </div>
                        <NotConnectedState />
                    </div>
                </div>
            ) : (
                metrics ? (
                    <AnalyticsDashboard
                        totals={metrics.totals}
                        daily={metrics.daily}
                        sources={metrics.sources}
                        pages={metrics.pages}
                        osData={metrics.osData}
                        deviceData={metrics.deviceData}
                        weekData={metrics.weekData}
                        dateRangeLabel="Últimos 90 dias"
                    />
                ) : (
                    <div className="p-8 text-white">Carregando dados...</div>
                )
            )}
        </div>
    );
}

function NotConnectedState() {
    return (
        <div className="bg-[#0f111a] rounded-xl border border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-orange-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Analytics não configurado</h2>
            <p className="text-gray-400 mb-6">Configure seu GA4 Property ID para ver dados de comportamento.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
            >
                Ir para Configurações
            </a>
        </div>
    );
}
function MetricCard({
    title,
    value,
    subtitle,
    color,
}: {
    title: string;
    value: string;
    subtitle?: string;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        orange: "border-orange-500",
        green: "border-green-500",
        blue: "border-blue-500",
        purple: "border-purple-500",
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${colorClasses[color] || "border-gray-200"} p-4`}>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}

function TrafficSourceBar({
    source,
    sessions,
    percentage,
    color,
}: {
    source: string;
    sessions: number;
    percentage: number;
    color: string;
}) {
    const colorClasses: Record<string, string> = {
        red: "bg-red-500",
        blue: "bg-blue-500",
        gray: "bg-gray-400",
        green: "bg-green-500",
        purple: "bg-purple-500",
        orange: "bg-orange-500",
    };

    return (
        <div className="flex items-center gap-3">
            <div className="w-32 text-sm text-gray-700 truncate" title={source}>{source}</div>
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                    className={`h-full ${colorClasses[color] || "bg-gray-400"} rounded-full`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="w-16 text-sm text-gray-500 text-right">{sessions.toLocaleString()}</div>
        </div>
    );
}
