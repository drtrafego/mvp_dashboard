import { getAdAccountSettings } from "@/server/actions/ad-account-settings";

export default async function GoogleAdsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.googleAdsCustomerId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🔴 Google Ads Hub</h1>
                    <p className="text-gray-500">Análise de campanhas de busca e display</p>
                </div>
                {isConnected && (
                    <span className="text-sm text-gray-500">
                        Customer ID: {settings?.googleAdsCustomerId}
                    </span>
                )}
            </div>

            {!isConnected ? (
                <NotConnectedState />
            ) : (
                <GoogleAdsContent />
            )}
        </div>
    );
}

function NotConnectedState() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Google Ads não configurado</h2>
            <p className="text-gray-600 mb-6">Configure seu Customer ID para ver métricas.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
            >
                Ir para Configurações
            </a>
        </div>
    );
}

function GoogleAdsContent() {
    return (
        <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard title="CTR" value="0%" subtitle="Cliques / Impressões" color="red" />
                <MetricCard title="CPC Médio" value="R$ 0,00" color="orange" />
                <MetricCard title="Índice de Qualidade" value="-" subtitle="Média das keywords" color="yellow" />
                <MetricCard title="Imp. Share Lost (Budget)" value="0%" color="purple" />
                <MetricCard title="Imp. Share Lost (Rank)" value="0%" color="indigo" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard title="Spend" value="R$ 0,00" color="gray" />
                <MetricCard title="Impressões" value="0" color="gray" />
                <MetricCard title="Cliques" value="0" color="gray" />
                <MetricCard title="Conversões" value="0" color="gray" />
                <MetricCard title="CPA" value="R$ 0,00" color="gray" />
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Campanhas de Busca</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campanha</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spend</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressões</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CPC</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conv.</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CPA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                                    Nenhuma campanha encontrada. Os dados serão sincronizados automaticamente.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Keywords Performance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900">Top Keywords</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Keyword</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Impressões</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CTR</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">CPC</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Quality Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                                    Keywords serão listadas após sincronização.
                                </td>
                            </tr>
                        </tbody>
                    </table>
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
        red: "border-red-500",
        orange: "border-orange-500",
        yellow: "border-yellow-500",
        purple: "border-purple-500",
        indigo: "border-indigo-500",
        gray: "border-gray-200",
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${colorClasses[color] || "border-gray-200"} p-4`}>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
    );
}
