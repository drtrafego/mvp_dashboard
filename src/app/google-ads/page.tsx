import { getAdAccountSettings } from "@/server/actions/ad-account-settings";
import { getGoogleAdsMetrics } from "@/server/actions/metrics-google-ads";
import { Filter, RefreshCw } from "lucide-react";
import GoogleAdsDashboard from "./google-ads-dashboard";

// --- Google Icon ---
const GoogleIcon = () => (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10 10 0 0 0 2 12c0 1.61.39 3.14 1.07 4.5l3.77-2.41z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.46 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

export default async function GoogleAdsPage() {
    const settings = await getAdAccountSettings();
    const isConnected = Boolean(settings?.googleAdsCustomerId);

    let metrics = null;
    let error = null;

    if (isConnected) {
        try {
            metrics = await getGoogleAdsMetrics();
        } catch (e: unknown) {
            error = e instanceof Error ? e.message : "Erro desconhecido";
        }
    }

    return (
        <div className="min-h-screen bg-[#050510] text-gray-200 p-6 md:p-8 space-y-6 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <GoogleIcon />
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">Google Ads</h1>
                        <p className="text-sm text-gray-500">Análise de campanhas de busca e display</p>
                    </div>
                </div>
                {isConnected && (
                    <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-gray-800 px-3 py-1.5 rounded-lg text-gray-400 border border-gray-700/50">
                            ID: {settings?.googleAdsCustomerId}
                        </span>
                        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            <RefreshCw size={14} />
                            Sincronizar
                        </button>
                        <button className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700/50">
                            <Filter size={14} />
                            Filtros
                        </button>
                    </div>
                )}
            </div>

            {/* Content */}
            {!isConnected ? (
                <NotConnectedState />
            ) : error ? (
                <div className="p-8 text-center bg-red-900/20 rounded-xl border border-red-800/30 text-red-400">
                    Erro ao carregar dados: {error}
                </div>
            ) : metrics ? (
                <GoogleAdsDashboard
                    summary={metrics.summary}
                    daily={metrics.daily}
                    campaigns={metrics.campaigns}
                    keywords={metrics.keywords}
                />
            ) : (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
        </div>
    );
}

function NotConnectedState() {
    return (
        <div className="bg-[#0c0e1a] rounded-xl border border-gray-800/50 p-12 text-center">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Google Ads não configurado</h2>
            <p className="text-gray-400 mb-6">Configure seu Customer ID para ver métricas.</p>
            <a
                href="/settings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
                Ir para Configurações
            </a>
        </div>
    );
}
