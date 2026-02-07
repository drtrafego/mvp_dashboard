
"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";

export type AnalyticsMetrics = {
    totals: {
        sessions: number;
        users: number;
        newUsers: number;
        pageViews: number;
        engagementRate: number;
    };
    daily: any[];
    sources: any[];
    pages: any[];
    osData: any[];
    deviceData: any[];
    weekData: any[];
};

export async function getAnalyticsMetrics(days = 90): Promise<AnalyticsMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    const startDate = startOfDay(subDays(new Date(), days));

    // Fetch GA4 Data
    const metrics = await biDb.select({
        date: campaignMetrics.date,
        sessions: campaignMetrics.sessions,
        users: campaignMetrics.activeUsers,
        conversions: campaignMetrics.conversions,
        campaign: campaignMetrics.campaignName,
        // We might want source/medium if we stored them, but currently schema maps them to campaign or not at all.
        // For now we group by campaign as "Source" proxy or just generic.
    })
        .from(campaignMetrics)
        .innerJoin(integrations, eq(campaignMetrics.integrationId, integrations.id))
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            eq(integrations.provider, "google_analytics"),
            gte(campaignMetrics.date, startDate)
        ));

    let totalSessions = 0;
    let totalUsers = 0;
    let totalConversions = 0;

    // Aggregation
    const sourceMap = new Map<string, any>();

    for (const m of metrics) {
        const sess = m.sessions || 0;
        const usrs = m.users || 0;
        const conv = m.conversions || 0;

        totalSessions += sess;
        totalUsers += usrs;
        totalConversions += conv;

        // Group by Source (Campaign Name used as proxy for now since schema is limited)
        const name = m.campaign || "Direto / Orgânico";
        if (!sourceMap.has(name)) {
            sourceMap.set(name, {
                name,
                sessions: 0,
                users: 0,
                conversions: 0
            });
        }
        const s = sourceMap.get(name);
        s.sessions += sess;
        s.users += usrs;
        s.conversions += conv;
    }

    const sources = Array.from(sourceMap.values())
        .map(s => ({
            ...s,
            percentage: totalSessions > 0 ? (s.sessions / totalSessions) * 100 : 0
        }))
        .sort((a, b) => b.sessions - a.sessions);

    // Mock Dimensions (until we have them in DB)
    const osData = [
        { name: 'Windows', value: 60.9, color: '#f97316' }, // Orange
        { name: 'Android', value: 24.7, color: '#ef4444' }, // Red
        { name: 'iOS', value: 11, color: '#fb923c' }, // Light Orange
        { name: 'MacOS', value: 3.4, color: '#fdba74' }, // Lighter Orange
    ];

    const deviceData = [
        { name: 'Mobile', value: 85.4, color: '#f97316' },
        { name: 'Desktop', value: 14.3, color: '#ef4444' },
        { name: 'Tablet', value: 0.3, color: '#fb923c' },
    ];

    const weekData = [
        { day: 'Monday', value: 973 },
        { day: 'Tuesday', value: 1199 },
        { day: 'Wednesday', value: 1197 },
        { day: 'Thursday', value: 1094 },
        { day: 'Friday', value: 1029 },
        { day: 'Saturday', value: 957 },
        { day: 'Sunday', value: 891 },
    ];

    const pages = [
        { path: 'app.dashcortex.com/', views: 1059 },
        { path: 'app.dashcortex.com/login', views: 68 },
        { path: 'app.dashcortex.com/register', views: 21 },
        { path: 'app.dashcortex.com/dashboard', views: 17 },
        { path: 'app.dashcortex.com/settings', views: 13 },
        { path: 'app.dashcortex.com/profile', views: 10 },
    ];

    // Daily Map for Sparklines
    const dailyMap = new Map<string, any>();
    for (const m of metrics) {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, {
                date: dateStr,
                sessions: 0,
                users: 0,
                conversions: 0,
                engagementRate: 0
            });
        }
        const d = dailyMap.get(dateStr);
        d.sessions += (m.sessions || 0);
        d.users += (m.users || 0);
        d.conversions += (m.conversions || 0);
    }
    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
        totals: {
            sessions: totalSessions,
            users: totalUsers,
            newUsers: Math.round(totalUsers * 0.8), // Est.
            conversions: totalConversions,
            pageViews: Math.round(totalSessions * 1.5), // Est.
            engagementRate: 28.34, // Mock
        },
        sources,
        daily,
        osData,
        deviceData,
        weekData,
        pages
    };
}
