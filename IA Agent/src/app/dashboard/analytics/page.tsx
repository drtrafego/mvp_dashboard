import { Header, PageWrapper, PageSection } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
    MessageSquare,
    Users,
    Calendar,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ANALYTICS PAGE - Métricas e análises
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Dados mockados
const stats = [
    {
        name: 'Mensagens Hoje',
        value: '847',
        change: '+12%',
        changeType: 'positive' as const,
        icon: MessageSquare,
    },
    {
        name: 'Novos Leads',
        value: '156',
        change: '+23%',
        changeType: 'positive' as const,
        icon: Users,
    },
    {
        name: 'Reuniões Agendadas',
        value: '18',
        change: '+8%',
        changeType: 'positive' as const,
        icon: Calendar,
    },
    {
        name: 'Tempo Médio Resposta',
        value: '1.2s',
        change: '-15%',
        changeType: 'positive' as const,
        icon: Clock,
    },
];

const dailyStats = [
    { day: 'Seg', messages: 120, leads: 23 },
    { day: 'Ter', messages: 145, leads: 28 },
    { day: 'Qua', messages: 98, leads: 19 },
    { day: 'Qui', messages: 167, leads: 34 },
    { day: 'Sex', messages: 189, leads: 42 },
    { day: 'Sáb', messages: 76, leads: 12 },
    { day: 'Dom', messages: 52, leads: 8 },
];

const topAgents = [
    { name: 'Assistente Principal', conversations: 234, satisfaction: 94 },
    { name: 'Vendas Premium', conversations: 156, satisfaction: 91 },
    { name: 'Suporte Técnico', conversations: 89, satisfaction: 88 },
];

export default function AnalyticsPage() {
    const maxMessages = Math.max(...dailyStats.map(d => d.messages));

    return (
        <>
            <Header
                title="Analytics"
                description="Métricas de desempenho dos seus agentes"
            />

            <PageWrapper>
                {/* Stats Grid */}
                <PageSection className="mb-8">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {stats.map((stat) => (
                            <Card key={stat.name} hover>
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.changeType === 'positive'
                                                    ? 'bg-blue-100'
                                                    : 'bg-red-100'
                                                }`}
                                        >
                                            <stat.icon
                                                className={`h-5 w-5 ${stat.changeType === 'positive'
                                                        ? 'text-blue-600'
                                                        : 'text-red-600'
                                                    }`}
                                            />
                                        </div>
                                        <span
                                            className={`flex items-center gap-0.5 text-sm font-medium ${stat.changeType === 'positive'
                                                    ? 'text-emerald-600'
                                                    : 'text-red-600'
                                                }`}
                                        >
                                            {stat.changeType === 'positive' ? (
                                                <ArrowUp className="h-3 w-3" />
                                            ) : (
                                                <ArrowDown className="h-3 w-3" />
                                            )}
                                            {stat.change}
                                        </span>
                                    </div>
                                    <div className="mt-4">
                                        <p className="text-2xl font-bold text-slate-900">
                                            {stat.value}
                                        </p>
                                        <p className="text-sm text-slate-500">{stat.name}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </PageSection>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Chart */}
                    <PageSection
                        title="Mensagens por Dia"
                        className="lg:col-span-2"
                    >
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex h-64 items-end gap-2">
                                    {dailyStats.map((day) => (
                                        <div key={day.day} className="flex flex-1 flex-col items-center gap-2">
                                            <div className="relative w-full">
                                                <div
                                                    className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-blue-400 transition-all hover:from-blue-600 hover:to-blue-500"
                                                    style={{
                                                        height: `${(day.messages / maxMessages) * 200}px`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-500">{day.day}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                                        <span className="text-slate-600">Mensagens</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </PageSection>

                    {/* Top Agents */}
                    <PageSection title="Desempenho por Agente">
                        <Card>
                            <CardContent className="p-0">
                                <div className="divide-y divide-slate-100">
                                    {topAgents.map((agent, index) => (
                                        <div
                                            key={agent.name}
                                            className="flex items-center gap-4 p-4"
                                        >
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                                                {index + 1}
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-medium text-slate-900">
                                                    {agent.name}
                                                </p>
                                                <p className="text-sm text-slate-500">
                                                    {agent.conversations} conversas
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-emerald-600">
                                                    {agent.satisfaction}%
                                                </p>
                                                <p className="text-xs text-slate-400">satisfação</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </PageSection>
                </div>
            </PageWrapper>
        </>
    );
}
