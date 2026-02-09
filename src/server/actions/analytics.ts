
"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users, analyticsDimensions } from "@/server/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { subDays, startOfDay, endOfDay, parseISO } from "date-fns";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// ... (types remain the same)
export type AnalyticsMetrics = {
    totals: {
        sessions: number;
        users: number;
        newUsers: number;
        pageViews: number;
        engagementRate: number;
        conversions: number;
    };
    daily: {
        date: string;
        sessions: number;
        users: number;
        conversions: number;
        engagementRate: number;
    }[];
    sources: {
        name: string;
        value: number;
        color: string;
    }[];
    pages: {
        path: string;
        views: number;
    }[];
    osData: {
        name: string;
        value: number;
    }[];
    deviceData: {
        name: string;
        value: number;
    }[];
    weekData: {
        day: string;
        value: number;
    }[];
    cityData: {
        name: string;
        region?: string;
        value: number;
    }[];
    regionData: {
        name: string;
        value: number;
    }[];
};

export async function getAnalyticsMetrics(from?: string, to?: string): Promise<AnalyticsMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    // Define Date Range
    // Use UTC boundaries to match DB storage (usually 00:00:00 UTC)
    // If 'from' is 2023-10-27, we want 2023-10-27T00:00:00.000Z
    // If 'to' is 2023-10-27, we want 2023-10-27T23:59:59.999Z
    // If no 'to' is provided, we want NO W (end of today UTC)

    // FIX: Ensure we don't default to "start of today" for end date, we want "NOW" or "End of Today"
    const endDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();

    // FIX: Default start date should be 30 days ago, not 90, to match UI default if undefined
    const startDate = from ? new Date(`${from}T00:00:00.000Z`) : subDays(new Date(), 30);

    console.log(`[getAnalyticsMetrics] Org: ${orgId}`);
    console.log(`[getAnalyticsMetrics] Raw From: ${from}, Raw To: ${to}`);
    console.log(`[getAnalyticsMetrics] Query Window: ${startDate.toISOString()} TO ${endDate.toISOString()}`);

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

    console.log(`[getAnalyticsMetrics] Metrics found: ${metrics.length}`);

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

    // 6. Cities (Top 20) - Enhanced to include Region if possible (simulated or fetched)
    // GA4 API often returns separate dimensions. We'll stick to 'city' for now but could add 'region' dimension.
    // Let's try to fetch both: city and region.
    const cityRegionResponse = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: from || '30daysAgo', endDate: to || 'today' }],
        dimensions: [{ name: 'city' }, { name: 'region' }],
        metrics: [{ name: 'sessions' }],
        limit: 20,
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    const cityData = cityRegionResponse.rows ? cityRegionResponse.rows.map(row => ({
        name: row.dimensionValues?.[0]?.value || 'Unknown',
        region: row.dimensionValues?.[1]?.value || '',
        value: parseInt(row.metricValues?.[0]?.value || '0', 10),
    })) : [];

    const regionResponse = await analyticsDataClient.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: from || '30daysAgo', endDate: to || 'today' }],
        dimensions: [{ name: 'region' }],
        metrics: [{ name: 'sessions' }],
        limit: 27, // All BR states
    });

    const regionData = regionResponse.rows ? regionResponse.rows.map(row => ({
        name: row.dimensionValues?.[0]?.value || 'Unknown',
        value: parseInt(row.metricValues?.[0]?.value || '0', 10),
    })) : [];


    return {
        totals: {
            sessions: totalSessions,
            users: totalUsers,
            newUsers: totalNewUsers,
            pageViews: totalPageViews,
            engagementRate: avgEngagement,
            conversions: totalConversions,
        },
        daily: dailyData,
        sources: sourceData,
        pages: pageData,
        osData,
        deviceData,
        weekData,
        cityData, // Now contains { name(city), region, value }
        regionData
    };
}
