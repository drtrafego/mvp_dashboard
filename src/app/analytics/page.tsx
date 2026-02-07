
import { getAnalyticsMetrics } from "@/server/actions/analytics";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";

export default async function AnalyticsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.ga4PropertyId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Center</h1>
                    <p className="text-gray-500">Comportamento do usuário e fluxo de tráfego</p>
                </div>
                {isConnected && (
                    <span className="text-sm text-gray-500">
                        Property ID: {settings?.ga4PropertyId}
                    </span>
                )}
            </div>

            {!isConnected ? (
                <NotConnectedState />
            ) : (
                <AnalyticsContent />
            )}
        </div>
    );
}

function NotConnectedState() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Google Analytics não configurado</h2>
            <p className="text-gray-600 mb-6">Configure seu GA4 Property ID para ver dados de comportamento.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition"
            >
                Ir para Configurações
            </a>
        </div>
    );
}

async function AnalyticsContent() {
    // FETCH REAL DATA (90 Days)
    const { totals, sources } = await getAnalyticsMetrics(90);

    const fmtNum = (val: number) => new Intl.NumberFormat('pt-BR').format(val);

    return (
        <div className="space-y-6">
            {/* GA4 Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Sessões" value={fmtNum(totals.sessions)} subtitle="Últimos 90 dias" color="orange" />
                <MetricCard title="Usuários Ativos" value={fmtNum(totals.users)} subtitle="Visitantes únicos" color="blue" />
                <MetricCard title="Conversões" value={fmtNum(totals.conversions)} subtitle="Eventos principais" color="green" />
                <MetricCard title="Sessões/Usuário" value={totals.users > 0 ? (totals.sessions / totals.users).toFixed(2) : "0"} subtitle="Média" color="purple" />
            </div>

            {/* Traffic Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Fontes de Tráfego (Campanhas)</h3>
                    {sources.length === 0 ? (
                        <p className="text-gray-500">Nenhum dado de origem encontrado.</p>
                    ) : (
                        <div className="space-y-3">
                            {sources.slice(0, 5).map((s, i) => (
                                <TrafficSourceBar
                                    key={i}
                                    source={s.name}
                                    sessions={s.sessions}
                                    percentage={s.percentage}
                                    color={["blue", "green", "purple", "orange", "gray"][i % 5]}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Dispositivos</h3>
                    <div className="flex items-center justify-center h-40 text-gray-400">
                        Dados de dispositivo não sincronizados ainda.
                    </div>
                </div>
            </div>
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
