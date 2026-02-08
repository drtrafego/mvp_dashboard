
"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users, analyticsDimensions } from "@/server/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ... (types remain the same)

export async function getAnalyticsMetrics(from?: string, to?: string): Promise<AnalyticsMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    // Define Date Range
    const endDate = to ? endOfDay(parseISO(to)) : endOfDay(new Date());
    const startDate = from ? startOfDay(parseISO(from)) : startOfDay(subDays(new Date(), 90));

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
            and(
                gte(campaignMetrics.date, startDate),
                lte(campaignMetrics.date, endDate)
            )
        ));

    let totalSessions = 0;
    let totalUsers = 0;
    let totalConversions = 0;

    // Calculate Totals from basic metrics (most reliable)
    for (const m of metrics) {
        totalSessions += (m.sessions || 0);
        totalUsers += (m.users || 0);
        totalConversions += (m.conversions || 0);
    }

    // Aggregation for Sources (using Dimensions table if avaiable or fallback to campaignMetrics)
    // We will query analyticsDimensions for all breakdowns

    // Fetch Dimensions Data
    const dimData = await biDb.select()
        .from(analyticsDimensions)
        .where(and(
            eq(analyticsDimensions.organizationId, orgId),
            and(
                gte(analyticsDimensions.date, startDate),
                lte(analyticsDimensions.date, endDate)
            )
        ));

    // Maps for aggregation
    const osMap = new Map<string, number>();
    const deviceMap = new Map<string, number>();
    const cityMap = new Map<string, number>();
    const regionMap = new Map<string, number>();
    const pageMap = new Map<string, number>();
    const sourceMap = new Map<string, any>();

    // Check if we have dimension data
    const hasDimensions = dimData.length > 0;

    if (hasDimensions) {
        for (const row of dimData) {
            const val = row.sessions || 0;

            if (row.dimensionType === 'OS') {
                osMap.set(row.dimensionValue, (osMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'DEVICE') {
                deviceMap.set(row.dimensionValue, (deviceMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'PAGE_PATH') {
                pageMap.set(row.dimensionValue, (pageMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'CITY') {
                cityMap.set(row.dimensionValue, (cityMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'REGION') {
                regionMap.set(row.dimensionValue, (regionMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'SOURCE') {
                // Use sessionSource dimension for more accurate source data than campaigns
                if (!sourceMap.has(row.dimensionValue)) {
                    sourceMap.set(row.dimensionValue, { name: row.dimensionValue, sessions: 0, users: 0, conversions: 0 });
                }
                const s = sourceMap.get(row.dimensionValue);
                s.sessions += val;
                s.users += (row.users || 0);
                s.conversions += (row.conversions || 0);
            }
        }
    } else {
        // FALLBACK: If no dimensions synced yet, keep using campaign metrics for Source
        for (const m of metrics) {
            const sess = m.sessions || 0;
            const usrs = m.users || 0;
            const conv = m.conversions || 0;
            const name = m.campaign || "Direto / Orgânico";

            if (!sourceMap.has(name)) {
                sourceMap.set(name, { name, sessions: 0, users: 0, conversions: 0 });
            }
            const s = sourceMap.get(name);
            s.sessions += sess;
            s.users += usrs;
            s.conversions += conv;
        }
    }

    const sources = Array.from(sourceMap.values())
        .map(s => ({
            ...s,
            percentage: totalSessions > 0 ? (s.sessions / totalSessions) * 100 : 0
        }))
        .sort((a, b) => b.sessions - a.sessions);

    // Format OS Data
    const osColors = ['#f97316', '#ef4444', '#fb923c', '#fdba74', '#9ca3af'];
    const osData = Array.from(osMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((entry, i) => ({
            name: entry[0],
            value: entry[1],
            color: osColors[i % osColors.length]
        }));

    // Format Device Data
    const deviceColors = ['#f97316', '#ef4444', '#fb923c'];
    const deviceData = Array.from(deviceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map((entry, i) => ({
            name: entry[0],
            value: entry[1],
            color: deviceColors[i % deviceColors.length]
        }));

    // Format City Data
    const cityData = Array.from(cityMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(entry => ({
            name: entry[0],
            value: entry[1]
        }));

    // Format Region Data
    const regionData = Array.from(regionMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(entry => ({
            name: entry[0],
            value: entry[1]
        }));

    // Format Pages
    const pages = Array.from(pageMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(entry => ({
            path: entry[0],
            views: entry[1]
        }));

    // Use Totals from CampaignMetrics (more reliable for high level) or aggregate from dimensions?
    // CampaignMetrics is safer for totals. OS/Device are subsets.

    // Week Data (Mock or aggregation from daily)
    // We can aggregate dailyMap by day of week
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekMap = new Array(7).fill(0);

    metrics.forEach(m => {
        // Safe check for date
        if (m.date) {
            const dayIndex = new Date(m.date).getDay(); // 0 = Sunday
            // Adjust so 0 = Monday, ..., 6 = Sunday if needed, or keep standard.
            // Let's keep standard 0=Sunday for now to match dayNames array index
            weekMap[dayIndex] += (m.sessions || 0);
        }
    });

    const weekData = weekMap.map((val, i) => ({
        day: dayNames[i],
        value: val
    }));
    // Rotate to start on Monday if preferred, but Sunday start is standard JS
    // Let's reorder to Mon-Sun for business view
    const weekDataSorted = [...weekData.slice(1), weekData[0]];

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
        pages,
        cityData,
        regionData
    };
}
