
"use client";

import { useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts";
import { ArrowDown, Filter, RefreshCw } from "lucide-react";

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
    weekData: { day: string; value: number }[];
    cityData?: DimensionData[];
    regionData?: DimensionData[];
};

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[#0f111a] rounded-2xl border border-gray-800/50 p-6 shadow-xl ${className}`}>
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
    trend
}: {
    title: string;
    value: string;
    subValue?: string;
    chartData: DailyAnalytics[];
    dataKey: keyof DailyAnalytics;
    color: string;
    trend?: number;
}) => {
    return (
        <Card className="relative overflow-hidden group !p-5 bg-gradient-to-br from-[#12141f] to-[#1a1d2d] border-gray-800">
            <div className="flex justify-between items-start z-10 relative mb-4">
                <div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                            <span className={`${trend && trend > 0 ? 'text-green-400' : 'text-red-400'} flex items-center font-medium`}>
                                {trend && trend > 0 ? '↑' : '↓'} {subValue}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sparkline Area */}
            <div className="h-12 w-full mt-2">
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

// ... (existing imports)

export default function AnalyticsDashboard({
    totals,
    daily,
    sources,
    pages,
    osData,
    deviceData,
    weekData,
    cityData,
    regionData
}: AnalyticsDashboardProps) {
    const [isSyncing, setIsSyncing] = useState(false);

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

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-6 md:p-8 space-y-6 font-sans">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">📊</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
                        </div>
                        <div className="mt-1">
                            <p className="text-sm text-gray-500">Visão geral do tráfego e engajamento.</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
                />
                <KPICard
                    title="Usuários Totais"
                    value={totals.users.toLocaleString()}
                    subValue="21.6%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="users"
                    color="#3b82f6"
                />
                <KPICard
                    title="Novos Usuários"
                    value={totals.newUsers.toLocaleString()}
                    subValue="23.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="users" // Proxy
                    color="#ef4444"
                />
                <KPICard
                    title="Visualizações"
                    value={totals.pageViews.toLocaleString()}
                    subValue="20.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="sessions" // Proxy
                    color="#eab308"
                />
                <KPICard
                    title="Taxa de Engajamento"
                    value={`${totals.engagementRate}%`}
                    subValue="8.5%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="engagementRate"
                    color="#a855f7"
                />
            </div>

            {/* Middle Section: Map | Line | Bar | Sources */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left: Map & Table (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    {/* Map Card */}
                    <Card className="min-h-[400px] relative p-0 overflow-hidden flex items-center justify-center bg-[#0f111a] border-gray-800">
                        <BrazilHeatMap data={regionData || []} className="p-4 w-full h-full" />
                        <div className="absolute top-4 left-4 pointer-events-none">
                            <h3 className="text-sm font-semibold text-white">Geografia</h3>
                        </div>
                    </Card>

                    {/* Region Table (Below Map) */}
                    <Card className="h-[300px] !p-0 overflow-hidden border-gray-800 flex flex-col">
                        <div className="px-4 py-3 border-b border-gray-800 bg-[#12141f] grid grid-cols-12 gap-2 items-center">
                            <span className="col-span-4 text-xs font-bold text-gray-400 uppercase">Região</span>
                            <span className="col-span-4 text-xs font-bold text-gray-400 uppercase">Cidade</span>
                            <span className="col-span-4 text-xs font-bold text-gray-400 uppercase text-right">Acessos</span>
                        </div>
                        <div className="overflow-y-auto flex-1 pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                            {(cityData && cityData.length > 0 ? cityData : []).map((item: DimensionData, i: number) => (
                                <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-gray-800/30 hover:bg-white/5 transition-colors items-center">
                                    <span className="col-span-4 text-gray-400 truncate" title={item.region || "N/A"}>
                                        {item.region || "—"}
                                    </span>
                                    <span className="col-span-4 text-gray-200 truncate font-medium" title={item.name}>
                                        {item.name}
                                    </span>
                                    <div className="col-span-4 flex items-center justify-end gap-3">
                                        <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[50px]">
                                            <div
                                                className="h-full bg-amber-500 rounded-full"
                                                style={{ width: `${Math.min(((item.value / (cityData?.[0]?.value || 1)) * 100), 100)}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-white font-mono w-8 text-right">{item.value.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
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
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
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
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#6b7280"
                                        fontSize={10}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    />
                                    <Area type="monotone" dataKey="sessions" name="Sessões" stroke="#eab308" strokeWidth={2} fill="url(#gradSes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Weekly Bar Chart */}
                        <Card className="flex flex-col min-h-[350px]">
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Acessos na Semana
                            </h3>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={weekData}>
                                        <XAxis dataKey="day" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                                        <Bar dataKey="value" name="Acessos" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>

                        {/* Traffic Sources List (Replaces Donut) */}
                        <Card className="flex flex-col min-h-[350px]">
                            <h3 className="text-sm font-semibold text-white mb-4">Fontes de Tráfego</h3>
                            <div className="flex-1 space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                                {sources.slice(0, 8).map((s, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#f97316', '#ef4444', '#eab308', '#a855f7', '#3b82f6'][i % 5] }}></div>
                                                <span className="text-gray-300 font-medium truncate max-w-[120px]" title={s.name}>{s.name}</span>
                                            </div>
                                            <span className="text-gray-400">{s.sessions} ({s.percentage.toFixed(1)}%)</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
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

            {/* Bottom Row: OS | Device | URL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* OS Donut */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-2">Sistema Operacional</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={osData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {osData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                                    formatter={(value, entry: any) => (
                                        <span className="text-gray-300 ml-1">
                                            {value} <span className="text-gray-500">({entry.payload.value.toLocaleString()})</span>
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Device Donut */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-2">Dispositivo</h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="55%"
                                    outerRadius="85%"
                                    paddingAngle={2}
                                    stroke="none"
                                >
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || ['#3b82f6', '#8b5cf6', '#ec4899'][index % 3]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    iconSize={10}
                                    wrapperStyle={{ fontSize: '12px', color: '#9ca3af' }}
                                    formatter={(value, entry: any) => (
                                        <span className="text-gray-300 ml-1">
                                            {value} <span className="text-gray-500">({entry.payload.value.toLocaleString()})</span>
                                        </span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* URL Table */}
                <Card className="!p-0 overflow-hidden flex flex-col min-h-[350px] border-gray-800">
                    <div className="px-4 py-3 border-b border-gray-800 bg-[#12141f] grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-8 flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase">Página (URL)</span>
                            <Filter size={12} className="text-gray-600 cursor-pointer hover:text-gray-300 transition-colors" />
                        </div>
                        <div className="col-span-4 flex items-center justify-end gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase text-right">Acessos</span>
                            <ArrowDown size={12} className="text-gray-600 cursor-pointer hover:text-gray-300 transition-colors" />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 pb-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        {pages.map((p, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-xs border-b border-gray-800/30 hover:bg-white/5 transition-colors items-center">
                                <span className="col-span-8 text-gray-400 truncate font-medium" title={p.path}>
                                    {p.path}
                                </span>
                                <div className="col-span-4 flex items-center justify-end gap-3">
                                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden max-w-[60px]">
                                        <div
                                            className="h-full bg-purple-500 rounded-full"
                                            style={{ width: `${Math.min(((p.views / (pages[0]?.views || 1)) * 100), 100)}%` }}
                                        />
                                    </div>
                                    <span className="text-white font-mono w-8 text-right">{p.views.toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                        {pages.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-xs">Nenhuma página acessada.</div>
                        )}
                    </div>
                </Card>

            </div>
        </div>
    );
}
