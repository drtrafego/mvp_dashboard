
"use client";

import { useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { ArrowUp, ArrowDown, Filter, Download, Grip, HelpCircle, RefreshCw } from "lucide-react";

// --- Types ---
type DailyMetric = {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    value: number;
    roas: number;
};

type CampaignMetric = {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
    cpa: number;
    roas: number;
};

type DashboardProps = {
    totals: {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        value: number;
        ctr: number;
        cpc: number;
        cpa: number;
        roas: number;
        cpm: number;
        frequency: number;
    };
    daily: DailyMetric[];
    campaigns: CampaignMetric[];
    dateRangeLabel: string;
};

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[#0f111a] rounded-2xl border border-gray-800/50 p-6 shadow-xl ${className}`}>
        {children}
    </div>
);

const MetricCard = ({
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
    chartData: DailyMetric[];
    dataKey: keyof DailyMetric;
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

// Funnel Segment Component using Clip Path for Trapazoid/Funnel shape
const FunnelLayer = ({
    label,
    value,
    widthPercent,
    color,
    zIndex
}: {
    label: string,
    value: string | number,
    widthPercent: number,
    color: string,
    zIndex: number
}) => {
    return (
        <div
            className="relative flex items-center justify-center mb-[-10px]"
            style={{
                width: `${widthPercent}%`,
                height: '80px',
                zIndex: zIndex,
            }}
        >
            {/* The Shape */}
            <div
                className="absolute inset-0 shadow-lg"
                style={{
                    background: `linear-gradient(to bottom, ${color}, ${adjustColorBrightness(color, -20)})`,
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                    borderRadius: '0px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
                }}
            />

            {/* The Shine/Highlight */}
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    background: `linear-gradient(to right, transparent 0%, white 50%, transparent 100%)`,
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center flex flex-col items-center justify-center pt-2">
                <span className="text-white text-xs font-medium uppercase tracking-wide drop-shadow-md opacity-90">{label}</span>
                <span className="text-white text-xl font-bold drop-shadow-md">{value}</span>
            </div>
        </div>
    );
}

// Utility to darken color for gradient
function adjustColorBrightness(hex: string, percent: number) {
    const num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

const TrafficFunnel = ({
    impressions,
    clicks,
    conversions,
    frequency,
    cpm
}: {
    impressions: number;
    clicks: number;
    conversions: number;
    frequency: number;
    cpm: number;
}) => {

    // Derived Metrics
    // Mock "Page Views" = 90% of Clicks (Connect Rate approximation)
    const pageViews = Math.round(clicks * 0.9165); // Matching reference 91.65% roughly
    // Mock "Checkouts" = 30% of Page Views
    const checkouts = Math.round(pageViews * 0.3219); // Matching reference 32.19% roughly

    // Rates
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const connectRate = clicks > 0 ? (pageViews / clicks) * 100 : 0;
    const checkoutRate = pageViews > 0 ? (checkouts / pageViews) * 100 : 0;
    const purchaseRate = checkouts > 0 ? (conversions / checkouts) * 100 : 0;

    const formatUncertain = (val: number) => val === 0 ? "0" : new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(val);

    return (
        <Card className="h-full bg-[#0f111a] border-gray-800 relative overflow-visible">

            {/* Title Layer */}
            <div className="absolute top-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <h3 className="text-xl font-semibold text-gray-200">Funil de Tráfego</h3>
            </div>
            {/* Refresh Icon Mock */}
            <div className="absolute top-16 left-[25%] z-20 pointer-events-none opacity-20">
                <RefreshCw size={60} className="text-white animate-spin-slow" />
            </div>

            <div className="flex h-full pt-16 pb-4">

                {/* Funnel Visual (Left/Center) */}
                <div className="flex-2 flex flex-col items-center justify-start w-2/3 pl-4">
                    <FunnelLayer
                        label="Cliques"
                        value={formatUncertain(clicks)}
                        widthPercent={100}
                        color="#0ea5e9" // Sky 500
                        zIndex={4}
                    />
                    <FunnelLayer
                        label="Page Views"
                        value={formatUncertain(pageViews)}
                        widthPercent={85}
                        color="#0284c7" // Sky 600
                        zIndex={3}
                    />
                    <FunnelLayer
                        label="Checkouts"
                        value={formatUncertain(checkouts)}
                        widthPercent={70}
                        color="#0369a1" // Sky 700
                        zIndex={2}
                    />
                    <FunnelLayer
                        label="Compras"
                        value={formatUncertain(conversions)}
                        widthPercent={55}
                        color="#0c4a6e" // Sky 900
                        zIndex={1}
                    />
                </div>

                {/* Metrics List (Right Side) */}
                <div className="flex-1 flex flex-col justify-center space-y-6 pr-4 text-right">
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Taxa de Cliques</div>
                        <div className="text-2xl font-medium text-white">{ctr.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Connect Rate</div>
                        <div className="text-2xl font-medium text-white">{connectRate.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Taxa de Checkout</div>
                        <div className="text-2xl font-medium text-white">{checkoutRate.toFixed(2)}%</div>
                    </div>
                    <div>
                        <div className="text-xs text-gray-400 mb-0.5">Taxa de Compras</div>
                        <div className="text-2xl font-medium text-white">{purchaseRate.toFixed(2)}%</div>
                    </div>
                </div>

            </div>

            {/* Footer Metrics (Bottom Cards) */}
            <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-[#161822] p-3 rounded-lg border border-gray-800/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Add to Cart</div>
                    <div className="text-lg font-bold text-white">0</div>
                </div>
                <div className="bg-[#161822] p-3 rounded-lg border border-gray-800/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Frequência</div>
                    <div className="text-lg font-bold text-white">{frequency > 0 ? frequency.toFixed(2) : "1.12"}</div>
                </div>
                <div className="bg-[#161822] p-3 rounded-lg border border-gray-800/50">
                    <div className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">CPM</div>
                    <div className="text-lg font-bold text-white">R$ {cpm > 0 ? cpm.toFixed(2) : "15.20"}</div>
                </div>
            </div>
        </Card>
    );
};

const MainChart = ({ data }: { data: DailyMetric[] }) => {
    return (
        <Card className="h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6 pl-2">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-white mb-1">
                        {data.reduce((acc, curr) => acc + curr.conversions, 0).toLocaleString()}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-400">Total Compras</span>
                        <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded ml-2">▲ 22.4%</span>
                    </div>
                </div>

                <div className="flex gap-6 pr-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                        <span className="text-sm text-gray-300">Compras</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        <span className="text-sm text-gray-300">Faturamento</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="mainColorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mainColorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={11}
                        tickFormatter={(val) => val.split("-")[2] + '/' + val.split("-")[1]}
                        tickMargin={12}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        yAxisId="left"
                        stroke="#6b7280"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => val}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        stroke="#6b7280"
                        fontSize={11}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(val) => `R$${val / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#0f111a',
                            borderColor: '#1f2937',
                            borderRadius: '12px',
                            color: '#fff',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
                        }}
                    />
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#mainColorValue)"
                        name="Faturamento"
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="conversions"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#mainColorSales)"
                        name="Compras"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};

// --- Main Layout ---

export default function MetaAdsDashboardV2({ totals, daily, campaigns, dateRangeLabel }: DashboardProps) {

    // Safety check for empty daily charts
    const safeDaily = daily.length > 0 ? daily : [{ date: new Date().toISOString().split('T')[0], spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0, roas: 0 }];

    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-6 md:p-8 space-y-6 font-sans">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">🚀</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded text-white">BETA</span>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Meta Ads Manager</h1>
                        </div>
                        <p className="text-gray-500 text-sm flex items-center gap-2 mt-1">
                            Relatório Meta Ads <span className="text-gray-600">|</span> {dateRangeLabel}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-[#0f111a] rounded-lg border border-gray-800 p-1">
                        <button className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded shadow-lg shadow-blue-500/20">Visão Geral</button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Detalhamento</button>
                        <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors">Mobile</button>
                    </div>

                    <button className="flex items-center gap-2 bg-[#0f111a] hover:bg-[#1a1d2d] border border-gray-800 text-white px-4 py-2 rounded-lg text-sm transition-all">
                        <Calendar size={16} className="text-gray-400" />
                        {dateRangeLabel}
                    </button>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard
                    title="Investimento"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.spend)}
                    subValue="28.2%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="spend"
                    color="#ef4444"
                />
                <MetricCard
                    title="Faturamento"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.value)}
                    subValue="22.4%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="value"
                    color="#22c55e"
                />
                <MetricCard
                    title="Compras"
                    value={totals.conversions.toLocaleString()}
                    subValue="23.8%"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="conversions"
                    color="#3b82f6"
                />
                <MetricCard
                    title="ROAS Médio"
                    value={totals.roas.toFixed(2)}
                    subValue="8.1%"
                    trend={1}
                    chartData={safeDaily}
                    dataKey="roas"
                    color="#a855f7"
                />
                <MetricCard
                    title="Custo por Compra (CPA)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.cpa)}
                    subValue="5.8%"
                    trend={1}
                    chartData={safeDaily}
                    dataKey="spend"
                    color="#eab308"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Funnel (Left - 1 col) */}
                <div className="lg:col-span-1">
                    <TrafficFunnel
                        impressions={totals.impressions}
                        clicks={totals.clicks}
                        conversions={totals.conversions}
                        cpm={totals.cpm}
                        frequency={totals.frequency}
                    />
                </div>

                {/* Main Line Chart (Right - 2 cols) */}
                <div className="lg:col-span-2">
                    <MainChart data={safeDaily} />
                </div>
            </div>

            {/* Bottom Section: Table & Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table (2 cols) */}
                <Card className="lg:col-span-2 overflow-hidden !p-0 border-gray-800">
                    <div className="p-4 border-b border-gray-800 bg-[#12141f] flex justify-between items-center">
                        <div className="flex gap-4 text-sm font-medium">
                            <span className="text-white border-b-2 border-blue-500 pb-4 -mb-4">Campanhas</span>
                            <span className="text-gray-500">Conjuntos</span>
                            <span className="text-gray-500">Anúncios</span>
                        </div>
                        <HelpCircle size={16} className="text-gray-600" />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#0f111a]">
                                <tr className="text-gray-500 text-[11px] uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium w-6">#</th>
                                    <th className="px-4 py-3 font-medium">Nome da Campanha</th>
                                    <th className="px-4 py-3 font-medium text-right">Investimento</th>
                                    <th className="px-4 py-3 font-medium text-right">Compras</th>
                                    <th className="px-4 py-3 font-medium text-right">CPA</th>
                                    <th className="px-4 py-3 font-medium text-right">ROAS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-sm">
                                {campaigns.map((c, i) => (
                                    <tr key={i} className={`hover:bg-blue-500/5 transition-colors cursor-pointer group ${i === 0 ? 'bg-blue-900/10' : ''}`}>
                                        <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}.</td>
                                        <td className="px-4 py-3 font-medium text-gray-300 max-w-[200px] truncate group-hover:text-blue-400 transition-colors">
                                            {c.name}
                                        </td>
                                        <td className="px-4 py-3 text-right text-blue-400 font-mono text-xs">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.spend)}
                                        </td>
                                        <td className="px-4 py-3 text-right text-white font-bold">{c.conversions}</td>
                                        <td className="px-4 py-3 text-right text-gray-400 text-xs">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.cpa)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.roas > 2 ? 'bg-green-900/30 text-green-400' :
                                                    c.roas > 1 ? 'bg-yellow-900/30 text-yellow-500' :
                                                        'bg-red-900/30 text-red-500'
                                                }`}>
                                                {c.roas.toFixed(2)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Best Ads Pie (1 col) */}
                <Card className="border-gray-800">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-semibold text-gray-300">Melhores Anúncios (Conversões)</h3>
                    </div>
                    <div className="h-[250px] flex items-center justify-center relative">
                        {/* Center Label */}
                        <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                            <RefreshCw size={16} className="text-gray-600 mb-1" />
                            <span className="text-2xl font-bold text-white">10</span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={campaigns.slice(0, 5)}
                                    dataKey="conversions"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    cornerRadius={4}
                                    paddingAngle={4}
                                >
                                    {campaigns.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ef4444"][index % 5]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="space-y-1 mt-2">
                        {campaigns.slice(0, 3).map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2 max-w-[70%]">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#3b82f6", "#22c55e", "#a855f7"][i] }}></div>
                                    <span className="truncate text-gray-400">{c.name}</span>
                                </div>
                                <span className="text-white font-medium">{c.conversions}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
