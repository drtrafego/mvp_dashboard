import { auth } from "@/server/auth";
import { getAdAccountSettings } from "@/server/actions/ad-account-settings";

export default async function DashboardPage() {
    const session = await auth();
    const settings = await getAdAccountSettings();

    const hasSettings = Boolean(
        settings?.googleAdsCustomerId ||
        settings?.facebookAdAccountId ||
        settings?.ga4PropertyId
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Geral</h1>
                    <p className="text-gray-500">Visão consolidada de todas as plataformas</p>
                </div>
            </div>

            {!hasSettings ? (
                <EmptyState />
            ) : (
                <DashboardContent settings={settings} />
            )}
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Configure suas contas</h2>
            <p className="text-gray-600 mb-6">Conecte Google Ads, Meta Ads e GA4 para ver métricas.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
            >
                Configurar Contas
            </a>
        </div>
    );
}

function DashboardContent({ settings }: { settings: any }) {
    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KPICard title="Investimento Total" value="R$ 0,00" change="+0%" icon="💰" />
                <KPICard title="ROAS Médio" value="0.00x" change="+0%" icon="📈" />
                <KPICard title="Total Conversões" value="0" change="+0%" icon="🎯" />
                <KPICard title="CPA Médio" value="R$ 0,00" change="+0%" icon="💵" />
            </div>

            {/* Platform Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <PlatformCard
                    name="Meta Ads"
                    spend="R$ 0,00"
                    conversions="0"
                    roas="0.00x"
                    connected={Boolean(settings?.facebookAdAccountId)}
                    color="blue"
                />
                <PlatformCard
                    name="Google Ads"
                    spend="R$ 0,00"
                    conversions="0"
                    roas="0.00x"
                    connected={Boolean(settings?.googleAdsCustomerId)}
                    color="red"
                />
                <PlatformCard
                    name="Google Analytics"
                    spend="-"
                    conversions="0 sessões"
                    roas="-"
                    connected={Boolean(settings?.ga4PropertyId)}
                    color="orange"
                />
            </div>
        </div>
    );
}

function KPICard({ title, value, change, icon }: { title: string; value: string; change: string; icon: string }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs text-gray-400">{change}</span>
            </div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function PlatformCard({
    name,
    spend,
    conversions,
    roas,
    connected,
    color,
}: {
    name: string;
    spend: string;
    conversions: string;
    roas: string;
    connected: boolean;
    color: "blue" | "red" | "orange";
}) {
    const colorClasses = {
        blue: "border-blue-500 bg-blue-50",
        red: "border-red-500 bg-red-50",
        orange: "border-orange-500 bg-orange-50",
    };

    return (
        <div className={`bg-white rounded-xl shadow-sm border-l-4 ${colorClasses[color]} p-5`}>
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{name}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {connected ? "Conectado" : "Não configurado"}
                </span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                    <p className="text-xs text-gray-500">Spend</p>
                    <p className="font-semibold text-gray-900">{spend}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Conversões</p>
                    <p className="font-semibold text-gray-900">{conversions}</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">ROAS</p>
                    <p className="font-semibold text-gray-900">{roas}</p>
                </div>
            </div>
        </div>
    );
}
