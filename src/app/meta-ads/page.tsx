import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import { getMetaAdsMetrics } from "@/server/actions/metrics";

export default async function MetaAdsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.facebookAdAccountId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🔵 Meta Ads Hub</h1>
                    <p className="text-gray-500">Análise detalhada de campanhas Facebook e Instagram</p>
                </div>
                {isConnected && (
                    <span className="text-sm text-gray-500">
                        Conta: {settings?.facebookAdAccountId}
                    </span>
                )}
            </div>

            {!isConnected ? (
                <NotConnectedState platform="Meta Ads" />
            ) : (
                <MetaAdsContent />
            )}
        </div>
    );
}

function NotConnectedState({ platform }: { platform: string }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">{platform} não configurado</h2>
            <p className="text-gray-600 mb-6">Configure seu Ad Account ID para ver métricas.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
                Ir para Configurações
            </a>
        </div>
    );
}

async function MetaAdsContent() {
    const { totals, campaigns } = await getMetaAdsMetrics(90);

    const fmtMoney = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const fmtNum = (val: number) => new Intl.NumberFormat('pt-BR').format(val);
    const fmtPct = (val: number) => val.toFixed(2) + "%";

    return (
        <div className="space-y-6">
            {/* Video Metrics (Placeholder for Phase 6b - using real calculated CTR/etc if available or 0) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <MetricCard title="Hook Rate" value="-" subtitle="3s views / impressões" color="blue" />
                <MetricCard title="Hold Rate" value="-" subtitle="75% views / 3s views" color="purple" />
                <MetricCard title="ROAS" value={totals.roas.toFixed(2)} subtitle="Retorno sobre invest." color="indigo" />
                <MetricCard title="CTR" value={fmtPct(totals.ctr)} subtitle="Cliques / Impressões" color="cyan" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard title="Spend" value={fmtMoney(totals.spend)} color="gray" />
                <MetricCard title="Impressões" value={fmtNum(totals.impressions)} color="gray" />
                <MetricCard title="Cliques" value={fmtNum(totals.clicks)} color="gray" />
                <MetricCard title="Conversões" value={fmtNum(totals.conversions)} color="gray" />
                <MetricCard title="CPA" value={fmtMoney(totals.cpa)} color="gray" />
            </div>

            {/* Campaigns Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Campanhas (Últimos 30 dias)</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Campanha</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Spend</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Impressões</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CTR</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">CPA</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ROAS</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {campaigns.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                        Nenhum dado encontrado. Faça a sincronização em Configurações.
                                    </td>
                                </tr>
                            ) : (
                                campaigns.map((c, i) => (
                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 font-medium truncate max-w-xs" title={c.name}>{c.name}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{fmtMoney(c.spend)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{fmtNum(c.impressions)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{fmtPct(c.ctr)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{fmtMoney(c.cpa)}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 text-right">{c.roas.toFixed(2)}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Creative Analysis */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🎨</span>
                    <h3 className="text-xl font-bold">Análise de Criativos (AI)</h3>
                </div>
                <p className="text-white/80">
                    Correlação entre Hook Rate e CPA será analisada aqui. Criativos com alto Hook Rate e baixo CPA serão destacados.
                </p>
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
        blue: "border-blue-500",
        purple: "border-purple-500",
        indigo: "border-indigo-500",
        cyan: "border-cyan-500",
        gray: "border-gray-200",
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 ${colorClasses[color] || "border-gray-200 dark:border-gray-700"} p-4 transition-colors`}>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
            {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
        </div>
    );
}
