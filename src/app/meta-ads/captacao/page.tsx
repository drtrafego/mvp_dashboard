import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import { getMetaAdsMetrics } from "@/server/actions/metrics";
import MetaAdsDashboardV2 from "../dashboard-v2";

export default async function MetaAdsCapturePage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.facebookAdAccountId);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔵 Meta Ads - Captação</h1>
                    <p className="text-gray-500">Análise de Leads e CPL</p>
                </div>

            </div>

            {!isConnected ? (
                <div className="p-8 text-center bg-gray-50 rounded-lg">Configure sua conta Meta Ads.</div>
            ) : (
                <MetaAdsContent searchParams={searchParams} />
            )}
        </div>
    );
}

async function MetaAdsContent({ searchParams }: { searchParams?: { from?: string; to?: string } }) {
    const { totals, daily, campaigns, ads } = await getMetaAdsMetrics(searchParams?.from, searchParams?.to);

    const dateRangeLabel = searchParams?.from && searchParams?.to
        ? `${new Date(searchParams.from).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} - ${new Date(searchParams.to).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}`
        : "Últimos 30 Dias";

    return (
        <MetaAdsDashboardV2
            totals={totals}
            daily={daily}
            campaigns={campaigns}
            ads={ads}
            dateRangeLabel={dateRangeLabel}
            mode="capture" // Mode prop to switch visualization
        />
    );
}
