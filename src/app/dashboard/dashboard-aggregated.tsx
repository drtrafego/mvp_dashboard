"use client";

import { AggregatedMetrics } from "@/server/actions/metrics-aggregated";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Wallet, Target, Layers } from "lucide-react";

type DashboardAggregatedProps = {
    metrics: AggregatedMetrics;
    settings: Record<string, unknown> | null;
};

// Colors
const COLORS = {
    meta: "#3b82f6",    // Blue
    google: "#ef4444",  // Red
    other: "#9ca3af",   // Gray
    total: "#10b981",   // Green
};

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function DashboardAggregated({ metrics }: DashboardAggregatedProps) {
    const { summary, daily, pieInvestment, pieLeads } = metrics;

    // Compute totalSpend per day for the consolidated charts
    const dailyWithTotals = daily.map(d => ({
        ...d,
        totalSpend: d.metaSpend + d.googleSpend,
    }));

    return (
        <div className="space-y-8">
            {/* ===== KPI Cards - Consolidados por Plataforma ===== */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PlatformSummaryCard
                    title="Meta Ads"
                    icon={<Layers className="w-6 h-6 text-blue-500" />}
                    color="text-blue-500"
                    metrics={{
                        spend: summary.metaSpend,
                        leads: summary.metaLeads,
                        cpl: summary.metaCpl
                    }}
                />
                <PlatformSummaryCard
                    title="Google Ads"
                    icon={<Target className="w-6 h-6 text-red-500" />}
                    color="text-red-500"
                    metrics={{
                        spend: summary.googleSpend,
                        leads: summary.googleLeads,
                        cpl: summary.googleCpl
                    }}
                />
                <PlatformSummaryCard
                    title="Total Consolidado"
                    icon={<Wallet className="w-6 h-6 text-green-500" />}
                    color="text-green-500"
                    metrics={{
                        spend: summary.totalInvestment,
                        leads: summary.totalLeads,
                        cpl: summary.avgCpl
                    }}
                    isTotal
                />
            </div>

            {/* ===== Gráficos de Pizza ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ChartCard title="Distribuição de Investimento">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieInvestment}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"

                            >
                                {pieInvestment.map((entry, index) => (
                                    <Cell key={`cell-inv-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(val: number | undefined) => formatCurrency(val || 0)}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                wrapperStyle={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Distribuição de Leads">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieLeads}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"

                            >
                                {pieLeads.map((entry, index) => (
                                    <Cell key={`cell-lead-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            />
                            <Legend
                                verticalAlign="bottom"
                                height={36}
                                wrapperStyle={{ color: '#e5e7eb', fontSize: '14px', fontWeight: 500 }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* ===== INVESTIMENTO: Meta | Google | Consolidado ===== */}
            <SectionTitle>Investimento por Plataforma</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricBarChart
                    title="Meta Ads"
                    data={dailyWithTotals}
                    dataKey="metaSpend"
                    color={COLORS.meta}
                    isCurrency
                />
                <MetricBarChart
                    title="Google Ads"
                    data={dailyWithTotals}
                    dataKey="googleSpend"
                    color={COLORS.google}
                    isCurrency
                />
                <MetricBarChart
                    title="Consolidado"
                    data={dailyWithTotals}
                    dataKey="totalSpend"
                    color={COLORS.total}
                    isCurrency
                />
            </div>

            {/* ===== LEADS: Meta | Google | Consolidado ===== */}
            <SectionTitle>Leads por Plataforma</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricBarChart
                    title="Meta Ads"
                    data={dailyWithTotals}
                    dataKey="metaLeads"
                    color={COLORS.meta}
                />
                <MetricBarChart
                    title="Google Ads"
                    data={dailyWithTotals}
                    dataKey="googleLeads"
                    color={COLORS.google}
                />
                <MetricBarChart
                    title="Consolidado"
                    data={dailyWithTotals}
                    dataKey="totalLeads"
                    color={COLORS.total}
                />
            </div>

            {/* ===== CPL: Meta | Google | Consolidado ===== */}
            <SectionTitle>Custo por Lead (CPL)</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <MetricBarChart
                    title="Meta Ads"
                    data={dailyWithTotals}
                    dataKey="metaCpl"
                    color={COLORS.meta}
                    isCurrency
                />
                <MetricBarChart
                    title="Google Ads"
                    data={dailyWithTotals}
                    dataKey="googleCpl"
                    color={COLORS.google}
                    isCurrency
                />
                <MetricBarChart
                    title="Consolidado"
                    data={dailyWithTotals}
                    dataKey="totalCpl"
                    color={COLORS.total}
                    isCurrency
                />
            </div>
        </div>
    );
}

/* ===== Componentes Auxiliares ===== */

function SectionTitle({ children }: { children: React.ReactNode }) {
    return (
        <h2 className="text-xl font-bold text-gray-900 dark:text-white pt-2">
            {children}
        </h2>
    );
}

function MetricBarChart({ title, data, dataKey, color, isCurrency }: {
    title: string;
    data: Record<string, unknown>[];
    dataKey: string;
    color: string;
    isCurrency?: boolean;
}) {
    return (
        <ChartCard title={title}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                    <XAxis
                        dataKey="date"
                        fontSize={10}
                        tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        fontSize={10}
                        tickFormatter={isCurrency ? (val) => `R$${val}` : undefined}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        formatter={(val: number | undefined) => isCurrency ? formatCurrency(val || 0) : (val || 0).toLocaleString('pt-BR')}
                        labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                    />
                    <Bar dataKey={dataKey} name={title} fill={color} radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </ChartCard>
    );
}

function PlatformSummaryCard({ title, icon, color, metrics, isTotal }: {
    title: string;
    icon: React.ReactNode;
    color: string;
    metrics: { spend: number; leads: number; cpl: number };
    isTotal?: boolean;
}) {
    return (
        <div className={`rounded-xl shadow-sm border p-6 flex flex-col ${isTotal ? 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-green-200 dark:border-green-900/50' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-3 rounded-lg ${isTotal ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-700'}`}>
                    {icon}
                </div>
                <h3 className={`text-lg font-bold ${color}`}>{title}</h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Investimento</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.spend)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-gray-100 dark:border-gray-700 pb-2">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Leads</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{metrics.leads.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">CPL Médio</span>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(metrics.cpl)}</span>
                </div>
            </div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col min-h-[300px]">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                {children}
            </div>
        </div>
    );
}
