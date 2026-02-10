"use client";

import { useMemo, useState } from "react";
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, ComposedChart, Line
} from "recharts";
import { ArrowDown, ArrowUp, Filter, RefreshCw, Thermometer } from "lucide-react";
import { LaunchMetrics } from "@/server/actions/launch-dashboard";

type DashboardLaunchProps = {
    metrics: LaunchMetrics;
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
    icon,
    color
}: {
    title: string;
    value: string;
    subValue?: string;
    icon?: React.ReactNode;
    color?: string;
}) => {
    return (
        <Card className="relative overflow-hidden group !p-5 bg-gradient-to-br from-[#12141f] to-[#1a1d2d] border-gray-800">
            <div className="flex justify-between items-start z-10 relative">
                <div>
                    <h3 className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{title}</h3>
                    <div className="text-2xl font-bold text-white tracking-tight">{value}</div>
                    {subValue && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                            {subValue}
                        </div>
                    )}
                </div>
                {icon && <div className={`p-2 rounded-lg bg-opacity-20 ${color ? `text-${color}-400 bg-${color}-500/20` : 'text-gray-400 bg-gray-700/20'}`}>{icon}</div>}
            </div>
        </Card>
    );
};


export default function DashboardLaunch({ metrics }: DashboardLaunchProps) {
    const { summary, daily, temperature, utmSource, utmMedium, utmCampaign } = metrics;

    // Safety for charts
    const safeDaily = daily.length > 0 ? daily : [{ date: new Date().toISOString().split('T')[0], leads: 0, investment: 0 }];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">🚀</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Lançamento</h1>
                        </div>
                        <div className="mt-1">
                            <p className="text-sm text-gray-500">Monitoramento de leads e temperatura em tempo real.</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Row 1: KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Leads Totais"
                    value={summary.leads.toLocaleString()}
                    subValue={`${summary.leadsTracked.toLocaleString()} rastreados`}
                    color="blue"
                />
                <KPICard
                    title="Investimento"
                    value={`R$ ${summary.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    color="green"
                />
                <KPICard
                    title="Custo por Lead (CPL)"
                    value={`R$ ${summary.cpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    color="orange"
                />
                <KPICard
                    title="Taxa de Rastreio"
                    value={`${summary.trackingRate.toFixed(1)}%`}
                    subValue={`${summary.leadsUntracked} sem origem`}
                    color="purple"
                    icon={<Thermometer size={18} className="text-purple-400" />}
                />
            </div>

            {/* Row 2: Temperature & Survey Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Temperature Chart (4 cols) */}
                <Card className="lg:col-span-4 flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Thermometer size={16} className="text-red-400" />
                        Temperatura dos Leads
                    </h3>
                    <div className="flex-1 flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={temperature}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    paddingAngle={5}
                                    stroke="none"
                                >
                                    {temperature.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Survey Helper (Placeholder for future Sheets integration) (4 cols) */}
                <Card className="lg:col-span-4 flex flex-col min-h-[350px] bg-gradient-to-b from-[#0f111a] to-[#161922]">
                    <h3 className="text-sm font-semibold text-white mb-4">Pesquisa de Perfil (Google Sheets)</h3>
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-4 border-2 border-dashed border-gray-800 rounded-xl">
                        <div className="w-12 h-12 bg-green-900/20 rounded-full flex items-center justify-center text-green-500 font-bold text-xl">
                            XLS
                        </div>
                        <div>
                            <p className="text-gray-300 font-medium">Integração Em Breve</p>
                            <p className="text-xs text-xs text-gray-500 mt-1 max-w-[200px]">
                                Conecte sua planilha para visualizar dados demográficos da pesquisa.
                            </p>
                        </div>
                        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 rounded-lg transition-colors border border-gray-700">
                            Conectar Planilha
                        </button>
                    </div>
                </Card>

                {/* Top UTM Sources List (4 cols) */}
                <Card className="lg:col-span-4 flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-4">Top Origens (UTM Source)</h3>
                    <div className="flex-1 space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700">
                        {utmSource.map((s, i) => (
                            <div key={i} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-gray-300 font-medium truncate max-w-[150px]" title={s.name || "(not set)"}>{s.name || "(not set)"}</span>
                                    <span className="text-gray-400 font-mono">{s.leads}</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500/80 rounded-full"
                                        style={{ width: `${Math.min(((s.leads / (utmSource[0]?.leads || 1)) * 100), 100)}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>

            {/* Row 3: Daily Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Daily Leads Bar Chart */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-4">Leads por Dia</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safeDaily}>
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
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                />
                                <Bar dataKey="leads" name="Leads" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                {/* Daily Investment Bar Chart */}
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-4">Investimento por Dia</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={safeDaily}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3b" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#6b7280"
                                    fontSize={10}
                                    tickFormatter={(val) => new Date(val).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis stroke="#6b7280" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `R$${val}`} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Investimento"]}
                                />
                                <Bar dataKey="investment" name="Investimento" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

            </div>

        </div>
    );
}
