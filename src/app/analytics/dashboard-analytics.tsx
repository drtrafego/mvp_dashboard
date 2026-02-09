
"use client";

import { useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend
} from "recharts";
import { ArrowUp, ArrowDown, Filter, Download, Grip, HelpCircle, RefreshCw, Calendar, Monitor, Smartphone, Tablet } from "lucide-react";

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

const BrazilMapMock = () => (
    <div className="relative w-full h-full flex items-center justify-center bg-[#12141f]/50 rounded-lg">
        {/* Placeholder for Map - Drawing SVG paths efficiently is complex for code blocks, 
            so we'll use a stylized SVG placeholder or text if real map lib isn't available.
            Given the constraints, a specialized SVG is best. */}
        <svg viewBox="0 0 100 100" className="w-full h-full opacity-80 p-4">
            <path d="M40,20 L60,20 L70,40 L60,80 L40,70 L30,50 Z" fill="#eab308" fillOpacity="0.2" stroke="#eab308" strokeWidth="0.5" />
            <text x="50" y="50" textAnchor="middle" fill="#6b7280" fontSize="8">Mapa do Brasil</text>
            <text x="50" y="60" textAnchor="middle" fill="#4b5563" fontSize="6">(Visualização Mock)</text>
        </svg>
        {/* Overlay Data Points Mock */}
        <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-ping opacity-75"></div>
        <div className="absolute top-1/4 right-1/4 w-3 h-3 bg-yellow-500 rounded-full opacity-90"></div>

        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-yellow-500 rounded-full opacity-60"></div>
        {/* Gradient Bar Mock */}
        <div className="absolute bottom-4 left-4 right-4 h-2 bg-gradient-to-r from-gray-800 via-yellow-900 to-yellow-500 rounded-full">
            <div className="absolute -top-4 left-0 text-[8px] text-gray-500">Min</div>
            <div className="absolute -top-4 right-0 text-[8px] text-gray-500">Max</div>
        </div>
    </div>
);

// --- Main Layout ---

import { syncGA4 } from "@/server/actions/sync-google";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";

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
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">📊</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Analytics</h1>
                        </div>
                        <div className="mt-1">
                            <DatePickerWithRange />
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

                    {/* Mock Filters */}
                    <button className="flex items-center gap-2 bg-[#0f111a] border border-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm hover:text-white transition">
                        Cidade <ArrowDown size={14} />
                    </button>
                    <button className="flex items-center gap-2 bg-[#0f111a] border border-gray-800 text-gray-400 px-4 py-2 rounded-lg text-sm hover:text-white transition">
                        Região <ArrowDown size={14} />
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

            {/* Middle Section: Map | Line | Bar | Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[400px]">

                {/* Left: Map & Table (4 cols) */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                    import {BrazilGridMap} from "@/components/analytics/BrazilGridMap";

                    // ... (inside component)

                    {/* Map Card */}
                    <Card className="flex-1 min-h-[200px] relative p-0 overflow-hidden flex items-center justify-center bg-[#0f111a]">
                        <BrazilGridMap data={regionData || []} />
                        <div className="absolute top-4 left-4">
                            <h3 className="text-sm font-semibold text-white">Geografia</h3>
                        </div>
                    </Card>

                    {/* Region Table */}
                    <Card className="h-[180px] !p-0 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800 bg-[#12141f] flex justify-between items-center">
                            <span className="text-xs font-bold text-gray-400 uppercase">Localização</span>
                            <span className="text-[10px] text-gray-600">v2.0 (Live)</span>
                            <span className="text-xs font-bold text-gray-400 uppercase text-right">Acessos</span>
                        </div>
                        <div className="overflow-y-auto h-full pb-8">
                            {(cityData && cityData.length > 0 ? cityData : []).map((item: any, i: number) => (
                                <div key={i} className="flex justify-between px-4 py-2 text-xs border-b border-gray-800/30 hover:bg-white/5">
                                    <span className="text-gray-300 w-2/3 truncate">{item.name}</span>
                                    {/* Bar visual for value */}
                                    <div className="w-1/3 flex items-center justify-end gap-2">
                                        <span className="text-white font-mono">{item.value}</span>
                                        <div className="w-12 h-1 bg-gray-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-orange-500" style={{ width: `${(item.value / (cityData?.[0]?.value || 1)) * 100}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(!cityData || cityData.length === 0) && (
                                <div className="p-4 text-center text-gray-500 text-xs mt-4">
                                    Nenhum dado de localização encontrado para este período.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Center: Charts (8 cols) */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

                    {/* Line Chart: Acessos no Período */}
                    <Card className="flex flex-col">
                        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                            Acessos no Período
                        </h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={safeDaily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="gradSes" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                                    <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickFormatter={(val) => val.split("-")[2]} axisLine={false} tickLine={false} />
                                    <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="sessions" stroke="#eab308" strokeWidth={2} fill="url(#gradSes)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Bar Chart: Acessos na Semana & Donut: Origem */}
                    <div className="flex flex-col gap-6">
                        {/* Weekly Bar Chart */}
                        <Card className="flex-1 flex flex-col min-h-[180px]">
                            <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                Acessos na Semana
                            </h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weekData}>
                                    <XAxis dataKey="day" stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }} />
                                    <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>

                        {/* Origins Donut */}
                        <Card className="flex-1 flex flex-row items-center justify-between p-4 min-h-[180px]">
                            <div className="flex-1 h-full min-h-[140px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sources}
                                            dataKey="sessions"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={40}
                                            outerRadius={60}
                                            paddingAngle={2}
                                        >
                                            {sources.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={['#f97316', '#ef4444', '#eab308', '#a855f7', '#3b82f6'][index % 5]} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-xs font-bold text-gray-500">Origem</span>
                                </div>
                            </div>
                            <div className="w-1/2 text-xs space-y-1 pl-2">
                                <h4 className="text-gray-300 font-bold mb-2">Origem dos Acessos</h4>
                                {sources.slice(0, 5).map((s, i) => (
                                    <div key={i} className="flex items-center gap-2 justify-between">
                                        <div className="flex items-center gap-1.5 overflow-hidden">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: ['#f97316', '#ef4444', '#eab308', '#a855f7', '#3b82f6'][i % 5] }}></div>
                                            <span className="text-gray-400 truncate max-w-[80px]">{s.name}</span>
                                        </div>
                                        <span className="text-white font-mono">{s.percentage.toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Bottom Row: OS | Device | URL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[250px]">

                {/* OS Donut */}
                <Card className="flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Sistema Operacional</h3>
                    <div className="flex-1 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={osData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                >
                                    {osData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Device Donut */}
                <Card className="flex flex-col">
                    <h3 className="text-sm font-semibold text-gray-300 mb-2">Dispositivo</h3>
                    <div className="flex-1 flex items-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deviceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={2}
                                >
                                    {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                                <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '10px', color: '#9ca3af' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* URL Table */}
                <Card className="!p-0 overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-gray-800 bg-[#12141f] flex justify-between items-center">
                        <h3 className="text-sm font-semibold text-gray-300">Acessos por URL</h3>
                        <Filter size={14} className="text-gray-500" />
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-1">
                        {pages.map((p, i) => (
                            <div key={i} className="flex justify-between items-center px-3 py-2 text-xs hover:bg-white/5 rounded border border-transparent hover:border-gray-800 transition-colors">
                                <span className="text-gray-400 truncate max-w-[70%]">{p.path}</span>
                                <span className="bg-orange-900/20 text-orange-500 px-2 py-0.5 rounded font-mono">{p.views}</span>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    );
}
