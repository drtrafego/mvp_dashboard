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


import MetaAdsDashboardV2 from "./dashboard-v2";

async function MetaAdsContent() {
    const { totals, daily, campaigns } = await getMetaAdsMetrics(90);

    return (
        <MetaAdsDashboardV2
            totals={totals}
            daily={daily}
            campaigns={campaigns}
            dateRangeLabel="Últimos 90 Dias"
        />
    );
}
