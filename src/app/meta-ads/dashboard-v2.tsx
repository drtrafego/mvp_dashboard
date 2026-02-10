
"use client";

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell // Added Cell if used, or remove if not
} from "recharts";
import { HelpCircle, RefreshCw, RefreshCcw } from "lucide-react";
import { DatePickerWithRange } from "../../components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTransition } from "react";
import { syncMetaAds } from "@/server/actions/sync";
import { useRouter } from "next/navigation";

// --- Types ---
type DailyMetric = {
    date: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    value: number;
    roas: number;
    leads?: number;
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
    // Optional for Ads
    adName?: string;
    campaignName?: string;
    // New Metrics
    hookRate: number;
    holdRate: number;
    connectRate: number;
    leads?: number; // Ensure leads is typed if used
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
        // New Totals
        videoViews3s: number;
        videoThruplays: number;
        linkClicks: number;
        landingPageViews: number;
        leads: number;
    };
    daily: DailyMetric[];
    campaigns: CampaignMetric[];
    ads: CampaignMetric[]; // Reusing type as structure is identical
    dateRangeLabel: string;
    mode?: 'ecommerce' | 'capture';
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

// Utility to darken color for gradient
function adjustColorBrightness(hex: string, percent: number) {
    const num = parseInt(hex.replace("#", ""), 16),
        amt = Math.round(2.55 * percent),
        R = (num >> 16) + amt,
        G = (num >> 8 & 0x00FF) + amt,
        B = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

// Funnel Layer with 3D elliptical effect
const FunnelLayer = ({
    label,
    value,
    widthPercent,
    color,
    zIndex,
    isBottom = false
}: {
    label: string,
    value: string | number,
    widthPercent: number,
    color: string,
    zIndex: number,
    isBottom?: boolean
}) => {
    return (
        <div
            className="relative flex items-center justify-center -mb-4"
            style={{
                width: `${widthPercent}%`,
                height: '70px',
                zIndex: zIndex,
            }}
        >
            {/* The Shape (Trapezoid + Ellipse for 3D) */}
            <div
                className="absolute inset-x-0 top-0 bottom-0 shadow-2xl"
                style={{
                    background: `linear-gradient(180deg, ${color} 0%, ${adjustColorBrightness(color, -30)} 100%)`,
                    clipPath: isBottom
                        ? 'polygon(0 0, 100% 0, 90% 85%, 10% 85%)'
                        : 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                    borderRadius: '0 0 20px 20px', // Soften corners
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}
            />

            {/* Top Oval (The "Opening") - Only visible if not covered by layer above, 
                but we usually cover it. For the top layer, we need a distinct oval. */}

            {/* Highlight */}
            <div
                className="absolute inset-0 opacity-30"
                style={{
                    background: `linear-gradient(90deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)`,
                    clipPath: 'polygon(0 0, 100% 0, 85% 100%, 15% 100%)',
                }}
            />

            {/* Content */}
            <div className="relative z-10 text-center flex flex-col items-center justify-center pt-2 drop-shadow-lg">
                <span className="text-blue-100 text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
                <span className="text-white text-lg font-black tracking-tight">{value}</span>
            </div>
        </div>
    );
}

const TrafficFunnel = ({
    impressions,
    clicks,
    conversions,
    frequency,
    cpm,
    label = "Compras",
    landingPageViews, // New Prop
    linkClicks // New Prop
}: {
    impressions: number;
    clicks: number;
    conversions: number;
    frequency: number;
    cpm: number;
    label?: string;
    landingPageViews?: number;
    linkClicks?: number;
}) => {

    // Derived Metrics
    // Real Data or Derivatives
    // We need to update TrafficFunnel signature to accept landingPageViews
    const safePageViews = landingPageViews || Math.round(clicks * 0.8); // Fallback to 80% if no data (User request restoration)
    // Mock "Checkouts" removed as requested flow is Impressions -> Clicks -> PV -> Leads

    // Rates for side display
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const connectRate = linkClicks && linkClicks > 0 ? (safePageViews / linkClicks) * 100 : (clicks > 0 ? (safePageViews / clicks) * 100 : 0);
    const conversionRate = safePageViews > 0 ? (conversions / safePageViews) * 100 : 0;

    const formatUncertain = (val: number) => val === 0 ? "0" : new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(val);

    return (
        <Card className="h-full bg-[#0f111a] border-gray-800 relative overflow-visible flex flex-col justify-between">

            {/* Title Layer */}
            <div className="absolute top-6 left-0 right-0 z-20 flex justify-center pointer-events-none">
                <h3 className="text-lg font-semibold text-gray-200 tracking-tight">Funil de Tráfego</h3>
            </div>
            {/* Refresh Icon Mock Removed */}

            {/* Funnel Area */}
            <div className="flex flex-1 pt-14 pb-2 items-center">

                {/* Funnel Visual (Center-Left) */}
                <div className="flex flex-col items-center w-[60%] mx-auto relative z-10">
                    {/* Top Oval (Impressions/Entry) */}
                    <div className="w-[100%] h-6 bg-[#0ea5e9] rounded-[50%] opacity-50 absolute -top-3 z-0 blur-sm"></div>
                    <div className="w-[100%] h-4 bg-[#0284c7] rounded-[50%] absolute -top-2 z-5 border border-white/10"></div>

                    <FunnelLayer
                        label="Visualizações"
                        value={formatUncertain(impressions)}
                        widthPercent={100}
                        color="#38bdf8" // Sky 400
                        zIndex={5}
                    />
                    <FunnelLayer
                        label="Cliques"
                        value={formatUncertain(clicks)}
                        widthPercent={85}
                        color="#0ea5e9" // Sky 500
                        zIndex={4}
                    />
                    <FunnelLayer
                        label="Pg View"
                        value={formatUncertain(safePageViews)}
                        widthPercent={70}
                        color="#0284c7" // Sky 600
                        zIndex={3}
                    />
                    <FunnelLayer
                        label={label}
                        value={formatUncertain(conversions)}
                        widthPercent={55}
                        color="#0369a1" // Sky 700
                        zIndex={2}
                        isBottom={true}
                    />
                </div>

                {/* Metrics List (Right Side - Absolute/Fixed pos relative to container) */}
                {/* Metrics List (Right Side) */}
                <div className="absolute right-4 top-16 bottom-20 flex flex-col justify-between py-4 text-right z-20">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">CPM Médio</div>
                        <div className="text-xl font-bold text-white">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cpm || 0)}</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Taxa de Cliques</div>
                        <div className="text-xl font-bold text-white">{ctr.toFixed(2)}%</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Connect Rate</div>
                        <div className="text-xl font-bold text-white">{connectRate.toFixed(2)}%</div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-gray-400 uppercase tracking-widest">Taxa de Conversão</div>
                        <div className="text-xl font-bold text-white">{conversionRate.toFixed(2)}%</div>
                    </div>
                </div>

            </div>

            {/* Footer Metrics (Bottom Cards) - Removed as requested (duplicate info) */}
        </Card>
    );
};

const MainChart = ({ data, label = 'Compras' }: { data: DailyMetric[], label?: string }) => {
    const isLeads = label === 'Leads';
    const mainColor = isLeads ? "#f472b6" : "#22c55e"; // Pink for Leads, Green for Sales
    const secondaryColor = "#3b82f6"; // Blue for Spend/Value

    const totalValue = data.reduce((acc, curr) => acc + (isLeads ? (curr.leads || 0) : curr.conversions), 0);
    const valueKey = isLeads ? "leads" : "conversions";
    const valueName = isLeads ? "Leads" : "Compras";
    const moneyKey = isLeads ? "spend" : "value";
    const moneyName = isLeads ? "Investimento" : "Faturamento";

    return (
        <Card className="h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6 pl-2">
                <div className="flex flex-col">
                    <h3 className="text-3xl font-bold text-white mb-1">
                        {totalValue.toLocaleString()}
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-gray-400">Total {valueName}</span>
                        {/* Placeholder trend for now */}
                        <span className="text-xs text-green-400 bg-green-900/30 px-1.5 py-0.5 rounded ml-2">▲ 22.4%</span>
                    </div>
                </div>

                <div className="flex gap-6 pr-4">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ backgroundColor: mainColor, boxShadow: `0 0 10px ${mainColor}80` }}></span>
                        <span className="text-sm text-gray-300">{valueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        <span className="text-sm text-gray-300">{moneyName}</span>
                    </div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="mainColorPrimary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={mainColor} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={mainColor} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="mainColorSecondary" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={secondaryColor} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={secondaryColor} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                    <XAxis
                        dataKey="date"
                        stroke="#6b7280"
                        fontSize={11}
                        tickFormatter={(val) => {
                            if (!val) return "";
                            const parts = val.split("/");
                            if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
                            return val;
                        }}
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
                        dataKey={moneyKey}
                        stroke={secondaryColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#mainColorSecondary)"
                        name={moneyName}
                    />
                    <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey={valueKey}
                        stroke={mainColor}
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#mainColorPrimary)"
                        name={valueName}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
    );
};

// --- Main Layout ---

import { useState } from "react";

// --- Heatmap Helper ---
// Simplified to return consistent, readable background styles
const getHeatmapStyle = (value: number, min: number, max: number, inverse = false) => {
    if (min === max || isNaN(value)) return {}; // No style if no range

    let ratio = (value - min) / (max - min);
    if (inverse) ratio = 1 - ratio; // For CPA/CPL (lower is better)

    // Using solid, low-opacity backgrounds that ensure text remains readable
    // We stick to a blueish tint for consistency with the dark theme
    // Low: Transparent/Very subtle
    // Medium: Visible Blue
    // High: Stronger Blue

    // We return a style object directly
    if (ratio < 0.2) return {};
    if (ratio < 0.5) return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'white' }; // Blue 500 at 15%
    if (ratio < 0.8) return { backgroundColor: 'rgba(59, 130, 246, 0.30)', color: 'white' }; // Blue 500 at 30%
    return { backgroundColor: 'rgba(59, 130, 246, 0.50)', color: 'white', fontWeight: 'bold' }; // Blue 500 at 50%
};

export default function MetaAdsDashboardV2({ totals, daily, campaigns, ads, mode = 'ecommerce' }: DashboardProps) {
    const [activeTab, setActiveTab] = useState<'campaigns' | 'ads'>('campaigns'); // Cleaned up type
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleSync = () => {
        startTransition(async () => {
            try {
                toast.info("Iniciando sincronização com Meta Ads...");
                const result = await syncMetaAds(30); // Sync last 30 days

                if (result.success) {
                    toast.success(`Sincronização concluída! ${result.count} registros atualizados.`);
                    router.refresh();
                } else {
                    toast.error(`Erro na sincronização: ${result.error || "Erro desconhecido"}`);
                }
            } catch (error) {
                toast.error("Falha ao conectar com o servidor.");
                console.error(error);
            }
        });
    };

    // safeMap helpers - Typed 
    const safeMap = (arr: CampaignMetric[], key: keyof CampaignMetric) => arr.map(i => Number(i[key] || 0));
    // safeMapDeep is redundant now, removed.

    const safeDaily = daily.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    }));

    // Prepare Data for Table based on Active Tab
    const tableData = activeTab === 'ads' ? ads : campaigns;
    const isCapture = mode === 'capture';

    // Min/Max for Heatmap - Calculated safely
    const spendVals = safeMap(tableData, 'spend');
    const maxSpend = Math.max(...spendVals, 0);
    const minSpend = Math.min(...spendVals, 0);

    const resultApi = isCapture ? 'leads' : 'conversions'; // 'leads' key exists now
    const resultVals = safeMap(tableData, resultApi as keyof CampaignMetric);
    const maxResults = Math.max(...resultVals, 0);
    const minResults = Math.min(...resultVals, 0);

    const costApi = 'cpa'; // CPL is stored as CPA in metrics
    const costVals = safeMap(tableData, costApi);
    const maxCost = Math.max(...costVals, 0);
    const minCost = Math.min(...costVals, 0);

    const roasVals = isCapture ? safeMap(tableData, 'ctr') : safeMap(tableData, 'roas');
    const maxRoas = Math.max(...roasVals, 0);
    const minRoas = Math.min(...roasVals, 0);


    return (
        <div className="min-h-screen bg-[#050505] text-gray-200 p-6 md:p-8 space-y-6 font-sans">
            {/* Header with Title and Date Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-white tracking-tight">Visão Geral</h2>
                    <p className="text-gray-500 text-sm mt-1">Acompanhe seus indicadores de performance</p>
                </div>
                <div className="flex items-center gap-3 bg-[#0f111a] p-1 rounded-lg border border-gray-800/50">
                    <Button
                        onClick={handleSync}
                        disabled={isPending}
                        variant="ghost"
                        size="sm"
                        className="text-gray-400 hover:text-white"
                    >
                        <RefreshCcw className={`w-4 h-4 mr-2 ${isPending ? "animate-spin" : ""}`} />
                        {isPending ? "Sincronizando..." : "Sincronizar Agora"}
                    </Button>
                    <div className="h-6 w-px bg-gray-800" />
                    <DatePickerWithRange />
                </div>
            </div>

            {/* KPI Cards Row 1: Investment, Impressions, Clicks, CTR, Page Views, Leads */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <MetricCard
                    title="Investimento"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.spend)}
                    subValue={totals.spend === 0 ? "0%" : "28.2%"}
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="spend"
                    color="#ef4444"
                />
                <MetricCard
                    title="Visualizações"
                    value={new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(totals.impressions)}
                    subValue="--"
                    trend={0}
                    chartData={safeDaily}
                    dataKey="impressions"
                    color="#3b82f6"
                />
                <MetricCard
                    title="Cliques"
                    value={new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(totals.clicks)}
                    subValue="--"
                    trend={0}
                    chartData={safeDaily}
                    dataKey="clicks"
                    color="#a855f7"
                />
                <MetricCard
                    title="CTR"
                    value={totals.ctr.toFixed(2) + "%"}
                    subValue="Avg"
                    trend={1}
                    chartData={safeDaily}
                    dataKey="clicks" // Proxy
                    color="#eab308"
                />
                <MetricCard
                    title="Page Views"
                    value={new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(totals.landingPageViews || 0)}
                    subValue="LP Views"
                    trend={0}
                    chartData={safeDaily}
                    dataKey="clicks" // Proxy
                    color="#22c55e"
                />
                <MetricCard
                    title="Leads"
                    value={totals.leads.toLocaleString()}
                    subValue="Total"
                    trend={1}
                    chartData={safeDaily}
                    dataKey="conversions" // Proxy if leads not in daily
                    color="#f97316"
                />
            </div>

            {/* KPI Cards Row 2: CPL, CPM, Connect Rate, Hook Rate, Hold Rate */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <MetricCard
                    title="Custo por Lead (CPL)"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.leads > 0 ? totals.spend / totals.leads : 0)}
                    subValue="CPL"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="spend" // Proxy
                    color="#ef4444"
                />
                <MetricCard
                    title="CPM"
                    value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.cpm)}
                    subValue="CPM"
                    trend={-1}
                    chartData={safeDaily}
                    dataKey="impressions" // Proxy
                    color="#64748b"
                />
                <MetricCard
                    title="Connect Rate"
                    value={(totals.linkClicks > 0
                        ? (totals.landingPageViews / totals.linkClicks)
                        : (totals.clicks > 0 ? totals.landingPageViews / totals.clicks : 0)
                        * 100).toFixed(2) + "%"}
                    subValue={totals.linkClicks > 0 ? "PV / Link Click" : "PV / Clique"}
                    trend={0}
                    chartData={safeDaily}
                    dataKey="clicks"
                    color="#f472b6"
                />
                <MetricCard
                    title="Hook Rate (3s)"
                    value={totals.impressions > 0 ? ((totals.videoViews3s / totals.impressions) * 100).toFixed(2) + "%" : "0.00%"}
                    subValue="3s / Impressions"
                    trend={0}
                    chartData={safeDaily}
                    dataKey="impressions"
                    color="#2dd4bf"
                />
                <MetricCard
                    title="Hold Rate"
                    value={totals.videoViews3s > 0 ? ((totals.videoThruplays / totals.videoViews3s) * 100).toFixed(2) + "%" : "0.00%"}
                    subValue="Thru / 3s"
                    trend={0}
                    chartData={safeDaily}
                    dataKey="impressions"
                    color="#fbbf24"
                />
            </div>



            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Funnel (Left - 50%) */}
                <div className="lg:col-span-1">
                    <TrafficFunnel
                        impressions={totals.impressions}
                        clicks={totals.clicks}
                        conversions={totals.conversions}
                        cpm={totals.cpm}
                        frequency={totals.frequency}
                        label={isCapture ? "Leads" : "Compras"}
                        landingPageViews={totals.landingPageViews}
                        linkClicks={totals.linkClicks}
                    />
                </div>

                {/* Main Line Chart (Right - 50%) */}
                <div className="lg:col-span-1">
                    <MainChart data={safeDaily} label={isCapture ? "Leads" : "Compras"} />
                </div>
            </div>

            {/* Bottom Section: Table & Pie */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Table (2 cols) */}
                <Card className="lg:col-span-2 overflow-hidden !p-0 border-gray-800">
                    <div className="p-4 border-b border-gray-800 bg-[#12141f] flex justify-between items-center">
                        <div className="flex gap-4 text-sm font-medium">
                            <button
                                onClick={() => setActiveTab('campaigns')}
                                className={`pb-4 -mb-4 transition-colors ${activeTab === 'campaigns' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Campanhas
                            </button>
                            <button
                                onClick={() => setActiveTab('ads')}
                                className={`pb-4 -mb-4 transition-colors ${activeTab === 'ads' ? 'text-white border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                Anúncios
                            </button>
                        </div>
                        <HelpCircle size={16} className="text-gray-600" />
                    </div>
                    <div className="overflow-x-auto max-h-[500px]">
                        <table className="w-full text-left relative border-collapse">
                            <thead className="bg-[#0f111a] sticky top-0 z-10 shadow-md">
                                <tr className="text-gray-400 text-[11px] uppercase tracking-wider">
                                    <th className="px-4 py-3 font-medium w-6 bg-[#0f111a]">#</th>
                                    <th className="px-4 py-3 font-medium bg-[#0f111a]">Nome</th>
                                    {activeTab === 'campaigns' && isCapture && (
                                        <th className="px-4 py-3 font-medium bg-[#0f111a]">Melhor Anúncio</th>
                                    )}
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">Investimento</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">Impressões</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">Cliques</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">CTR</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">Pg Views</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">{isCapture ? 'Leads' : 'Compras'}</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">{isCapture ? 'CPL' : 'CPA'}</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-400 uppercase tracking-wider">{isCapture ? 'CTR (L)' : 'ROAS'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50 text-sm">
                                {tableData.map((item, i) => {
                                    // Use type-safe properties now that CampaignMetric has them
                                    const resultVal = isCapture ? item.leads || 0 : item.conversions;
                                    const costVal = isCapture ? ((item.leads || 0) > 0 ? item.spend / (item.leads || 1) : 0) : item.cpa; // Calculate CPL dynamically if needed
                                    const finalVal = isCapture ? item.ctr : item.roas; // Not displaying CTR again at end, maybe ROAS or empty for Capture? 
                                    // Actually user screenshot shows a last column.
                                    // Let's stick to the Body Order:
                                    // 1. Spend
                                    // 2. Impressions
                                    // 3. Clicks
                                    // 4. CTR (Link Click CTR)
                                    // 5. Page Views
                                    // 6. Leads
                                    // 7. CPL
                                    // 8. ROAS (or something else for capture) - User screenshot had CTR at end? 
                                    // Let's make the last column ROAS for Sales, and maybe Hook Rate or nothing for Capture? 
                                    // User screenshot showed 'CTR' at the end. But they already have CTR in col 4.
                                    // Let's match the columns I defined in Header above.

                                    // Find Best Ad for this Campaign (if in Campaign tab & capture mode)
                                    let bestAdName = "--";
                                    if (activeTab === 'campaigns' && isCapture) {
                                        const campaignAds = ads.filter(a => a.campaignName === item.name);
                                        if (campaignAds.length > 0) {
                                            // Sort by leads (desc) then CPL (asc)
                                            const sortedAds = campaignAds.sort((a, b) => {
                                                const leadsA = a.leads || 0;
                                                const leadsB = b.leads || 0;
                                                if (leadsB !== leadsA) return leadsB - leadsA;
                                                return a.cpa - b.cpa;
                                            });
                                            bestAdName = sortedAds[0].adName || "--";
                                        }
                                    }

                                    return (
                                        <tr key={i} className="hover:bg-blue-500/5 transition-colors cursor-pointer group border-b border-gray-800/30">
                                            <td className="px-4 py-3 text-gray-500 text-xs">{i + 1}.</td>
                                            <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate group-hover:text-blue-400 transition-colors" title={(activeTab === 'ads' && item.adName) ? item.adName : item.name}>
                                                {(activeTab === 'ads' && item.adName) ? item.adName : item.name}
                                            </td>
                                            {activeTab === 'campaigns' && isCapture && (
                                                <td className="px-4 py-3 text-gray-400 text-xs italic truncate max-w-[150px]" title={bestAdName}>
                                                    {bestAdName}
                                                </td>
                                            )}
                                            <td className="px-4 py-3 text-right font-mono text-xs text-gray-300" style={getHeatmapStyle(item.spend, minSpend, maxSpend)}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.spend)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-gray-300" style={getHeatmapStyle(item.impressions, 0, 0)}>
                                                {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(item.impressions)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-gray-300" style={getHeatmapStyle(item.clicks, 0, 0)}>
                                                {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format(item.clicks)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-xs text-gray-300" style={getHeatmapStyle(item.ctr, 0, 0)}>
                                                {item.ctr.toFixed(2)}%
                                            </td>
                                            {/* Page Views Column - New */}
                                            <td className="px-4 py-3 text-right font-mono text-xs text-gray-300" style={getHeatmapStyle((item as any).landingPageViews || 0, 0, 0)}>
                                                {new Intl.NumberFormat('pt-BR', { notation: "compact" }).format((item as any).landingPageViews || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300 font-bold" style={getHeatmapStyle(resultVal, minResults, maxResults)}>
                                                {resultVal}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300 text-xs" style={getHeatmapStyle(costVal, minCost, maxCost, true)}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(costVal)}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-300" style={getHeatmapStyle(finalVal, isCapture ? 0 : minRoas, isCapture ? 5 : maxRoas)}>
                                                {isCapture ? `${finalVal.toFixed(2)}%` : (
                                                    // For ROAS Color, we just use the heatmap style if it's high enough, effectively overriding the text color
                                                    // Or stick to the numeric coloring? Let's use the heatmap bg but keep the logic simple.
                                                    <span className={item.roas > 2 ? 'text-green-400' : item.roas > 1 ? 'text-yellow-400' : 'text-red-400'}>
                                                        {item.roas.toFixed(2)}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Best Ads Pie (1 col) */}
                < Card className="border-gray-800" >
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
                                    data={isCapture ? ads.slice(0, 5) : campaigns.slice(0, 5)} // Use Ads for Capture
                                    dataKey={isCapture ? "leads" : "conversions"} // Use leads for Capture
                                    nameKey={isCapture ? "adName" : "name"} // Use adName for Capture
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
                        <div className="space-y-1 mt-2">
                            {(isCapture ? ads : campaigns).slice(0, 3).map((c, i) => (
                                <div key={i} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2 max-w-[70%]">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ["#3b82f6", "#22c55e", "#a855f7"][i] }}></div>
                                        <span className="truncate text-gray-400">{(isCapture && c.adName) ? c.adName : c.name}</span>
                                    </div>
                                    <span className="text-white font-medium">{isCapture ? c.leads : c.conversions}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card >
            </div >
        </div >
    );
}
