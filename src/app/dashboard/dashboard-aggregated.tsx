"use client";

import { AggregatedMetrics } from "@/server/actions/metrics-aggregated";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';
import { Wallet, Target, DollarSign, PieChart as PieIcon, BarChart3, TrendingUp } from "lucide-react";

type DashboardAggregatedProps = {
    metrics: AggregatedMetrics;
    settings: any;
};

// Colors
const COLORS = {
    meta: "#3b82f6", // Blue
    google: "#ef4444", // Red
    other: "#9ca3af", // Gray
    total: "#10b981", // Green
};

const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function DashboardAggregated({ metrics, settings }: DashboardAggregatedProps) {
    const { summary, daily, pieInvestment, pieLeads } = metrics;

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Investimento Total"
                    value={formatCurrency(summary.totalInvestment)}
                    icon={<Wallet className="w-5 h-5 text-blue-500" />}
                    subDetails={
                        <div className="flex gap-2 text-xs mt-1 text-gray-500">
                            <span className="text-blue-500">Meta: {formatCurrency(summary.metaSpend)}</span>
                            <span className="text-red-500">Google: {formatCurrency(summary.googleSpend)}</span>
                        </div>
                    }
                />
                <KPICard
                    title="Leads Consolidados"
                    value={summary.totalLeads.toLocaleString()}
                    icon={<Target className="w-5 h-5 text-purple-500" />}
                    subDetails={
                        <div className="flex gap-2 text-xs mt-1 text-gray-500">
                            <span className="text-blue-500">Meta: {summary.metaLeads}</span>
                            <span className="text-red-500">Google: {summary.googleLeads}</span>
                        </div>
                    }
                />
                <KPICard
                    title="CPA / CPL Médio"
                    value={formatCurrency(summary.avgCpl)}
                    icon={<DollarSign className="w-5 h-5 text-green-500" />}
                    subDetails={
                        <div className="flex gap-2 text-xs mt-1 text-gray-500">
                            <span className="text-blue-500">Meta: {formatCurrency(summary.metaCpl)}</span>
                            <span className="text-red-500">Google: {formatCurrency(summary.googleCpl)}</span>
                        </div>
                    }
                />
                <KPICard
                    title="Conversões"
                    value={summary.totalConversions.toLocaleString()}
                    icon={<TrendingUp className="w-5 h-5 text-orange-500" />}
                    subDetails={<span className="text-xs text-gray-500">Total acumulado</span>}
                />
            </div>

            {/* Charts Row 1: Pies */}
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
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(val: number | undefined) => formatCurrency(val || 0)}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
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
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>

            {/* Charts Row 2: Bars */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Investimento por Plataforma">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={daily}>
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
                                tickFormatter={(val) => `R$${val}`}
                                axisLine={false}
                                tickLine={false}
                            />
                            <Tooltip
                                formatter={(val: number | undefined) => formatCurrency(val || 0)}
                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="metaSpend" name="Meta Ads" fill={COLORS.meta} stackId="a" radius={[0, 0, 4, 4]} />
                            <Bar dataKey="googleSpend" name="Google Ads" fill={COLORS.google} stackId="a" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Leads por Plataforma">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={daily}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.2} />
                            <XAxis
                                dataKey="date"
                                fontSize={10}
                                tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip
                                labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }}
                            />
                            <Legend />
                            <Bar dataKey="metaLeads" name="Meta Leads" fill={COLORS.meta} stackId="a" />
                            <Bar dataKey="googleLeads" name="Google Leads" fill={COLORS.google} stackId="a" />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </div>
        </div>
    );
}

function KPICard({ title, value, icon, subDetails }: { title: string; value: string; icon: React.ReactNode; subDetails?: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-2">
                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{icon}</div>
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
            {subDetails}
        </div>
    );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col min-h-[350px]">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
            <div className="flex-1 w-full min-h-0">
                {children}
            </div>
        </div>
    );
}
