
"use client";

import { useMemo } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import { ArrowUp, ArrowDown, Filter, Download, Grip } from "lucide-react";

// --- Types ---
type DailyMetric = {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    value: number;
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
    };
    daily: DailyMetric[];
    campaigns: CampaignMetric[];
    dateRangeLabel: string;
};

// --- Components ---

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 p-5 ${className}`}>
        {children}
    </div>
);

const MetricCard = ({
    title,
    value,
    subValue,
    chartData,
    dataKey,
    color
}: {
    title: string;
    value: string;
    subValue?: string;
    chartData: DailyMetric[];
    dataKey: keyof DailyMetric;
    color: string;
}) => {
    return (
        <Card className="relative overflow-hidden group">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                            <span className="text-red-400 flex items-center">{subValue}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Sparkline */}
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30 group-hover:opacity-50 transition-opacity">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                                <stop offset="100%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={2}
                            fill={`url(#grad-${dataKey})`}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
};

const FunnelChart = ({
    impressions,
    clicks,
    conversions
}: {
    impressions: number;
    clicks: number;
    conversions: number
}) => {
    // Mocking "Page Views" and "Checkouts" as intermediate steps for visual completeness if real data missing
    // Real logic: Impressions -> Clicks -> (Landing?) -> (Checkout?) -> Purchase
    // We have: Impressions -> Clicks -> Conversions
    // We can interpolate for UI demo or use real if we had it. Use "Clicks" as PV proxy?

    const steps = [
        { label: "Impressões", value: impressions, color: "#3b82f6", width: "100%" },
        { label: "Cliques", value: clicks, color: "#60a5fa", width: "80%" },
        { label: "Page Views (Est.)", value: Math.round(clicks * 0.9), color: "#93c5fd", width: "60%" }, // Mock: 90% of clicks load page
        { label: "Checkouts (Est.)", value: Math.round(conversions * 3), color: "#bfdbfe", width: "40%" }, // Mock: 3x conversions
        { label: "Compras", value: conversions, color: "#dbeafe", width: "20%" },
    ];

    return (
        <Card className="h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Funil de Tráfego</h3>
                <div className="p-2 bg-gray-800 rounded-lg">
                    <span className="text-xs text-gray-400">Taxa de Conversão da Loja: </span>
                    <span className="text-sm font-bold text-green-400 ml-1">
                        {impressions > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0}% (Click &rarr; Purch)
                    </span>
                </div>
            </div>

            <div className="flex flex-col gap-2 items-center justify-center h-[300px]">
                {steps.map((step, i) => (
                    <div key={i} className="relative flex items-center justify-center group" style={{ width: step.width }}>
                        {/* Funnel Shape Layer */}
                        <div
                            className="absolute inset-0 z-0 transform skew-x-12 opacity-80"
                            style={{ backgroundColor: step.color, borderRadius: '4px' }}
                        />
                        <div
                            className="absolute inset-0 z-0 transform -skew-x-12 opacity-80"
                            style={{ backgroundColor: step.color, borderRadius: '4px' }}
                        />

                        {/* Content Layer */}
                        <div className="relative z-10 w-full text-center py-3">
                            <div className="text-xs font-medium text-gray-900 uppercase tracking-widest opacity-70">{step.label}</div>
                            <div className="text-lg font-bold text-gray-900">
                                {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(step.value)}
                            </div>
                        </div>

                        {/* Conversion Badge on Right */}
                        {i < steps.length - 1 && (
                            <div className="absolute -right-24 top-1/2 -translate-y-1/2 text-xs text-gray-400 hidden group-hover:block">
                                ↓ {((steps[i + 1].value / step.value) * 100).toFixed(1)}%
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
};

const MainChart = ({ data }: { data: DailyMetric[] }) => {
    return (
        <Card className="h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Evolução Diária</h3>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-xs text-green-400"><div className="w-2 h-2 rounded-full bg-green-400" /> Vendas</span>
                    <span className="flex items-center gap-1 text-xs text-blue-500"><div className="w-2 h-2 rounded-full bg-blue-500" /> Investimento</span>
                </div>
            </div>
            <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#9ca3af"
                        fontSize={12}
                        tickFormatter={(val) => val.split("-")[2]} // Only Show Day
                        tickMargin={10}
                    />
                    <YAxis yAxisId="left" stroke="#4ade80" fontSize={12} tickFormatter={(v) => v} />
                    <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={12} />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="spend"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorSpend)"
                        name="Investimento (R$)"
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="conversions"
                        stroke="#4ade80"
                        fillOpacity={1}
                        fill="url(#colorSales)"
                        name="Compras"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};

const CampaignsTable = ({ campaigns }: { campaigns: CampaignMetric[] }) => {
    return (
        <Card className="overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">Performance por Campanha</h3>
                <button className="p-2 hover:bg-gray-800 rounded-lg text-gray-400">
                    <Download size={16} />
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="p-4 font-medium">Campanha</th>
                            <th className="p-4 font-medium text-right">Investimento</th>
                            <th className="p-4 font-medium text-right">Impressões</th>
                            <th className="p-4 font-medium text-right">Cliques</th>
                            <th className="p-4 font-medium text-right">Compras</th>
                            <th className="p-4 font-medium text-right">CPA</th>
                            <th className="p-4 font-medium text-right">ROAS</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-sm text-gray-300">
                        {campaigns.map((c, i) => (
                            <tr key={i} className="hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 font-medium text-white max-w-[200px] truncate" title={c.name}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${i < 3 ? 'bg-green-500' : 'bg-gray-500'}`} />
                                        {c.name}
                                    </div>
                                </td>
                                <td className="p-4 text-right font-mono text-blue-400">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.spend)}
                                </td>
                                <td className="p-4 text-right">{c.impressions.toLocaleString()}</td>
                                <td className="p-4 text-right">{c.clicks.toLocaleString()}</td>
                                <td className="p-4 text-right text-green-400 font-bold">{c.conversions}</td>
                                <td className="p-4 text-right">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.cpa)}
                                </td>
                                <td className="p-4 text-right">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${c.roas > 2 ? 'bg-green-900/30 text-green-400' :
                                        c.roas > 1 ? 'bg-yellow-900/30 text-yellow-400' :
                                            'bg-red-900/30 text-red-400'
                                        }`}>
                                        {c.roas.toFixed(2)}x
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

// --- Main Layout ---

export default function MetaAdsDashboardV2({ totals, daily, campaigns, dateRangeLabel }: DashboardProps) {

    // Safety check for empty daily charts
    const safeDaily = daily.length > 0 ? daily : [{ date: new Date().toISOString().split('T')[0], spend: 0, impressions: 0, clicks: 0, conversions: 0, value: 0 }];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 space-y-8">

            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96C18.34 21.21 22 17.06 22 12.06C22 6.53 17.5 2.04 12 2.04Z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Meta Ads Dashboard</h1>
                        <p className="text-gray-400 text-sm">Relatório Geral | {dateRangeLabel}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg text-sm transition-colors">
                        <Filter size={16} />
                        Filtros
                    </button>
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        <Download size={16} />
                        Exportar
                    </button>
                    <div className="bg-gray-800 px-4 py-2 rounded-lg text-sm text-gray-300 border border-gray-700">
                        📅 Últimos 90 Dias
                    </div>
                </div>
            </header>

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard
                    title="Investimento"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.spend)}
                    subValue="-28.2% (vs prev)"
                    chartData={safeDaily}
                    dataKey="spend"
                    color="#f87171" // Red
                />
                <MetricCard
                    title="Faturamento (Valor Conv.)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.value)}
                    subValue="-22.4%"
                    chartData={safeDaily}
                    dataKey="value"
                    color="#4ade80" // Green
                />
                <MetricCard
                    title="Compras"
                    value={totals.conversions.toLocaleString()}
                    subValue="-23.8%"
                    chartData={safeDaily}
                    dataKey="conversions"
                    color="#60a5fa" // Blue
                />
                <MetricCard
                    title="ROAS Médio"
                    value={totals.roas.toFixed(2)}
                    subValue="+8.1%"
                    chartData={safeDaily}
                    dataKey="roas" // Note: ROAS per day might need calculation in daily, assuming 'value/spend' or just passed
                    color="#c084fc" // Purple
                />
                <MetricCard
                    title="Custo por Compra (CPA)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.cpa)}
                    subValue="-5.8%"
                    chartData={safeDaily}
                    dataKey="spend" // Proxy using spend pattern or need daily CPA
                    color="#fbbf24" // Yellow
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Funnel (Left - 1 col) */}
                <div className="lg:col-span-1">
                    <FunnelChart
                        impressions={totals.impressions}
                        clicks={totals.clicks}
                        conversions={totals.conversions}
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
                <div className="lg:col-span-2">
                    <CampaignsTable campaigns={campaigns} />
                </div>

                {/* Best Ads Pie (1 col) */}
                <Card>
                    <h3 className="text-lg font-semibold text-white mb-6">Melhores Campanhas (Conversões)</h3>
                    <div className="h-[300px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={campaigns.slice(0, 5)}
                                    dataKey="conversions"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                >
                                    {campaigns.slice(0, 5).map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={["#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe", "#dbeafe"][index % 5]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>
        </div>
    );
}
