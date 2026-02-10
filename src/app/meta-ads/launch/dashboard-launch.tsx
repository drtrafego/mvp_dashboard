import { useMemo } from "react";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, PieChart, Pie, Legend, Line, LineChart
} from "recharts";
import { Thermometer } from "lucide-react";
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
    const { summary, daily, dailyBySource, temperature, utmSource, utmMedium, utmTerm, utmContent } = metrics;

    // Safety for charts
    const safeDaily = daily.length > 0 ? daily : [{ date: new Date().toISOString().split('T')[0], leads: 0, investment: 0 }];

    // Get unique sources for the line chart colors
    const uniqueSources = useMemo(() => {
        const sources = new Set<string>();
        dailyBySource?.forEach(d => {
            Object.keys(d).forEach(k => {
                if (k !== 'date') sources.add(k);
            });
        });
        return Array.from(sources);
    }, [dailyBySource]);

    // Color palette for sources
    const colors = ["#8b5cf6", "#ec4899", "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"];

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
                <div className="flex items-center gap-4">
                    <span className="text-4xl">🚀</span>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard Captação</h1>
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

            {/* Row 2: Charts Area (Temperature + Daily Evolution) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Temperature Chart (4 cols) */}
                <Card className="lg:col-span-4 flex flex-col min-h-[400px]">
                    <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                        <Thermometer size={16} className="text-red-400" />
                        Temperatura + Pesquisa (Visão Geral)
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

                {/* Daily Leads by Source - Evolution (8 cols) */}
                <Card className="lg:col-span-8 flex flex-col min-h-[400px] bg-[#1a1d2e] border-indigo-900/30">
                    <h3 className="text-sm font-semibold text-white mb-4 pl-2">Captação - UTM SOURCE (Evolução Diária)</h3>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dailyBySource || []}>
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
                                    labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                                />
                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                {uniqueSources.map((source, index) => (
                                    <Line
                                        key={source}
                                        type="monotone"
                                        dataKey={source}
                                        stroke={colors[index % colors.length]}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: colors[index % colors.length] }}
                                        activeDot={{ r: 5 }}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Row 3: Daily Bars (Leads & Investment) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-4">Leads por Dia (Barras)</h3>
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

                <Card className="flex flex-col min-h-[350px]">
                    <h3 className="text-sm font-semibold text-white mb-4">Investimento por Dia (Barras)</h3>
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
                                    formatter={(value: number | undefined) => [`R$ ${(value || 0).toFixed(2)}`, "Investimento"]}
                                />
                                <Bar dataKey="investment" name="Investimento" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Row 4: Detailed Tables */}
            <div className="space-y-6">

                {/* UTM Source Table */}
                <Card className="overflow-hidden !p-0 bg-[#1a1d2e] border-indigo-900/30">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <h3 className="text-base font-semibold text-white">Utm Source</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-gray-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3 w-full">Source</th>
                                    <th className="px-4 py-3 text-right">Leads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {utmSource.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-white">{s.name}</td>
                                        <td className="px-4 py-3 text-right font-bold text-white">{s.leads}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* UTM Medium Table */}
                <Card className="overflow-hidden !p-0 bg-[#0f172a] border-blue-900/30">
                    <div className="p-4 border-b border-white/5 bg-blue-900/20">
                        <h3 className="text-base font-semibold text-white">UTM MEDIUM</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-white/5 text-gray-400 font-medium">
                                <tr>
                                    <th className="px-4 py-3">#</th>
                                    <th className="px-4 py-3 w-full">Medium</th>
                                    <th className="px-4 py-3 text-right">Leads</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {utmMedium.map((s, i) => (
                                    <tr key={i} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-gray-500">{i + 1}</td>
                                        <td className="px-4 py-3 font-medium text-blue-100">{s.name}</td>
                                        <td className="px-4 py-3 text-right font-bold text-white">{s.leads}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Row 5: Term & Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* UTM Term Table */}
                    <Card className="overflow-hidden !p-0 bg-[#1e1b4b] border-purple-900/30">
                        <div className="p-4 border-b border-white/5 bg-purple-900/20">
                            <h3 className="text-base font-semibold text-white">Captação - UTM TERM</h3>
                        </div>
                        <div className="overflow-x-auto max-h-[400px]">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-white/5 text-gray-400 font-medium sticky top-0 backdrop-blur-md">
                                    <tr>
                                        <th className="px-4 py-3">Term</th>
                                        <th className="px-4 py-3 text-right">Leads</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {utmTerm?.map((s, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-purple-100 truncate max-w-[200px]" title={s.name}>{s.name}</td>
                                            <td className="px-4 py-3 text-right font-bold text-white">{s.leads}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    {/* UTM Content (Ad Name) Chart */}
                    <Card className="flex flex-col min-h-[400px] bg-[#172554] border-blue-800/30">
                        <div className="p-4 border-b border-white/5 bg-blue-800/20">
                            <h3 className="text-base font-semibold text-white">Captação - UTM CONTENT / AD NAME</h3>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={utmContent || []}
                                        dataKey="leads"
                                        nameKey="name"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius="50%"
                                        outerRadius="80%"
                                        paddingAngle={2}
                                    >
                                        {(utmContent || []).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.1)" />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f111a', borderColor: '#374151', color: '#fff', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                        formatter={(value: number, name: string) => [value, name]}
                                    />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        wrapperStyle={{ fontSize: '11px', color: '#cbd5e1', maxWidth: '150px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>

            </div>

        </div>
    );
}
