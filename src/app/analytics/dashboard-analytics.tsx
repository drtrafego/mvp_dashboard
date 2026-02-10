
"use client";

import { useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts";
import { ArrowDown, ArrowUp, Filter, RefreshCw, HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// --- Types ---
type DailyAnalytics = {
    date: string;
    sessions: number;
    users: number;
    conversions: number;
    engagementRate: number;
};

type AnalyticsSource = {
    name: string;
    sessions: number;
    users: number;
    conversions: number;
    percentage: number;
};

type AnalyticsPageData = {
    path: string;
    views: number;
};

type DimensionData = {
    name: string;
    value: number;
    color?: string;
    region?: string;
};

type AnalyticsDashboardProps = {
    totals: {
        sessions: number;
        users: number;
        newUsers: number;
        pageViews: number;
        engagementRate: number;
        conversions: number;
    };
    daily: DailyAnalytics[];
    sources: AnalyticsSource[];
    pages: AnalyticsPageData[];
    osData: DimensionData[];
    deviceData: DimensionData[];
    browserData: DimensionData[];
    weekData: { day: string; value: number }[];
    cityData?: DimensionData[];
    regionData?: DimensionData[];
    genderData?: DimensionData[];
    interestData?: DimensionData[];
};

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-white dark:bg-[#0f111a] rounded-2xl border border-gray-200 dark:border-gray-800/50 p-6 shadow-sm dark:shadow-xl ${className}`}>
        {children}
    </div>
);

const KPICard = ({
    title,
    value,
    subValue,
    chartData,
    dataKey,
    color,
    trend,
    tooltipText
}: {
    title: string;
    value: string;
    subValue?: string;
    chartData: DailyAnalytics[];
    dataKey: keyof DailyAnalytics;
    color: string;
    trend?: number;
    tooltipText?: string;
}) => {
    return (
        <Card className="relative overflow-hidden group !p-5 bg-white dark:bg-gradient-to-br dark:from-[#12141f] dark:to-[#1a1d2d] border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-start z-10 relative mb-4">
                <div>
                    <h3 className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1 flex items-center gap-1">
                        {title}
                        {tooltipText && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <HelpCircle size={12} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs text-xs">{tooltipText}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </h3>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                            <span className={`${trend && trend > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center font-medium`}>
                                {trend && trend > 0 ? '↑' : '↓'} {subValue}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sparkline Area */}
            <div className="h-12 w-full mt-2 opacity-50 dark:opacity-100">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#grad-${dataKey}-${color})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};



// --- Main Layout ---

import { syncGA4 } from "@/server/actions/sync-google";
import { BrazilHeatMap } from "@/components/analytics/BrazilHeatMap";

// Icons
const AnalyticsIcon = () => (
    <svg className="w-8 h-8 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
    </svg>
);

export default function AnalyticsDashboard({
    totals,
    daily,
    sources,
    pages,
    osData,
    deviceData,
    browserData,
    weekData,
    cityData,
    regionData,
    genderData = [],
    interestData = []
}: AnalyticsDashboardProps) {
    const [isSyncing, setIsSyncing] = useState(false);

    // Sorting States
    const [citySort, setCitySort] = useState<'asc' | 'desc'>('desc');
    const [pageSort, setPageSort] = useState<'asc' | 'desc'>('desc');

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const result = await syncGA4();
            if (result.success) {
                alert(`Sucesso: ${result.message}`);
                window.location.reload();
            } else {
                alert(`Erro: ${result.error}`);
            }
        } catch (error) {
            alert("Erro na chamada de sincronização.");
            console.error(error);
        } finally {
            setIsSyncing(false);
        }
    };

    // Safety check for empty daily charts
    const safeDaily = daily.length > 0 ? daily : [{ date: new Date().toISOString().split('T')[0], sessions: 0, users: 0, conversions: 0, engagementRate: 0 }];

    // Sort data for charts (Legends ordered by value desc)
    const sortedOsData = [...osData].sort((a, b) => b.value - a.value);
    const sortedDeviceData = [...deviceData].sort((a, b) => b.value - a.value);
    const sortedBrowserData = [...browserData].sort((a, b) => b.value - a.value);

    // Sorted Tables Logic
    const sortedCityData = useMemo(() => {
        return [...(cityData || [])].sort((a, b) => {
            return citySort === 'asc' ? a.value - b.value : b.value - a.value;
        });
    }, [cityData, citySort]);

    const sortedPageData = useMemo(() => {
        return [...pages].sort((a, b) => {
            return pageSort === 'asc' ? a.views - b.views : b.views - a.views;
        });
    }, [pages, pageSort]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-gray-200 p-6 md:p-8 space-y-6 font-sans transition-colors duration-300">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <AnalyticsIcon />
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Analytics</h1>
                        </div>
                        <div className="mt-1">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Visão geral do tráfego e engajamento.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
                    </button>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <KPICard
                    title="Acessos Totais"
                    value={totals.sessions.toLocaleString()}
                    subValue="19.3%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="sessions"
                    color="#22c55e"
                    tooltipText="Número total de visitas ao site (sessões). Uma sessão expira após 30 minutos de inatividade."
                />
                <KPICard
                    title="Usuários Totais"
                    value={totals.users.toLocaleString()}
                    subValue="21.6%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="users"
                    color="#3b82f6"
                    tooltipText="Número total de visitantes únicos que acessaram o site no período."
                />
                <KPICard
                    title="Novos Usuários"
                    value={totals.newUsers.toLocaleString()}
                    subValue="23.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="users" // Proxy
                    color="#ef4444"
                    tooltipText="Número de visitantes que acessaram o site pela primeira vez."
                />
                <KPICard
                    title="Visualizações"
                    value={totals.pageViews.toLocaleString()}
                    subValue="20.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="sessions" // Proxy
                    color="#eab308"
                    tooltipText="Número total de páginas visualizadas (Pageviews). Inclui visualizações repetidas."
                />
                <KPICard
                    title="Taxa de Engajamento"
                    value={`${totals.engagementRate}%`}
                    subValue="8.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="engagementRate"
                    color="#a855f7"
                    tooltipText="Porcentagem de sessões com interação significativa (mais de 10s, conversão ou 2+ páginas)."
                />
            </div>

            {/* Middle Section: Map | Line | Bar | Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Map & Table (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Map Card */}
                    <Card className="min-h-[400px] relative p-0 overflow-hidden flex items-center justify-center bg-gray-50 dark:bg-[#0f111a] border-gray-200 dark:border-gray-800">
                        <BrazilHeatMap data={regionData || []} className="p-4 w-full h-full" />
                        <div className="absolute top-4 left-4 pointer-events-none">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Geografia</h3>
                        </div>
                    </Card>

                    {/* Region Table (Below Map) */}
                    <Card className="h-[300px] !p-0 overflow-hidden border-gray-200 dark:border-gray-800 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#12141f] grid grid-cols-12 gap-2 items-center">
                            <span className="col-span-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Região</span>
                            <span className="col-span-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Cidade</span>
                            <div
                                className="col-span-4 flex items-center justify-end gap-1 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                                onClick={() => setCitySort(prev => prev === 'desc' ? 'asc' : 'desc')}
                            >
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Acessos</span>
                                {citySort === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                            </div>
                        </div>
                        <div className="overflow-y-auto flex-1 pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            {sortedCityData.map((item, i) => {
                                const relValue = (item.value / (sortedCityData[0]?.value || 1)) * 100;
                                return (
                                    <div key={i} className="relative grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center">
                                        {/* Heatmap Background */}
                                        <div
                                            className="absolute inset-0 bg-amber-500/10 dark:bg-amber-500/20 pointer-events-none transition-all duration-500"
                                            style={{ width: `${relValue}%` }}
                                        />

                                        <span className="col-span-4 text-gray-600 dark:text-gray-400 truncate z-10" title={item.region || "N/A"}>
                                            {item.region || "—"}
                                        </span>
                                        <span className="col-span-4 text-gray-800 dark:text-gray-200 truncate font-medium z-10" title={item.name}>
                                            {item.name}
                                        </span>
                                        <div className="col-span-4 flex items-center justify-end gap-3 z-10">
                                            <span className="text-gray-900 dark:text-white font-mono w-8 text-right font-bold">{item.value.toLocaleString()}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            {(!cityData || cityData.length === 0) && (
                                <div className="p-8 text-center text-gray-500 text-xs flex flex-col items-center gap-2">
                                    <span className="text-xl">🗺️</span>
                                    <span>Nenhum dado geográfico disponível.</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right: Charts (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-6">

                    {/* Line Chart: Acessos no Período */}
                    <Card className="flex flex-col min-h-[350px]">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Acessos no Período
                        </h3>
                        <div className="flex-1 w-full min-h-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safeDaily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradSes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} className="dark:stroke-gray-800" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#9ca3af"
                                        fontSize={10}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                                    <RechartsTooltip
                                        contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--tooltip-border)', borderRadius: '8px', color: 'var(--tooltip-text)' }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        wrapperClassName="custom-tooltip"
                                    />
                                    <Area type="monotone" dataKey="sessions" name="Sessões" stroke="#eab308" strokeWidth={2} fill="url(#gradSes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Weekly Bar Chart */}
                        <Card className="flex flex-col min-h-[350px]">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Acessos na Semana
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weekData}>
                                        <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="value" name="Acessos" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Traffic Sources List (Replaces Donut) */}
                        <Card className="flex flex-col min-h-[350px]">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Fontes de Tráfego</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                                {sources.slice(0, 8).map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#f97316', '#ef4444', '#eab308', '#a855f7', '#3b82f6'][i % 5] }}></div>
                                                <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[120px]" title={s.name}>{s.name}</span>
                                            </div>
                                            <span className="text-gray-500 dark:text-gray-400">{s.sessions} ({s.percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.max(s.percentage, 2)}%`,
                                                    backgroundColor: ['#f97316', '#ef4444', '#eab308', '#a855f7', '#3b82f6'][i % 5]
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {sources.length === 0 && (
                                    <p className="text-xs text-gray-500 text-center py-4">Sem dados de origem.</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Bottom Row: OS | Browser | Device | URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* OS Horizontal Bar */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Sistema Operacional</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={sortedOsData.slice(0, 7)} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="value" name="Usuários" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Browser Horizontal Bar */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Navegador</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={sortedBrowserData.slice(0, 7)} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    width={100}
                                    tick={{ fill: '#9ca3af', fontSize: 11 }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <RechartsTooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                />
                                <Bar dataKey="value" name="Usuários" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Device Donut */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Dispositivo</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={sortedDeviceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {sortedDeviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || ['#ec4899', '#3b82f6', '#8b5cf6'][index % 3]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* URL Table */}
                <Card className="!p-0 overflow-hidden flex flex-col min-h-[350px] border-gray-200 dark:border-gray-800">
                    <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#12141f] grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8 flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Página (URL)</span>
                            <Filter size={12} className="text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-gray-300 transition-colors" />
                        </div>
                        <div
                            className="col-span-4 flex items-center justify-end gap-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300"
                            onClick={() => setPageSort(prev => prev === 'desc' ? 'asc' : 'desc')}
                        >
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase text-right">Acessos</span>
                            {pageSort === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />}
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {sortedPageData.map((p, i) => {
                            const relValue = (p.views / (sortedPageData[0]?.views || 1)) * 100;
                            return (
                                <div key={i} className="relative grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-gray-100 dark:border-gray-800/30 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors items-center">
                                    {/* Heatmap Background */}
                                    <div
                                        className="absolute inset-0 bg-purple-500/10 dark:bg-purple-500/20 pointer-events-none transition-all duration-500"
                                        style={{ width: `${relValue}%` }}
                                    />

                                    <span className="col-span-8 text-gray-700 dark:text-gray-400 truncate font-medium z-10" title={p.path}>
                                        {p.path}
                                    </span>
                                    <div className="col-span-4 flex items-center justify-end gap-3 z-10">
                                        <span className="text-gray-900 dark:text-white font-mono w-8 text-right font-bold">{p.views.toLocaleString()}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {pages.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-xs">Nenhuma página acessada.</div>
                        )}
                    </div>
                </Card>

            </div>

            {/* Bottom Row 2: Gender | Interests | Empty | Empty */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Gender Donut */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Gênero</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={genderData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {genderData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#ec4899', '#9ca3af', '#eab308'][index % 4]} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Interests List */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Interesses</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                        {interestData.slice(0, 10).map((item, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium truncate max-w-[180px]" title={item.name}>{item.name}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{item.value.toLocaleString()}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-teal-500 rounded-full"
                                        style={{ width: `${Math.min(((item.value / (interestData[0]?.value || 1)) * 100), 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {interestData.length === 0 && (
                            <p className="text-xs text-gray-500 text-center py-4">Sem dados de interesses.</p>
                        )}
                    </div>
                </Card>

                {/* Empty Columns for Future Data */}
                <div className="hidden lg:block"></div>
                <div className="hidden lg:block"></div>

            </div>
        </div>
    );
}
