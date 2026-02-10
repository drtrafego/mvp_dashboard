import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import { Filter, RefreshCw } from "lucide-react";

// --- Components ---
const GoogleIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21.6 10.2H20.4V7.8C20.4 6.47452 19.3255 5.4 18 5.4H15.6V4.2C15.6 2.87452 14.5255 1.8 13.2 1.8H7.8C6.47452 1.8 5.4 2.87452 5.4 4.2V5.4H4.2C2.87452 5.4 1.8 6.47452 1.8 7.8V16.2C1.8 17.5255 2.87452 18.6 4.2 18.6H5.4V21.6C5.4 21.9314 5.66863 22.2 6 22.2H18C18.3314 22.2 18.6 21.9314 18.6 21.6V18.6H21.6C21.9314 18.6 22.2 18.3314 22.2 18V10.8C22.2 10.4686 21.9314 10.2 21.6 10.2Z" fill="#FABB05" />
        <path d="M15.6 18.6H6V21H18V18.6H15.6Z" fill="#34A853" />
        <path d="M4.2 18.6H5.4V7.8H18V5.4H15.6V4.2H7.8V5.4H5.4V7.8H4.2V18.6Z" fill="#4285F4" />
    </svg>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800/50 p-6 shadow-sm dark:shadow-xl ${className}`}>
        {children}
    </div>
);

const KPICard = ({
    title,
    value,
    subValue,
    color
}: {
    title: string;
    value: string;
    subValue?: string;
    color?: string;
}) => {
    return (
        <Card className="relative overflow-hidden group !p-5 bg-white dark:bg-gradient-to-br dark:from-[#12141f] dark:to-[#1a1d2d] border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            {subValue}
                        </div>
                    )}
                </div>
                <div className={`p-2 rounded-lg bg-opacity-20 ${color ? `text-${color}-600 dark:text-${color}-400 bg-${color}-100 dark:bg-${color}-500/20` : 'text-gray-400 bg-gray-100 dark:bg-gray-700/20'}`}>
                    <div className={`w-4 h-4 rounded-full ${color ? `bg-${color}-500` : 'bg-gray-400'}`} />
                </div>
            </div>
        </Card>
    );
};

export default async function GoogleAdsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.googleAdsCustomerId);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-200 p-6 md:p-8 space-y-6 font-sans">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <GoogleIcon />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Google Ads Hub</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Análise de campanhas de busca e display</p>
                    </div>
                </div>
                {isConnected && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
                            ID: {settings?.googleAdsCustomerId}
                        </span>
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
                            <RefreshCw size={14} />
                            Sincronizar
                        </button>
                        <button className="flex items-center gap-2 bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-700 transition">
                            <Filter size={14} />
                            Filtros
                        </button>
                    </div>
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
        <div className="bg-white dark:bg-[#0f111a] rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Google Ads não configurado</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Configure seu Customer ID para ver métricas.</p>
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
                <KPICard title="CTR" value="0%" subValue="Cliques / Impressões" color="red" />
                <KPICard title="CPC Médio" value="R$ 0,00" color="orange" />
                <KPICard title="Índice de Qualidade" value="-" subValue="Média das keywords" color="yellow" />
                <KPICard title="Imp. Share Lost (Budget)" value="0%" color="purple" />
                <KPICard title="Imp. Share Lost (Rank)" value="0%" color="indigo" />
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard title="Spend" value="R$ 0,00" color="gray" />
                <KPICard title="Impressões" value="0" color="gray" />
                <KPICard title="Cliques" value="0" color="gray" />
                <KPICard title="Conversões" value="0" color="gray" />
                <KPICard title="CPA" value="R$ 0,00" color="gray" />
            </div>

            {/* Campaigns Table */}
            <Card className="overflow-hidden !p-0 bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-indigo-900/30">
                <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Campanhas de Busca</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-xs uppercase">Campanha</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">Spend</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">Impressões</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">CTR</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">CPC</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">Conv.</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">CPA</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                    Nenhuma campanha encontrada. Os dados serão sincronizados automaticamente.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Keywords Performance */}
            <Card className="overflow-hidden !p-0 bg-white dark:bg-[#1a1d2e] border-gray-200 dark:border-indigo-900/30">
                <div className="p-4 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/5">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Top Keywords</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-4 py-3 text-xs uppercase">Keyword</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">Impressões</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">CTR</th>
                                <th className="px-4 py-3 text-right text-xs uppercase">CPC</th>
                                <th className="px-4 py-3 text-center text-xs uppercase">Quality Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                                    Keywords serão listadas após sincronização.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
