"use client";

import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';
import { DollarSign, MousePointerClick, Eye, Target, BarChart3 } from "lucide-react";

// ===== TIPOS =====
type CampaignRow = {
    name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    conversionValue: number;
    ctr: number;
    cpc: number;
    cpa: number;
};

type GenderData = {
    name: string;
    value: number;
};

type KeywordRow = {
    keyword: string;
    clicks: number;
    conversions: number;
};

type DailyMetric = {
    date: string;
    spend: number;
    conversions: number;
    costPerConversion: number;
};

type GoogleAdsDashboardProps = {
    summary: {
        totalSpend: number;
        totalConversions: number;
        costPerConversion: number;
        totalClicks: number;
        avgCpc: number;
        totalImpressions: number;
        ctr: number;
        conversionRate: number;
    };
    daily: DailyMetric[];
    campaigns: CampaignRow[];
    keywords: KeywordRow[];
    genderData: GenderData[];
};

// ===== CORES =====
const COLORS = {
    spend: "#22c55e",       // Verde
    conversions: "#3b82f6", // Azul
    costConv: "#ef4444",    // Vermelho
    clicks: "#f59e0b",      // Amarelo
    cpc: "#a855f7",         // Roxo
};

const GENDER_COLORS = ["#ec4899", "#3b82f6", "#6b7280"];

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatNumber = (val: number) => val.toLocaleString('pt-BR');
const formatPercent = (val: number) => `${val.toFixed(2)}%`;

// ===== COMPONENTE PRINCIPAL =====
export default function GoogleAdsDashboard({ summary, daily, campaigns, keywords, genderData }: GoogleAdsDashboardProps) {

    return (
        <div className="space-y-6">
            {/* ===== ROW 1: KPI Cards ===== */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <KPICard
                    title="Investimento"
                    value={formatCurrency(summary.totalSpend)}
                    icon={<DollarSign className="w-4 h-4" />}
                    color="emerald"
                    sparkData={daily.map(d => d.spend)}
                    sparkColor={COLORS.spend}
                />
                <KPICard
                    title="Conversões"
                    value={formatNumber(summary.totalConversions)}
                    icon={<Target className="w-4 h-4" />}
                    color="blue"
                    sparkData={daily.map(d => d.conversions)}
                    sparkColor={COLORS.conversions}
                />
                <KPICard
                    title="Custo por Conversão"
                    value={formatCurrency(summary.costPerConversion)}
                    icon={<BarChart3 className="w-4 h-4" />}
                    color="red"
                    sparkData={daily.map(d => d.costPerConversion)}
                    sparkColor={COLORS.costConv}
                />
                <KPICard
                    title="Cliques"
                    value={formatNumber(summary.totalClicks)}
                    icon={<MousePointerClick className="w-4 h-4" />}
                    color="amber"
                    sparkData={daily.map(d => d.spend > 0 ? d.spend / Math.max(d.conversions, 1) : 0)}
                    sparkColor={COLORS.clicks}
                />
                <KPICard
                    title="CPC Médio"
                    value={formatCurrency(summary.avgCpc)}
                    icon={<Eye className="w-4 h-4" />}
                    color="purple"
                    sparkData={daily.map(d => d.costPerConversion)}
                    sparkColor={COLORS.cpc}
                />
            </div>

            {/* ===== ROW 2: Keywords + Chart + Donut ===== */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Keywords Table (Left) */}
                <div className="lg:col-span-3">
                    <DarkCard title="Palavras-chave" className="h-full">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase border-b border-gray-700/50">
                                    <th className="text-left pb-2 font-medium">Keyword</th>
                                    <th className="text-right pb-2 font-medium">Cliques</th>
                                    <th className="text-right pb-2 font-medium">Conv.</th>
                                </tr>
                            </thead>
                            <tbody>
                                {keywords.length > 0 ? keywords.map((kw, i) => (
                                    <tr key={i} className="border-b border-gray-800/50 hover:bg-white/5 transition-colors">
                                        <td className="py-2.5 text-gray-300 text-xs font-medium truncate max-w-[120px]">{kw.keyword}</td>
                                        <td className="py-2.5 text-right text-white font-semibold text-xs">{formatNumber(kw.clicks)}</td>
                                        <td className="py-2.5 text-right text-emerald-400 font-semibold text-xs">{formatNumber(kw.conversions)}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-gray-500 text-xs">
                                            Dados serão exibidos após sincronização
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </DarkCard>
                </div>

                {/* Performance Chart (Center) */}
                <div className="lg:col-span-6">
                    <DarkCard title="Performance ao Longo do Tempo" className="h-full">
                        <div className="flex items-center gap-4 mb-4">
                            <LegendDot color={COLORS.spend} label="Investimento" />
                            <LegendDot color={COLORS.conversions} label="Conversões" />
                            <LegendDot color={COLORS.costConv} label="Cost / conv." />
                        </div>
                        <div className="h-[220px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={daily}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis
                                        dataKey="date"
                                        fontSize={10}
                                        tickFormatter={(val) => {
                                            const d = new Date(val);
                                            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
                                        }}
                                        stroke="#64748b"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        fontSize={10}
                                        stroke="#64748b"
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#0f172a',
                                            borderColor: '#334155',
                                            borderRadius: '8px',
                                            color: '#f8fafc',
                                            fontSize: '12px'
                                        }}
                                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="spend"
                                        name="Investimento"
                                        stroke={COLORS.spend}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="conversions"
                                        name="Conversões"
                                        stroke={COLORS.conversions}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="costPerConversion"
                                        name="Custo/Conv."
                                        stroke={COLORS.costConv}
                                        strokeWidth={2}
                                        dot={false}
                                        activeDot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </DarkCard>
                </div>

                {/* Conversão por Gênero (Right) */}
                <div className="lg:col-span-3">
                    <DarkCard title="Conversão por Gênero" className="h-full">
                        <div className="h-[260px] flex items-center justify-center">
                            {genderData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={genderData}
                                            cx="50%"
                                            cy="45%"
                                            innerRadius={55}
                                            outerRadius={80}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {genderData.map((_entry, index) => (
                                                <Cell key={`gender-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                borderColor: '#334155',
                                                borderRadius: '8px',
                                                color: '#f8fafc',
                                                fontSize: '12px'
                                            }}
                                            formatter={(value: number | undefined) => [formatNumber(value ?? 0), 'Conversões']}
                                        />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-gray-500 text-xs">Dados serão exibidos após sincronização</p>
                            )}
                        </div>
                    </DarkCard>
                </div>
            </div>

            {/* ===== ROW 3: Campanhas Table ===== */}
            <DarkCard title="Campanhas">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-gray-400 text-xs uppercase border-b border-gray-700/50">
                                <th className="text-left py-3 font-medium w-8">#</th>
                                <th className="text-left py-3 font-medium">Campanha</th>
                                <th className="text-right py-3 font-medium">Investimento</th>
                                <th className="text-right py-3 font-medium">Conversões</th>
                                <th className="text-right py-3 font-medium">Valor Conv.</th>
                                <th className="text-right py-3 font-medium">Cliques</th>
                                <th className="text-right py-3 font-medium">CTR</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length > 0 ? campaigns.map((camp, i) => (
                                <tr key={i} className="border-b border-gray-800/30 hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-gray-500 text-xs">{i + 1}.</td>
                                    <td className="py-3 text-gray-200 font-medium text-xs truncate max-w-[250px]">{camp.name}</td>
                                    <td className="py-3 text-right text-emerald-400 font-semibold text-xs">{formatCurrency(camp.spend)}</td>
                                    <td className="py-3 text-right text-blue-400 font-semibold text-xs">{formatNumber(camp.conversions)}</td>
                                    <td className="py-3 text-right text-amber-400 font-semibold text-xs">{formatCurrency(camp.conversionValue)}</td>
                                    <td className="py-3 text-right text-white font-semibold text-xs">{formatNumber(camp.clicks)}</td>
                                    <td className="py-3 text-right text-purple-400 font-semibold text-xs">{formatPercent(camp.ctr)}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-gray-500 text-xs">
                                        Nenhuma campanha encontrada. Os dados serão sincronizados automaticamente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </DarkCard>

            {/* ===== ROW 4: Bottom KPIs ===== */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <BottomKPI label="CTR" value={formatPercent(summary.ctr)} />
                <BottomKPI label="Taxa de Conversão" value={formatPercent(summary.conversionRate)} />
                <BottomKPI label="Impressões" value={formatNumber(summary.totalImpressions)} />
                <BottomKPI label="CPC Médio" value={formatCurrency(summary.avgCpc)} />
            </div>
        </div>
    );
}

// ===== COMPONENTES AUXILIARES =====

function KPICard({ title, value, icon, color, sparkData, sparkColor }: {
    title: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    sparkData: number[];
    sparkColor: string;
}) {
    // Mini sparkline data
    const chartData = sparkData.map((v, i) => ({ i, v }));

    const colorMap: Record<string, string> = {
        emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
        blue: 'from-blue-500/20 to-blue-500/5 text-blue-400 border-blue-500/20',
        red: 'from-red-500/20 to-red-500/5 text-red-400 border-red-500/20',
        amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
        purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    };
    const c = colorMap[color] || colorMap.emerald;

    return (
        <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${c} p-4 backdrop-blur-sm`}>
            <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</p>
                <div className="opacity-60">{icon}</div>
            </div>
            <p className="text-xl font-bold text-white mb-2">{value}</p>

            {/* Mini Sparkline */}
            <div className="h-[30px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`spark-${color}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.4} />
                                <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey="v"
                            stroke={sparkColor}
                            strokeWidth={1.5}
                            fill={`url(#spark-${color})`}
                            dot={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

function DarkCard({ title, children, className = "" }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`bg-[#0c0e1a] rounded-xl border border-gray-800/50 p-5 ${className}`}>
            <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">{title}</h3>
            {children}
        </div>
    );
}

function BottomKPI({ label, value }: { label: string; value: string }) {
    return (
        <div className="bg-[#0c0e1a] rounded-xl border border-gray-800/50 p-5 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{label}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-gray-400">{label}</span>
        </div>
    );
}
