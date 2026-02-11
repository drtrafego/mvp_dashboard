
"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users, analyticsDimensions } from "@/server/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { subDays } from "date-fns";
import { format } from "date-fns";
// import { BetaAnalyticsDataClient } from "@google-analytics/data"; // Replaced
import { getValidAccessToken } from "@/server/utils/token-refresh";
import { runReport } from "@/server/integrations/ga4";
import { adAccountSettings } from "@/server/db/schema";

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
        sessions: number;
        users: number;
        conversions: number;
        percentage: number;
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
    browserData: {
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
    genderData: {
        name: string;
        value: number;
    }[];
    interestData: {
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
    const endDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
    const startDate = from ? new Date(`${from}T00:00:00.000Z`) : subDays(new Date(), 30);

    console.log(`[getAnalyticsMetrics] Org: ${orgId}`);
    console.log(`[getAnalyticsMetrics] Query Window: ${startDate.toISOString()} TO ${endDate.toISOString()}`);

    // Fetch GA4 Data (Campaign Metrics)
    const metrics = await biDb.select({
        date: campaignMetrics.date,
        sessions: campaignMetrics.sessions,
        users: campaignMetrics.activeUsers,
        newUsers: campaignMetrics.newUsers,
        conversions: campaignMetrics.conversions,
        campaign: campaignMetrics.campaignName,
        engagementRate: campaignMetrics.engagementRate, // Added for avg calculation
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
    let totalNewUsers = 0;
    let totalPageViews = 0;
    let totalEngagementRateSum = 0;
    let engagementRateCount = 0;

    // Calculate Totals from basic metrics
    for (const m of metrics) {
        totalSessions += (m.sessions || 0);
        totalUsers += (m.users || 0);
        totalNewUsers += (m.newUsers || 0);
        totalConversions += (m.conversions || 0);
        if (m.engagementRate) {
            totalEngagementRateSum += Number(m.engagementRate);
            engagementRateCount++;
        }
    }

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
    const browserMap = new Map<string, number>();
    const pageMap = new Map<string, number>();
    const sourceMap = new Map<string, { name: string; sessions: number; users: number; conversions: number }>();
    const cityMap = new Map<string, { name: string; region: string; value: number }>();
    const regionMap = new Map<string, number>();

    // Check if we have dimension data
    const hasDimensions = dimData.length > 0;

    if (hasDimensions) {
        for (const row of dimData) {
            const val = row.sessions || 0;
            const usersVal = row.users || 0;
            const convVal = row.conversions || 0;

            if (row.dimensionType === 'OS') {
                osMap.set(row.dimensionValue, (osMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'DEVICE') {
                deviceMap.set(row.dimensionValue, (deviceMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'BROWSER') {
                browserMap.set(row.dimensionValue, (browserMap.get(row.dimensionValue) || 0) + val);
            } else if (row.dimensionType === 'PAGE_PATH') {
                // Using sessions as proxy for page views since screenPageViews is missing in schema
                pageMap.set(row.dimensionValue, (pageMap.get(row.dimensionValue) || 0) + val);
                totalPageViews += val;
            } else if (row.dimensionType === 'SOURCE') {
                if (!sourceMap.has(row.dimensionValue)) {
                    sourceMap.set(row.dimensionValue, { name: row.dimensionValue, sessions: 0, users: 0, conversions: 0 });
                }
                const s = sourceMap.get(row.dimensionValue)!;
                s.sessions += val;
                s.users += usersVal;
                s.conversions += convVal;
            } else if (row.dimensionType === 'SOURCE') {
                if (!sourceMap.has(row.dimensionValue)) {
                    sourceMap.set(row.dimensionValue, { name: row.dimensionValue, sessions: 0, users: 0, conversions: 0 });
                }
                const s = sourceMap.get(row.dimensionValue)!;
                s.sessions += val;
                s.users += usersVal;
                s.conversions += convVal;
            } else if (row.dimensionType === 'CITY') {
                // Format: "City|Region"
                const [city, region] = row.dimensionValue.split('|');
                const cityName = city || row.dimensionValue;
                const regionName = region || '';

                // Use cityName as key
                if (!cityMap.has(cityName)) {
                    cityMap.set(cityName, { name: cityName, region: regionName, value: 0 });
                }
                const c = cityMap.get(cityName)!;
                c.value += val; // Accesses (sessions)
            } else if (row.dimensionType === 'REGION') {
                regionMap.set(row.dimensionValue, (regionMap.get(row.dimensionValue) || 0) + val);
            }
        }
    } else {
        // FALLBACK: If no dimensions synced, use campaign metrics
        for (const m of metrics) {
            const sess = m.sessions || 0;
            const usrs = m.users || 0;
            const conv = m.conversions || 0;
            const name = m.campaign || "Direto / Orgânico";

            if (!sourceMap.has(name)) {
                sourceMap.set(name, { name, sessions: 0, users: 0, conversions: 0 });
            }
            const s = sourceMap.get(name)!;
            s.sessions += sess;
            s.users += usrs;
            s.conversions += conv;
        }
    }

    // Daily Data Construction
    const dailyData = metrics.map(m => ({
        date: m.date ? format(m.date, 'yyyy-MM-dd') : 'Unknown',
        sessions: m.sessions || 0,
        users: m.users || 0,
        conversions: m.conversions || 0,
        engagementRate: m.engagementRate ? Number(m.engagementRate) : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Calculate Averages/Rates
    const avgEngagement = engagementRateCount > 0 ? (totalEngagementRateSum / engagementRateCount) : 0;

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
    const deviceData = Array.from(deviceMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map((entry) => ({
            name: entry[0],
            value: entry[1]
        }));

    // Format Browser Data
    const browserData = Array.from(browserMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map((entry) => ({
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

    // Week Data
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const weekMap = new Array(7).fill(0);

    metrics.forEach(m => {
        if (m.date) {
            const dayIndex = new Date(m.date).getDay();
            weekMap[dayIndex] += (m.sessions || 0);
        }
    });

    const weekData = weekMap.map((val, i) => ({
        day: dayNames[i],
        value: val
    }));



    // Google Analytics Data Fetch (City/Region) using OAuth Token from DB
    // This matches the pattern in sync-google.ts and uses the user's connected account.

    // Initialize with DB data if available
    let cityData: any[] = Array.from(cityMap.values()).sort((a, b) => b.value - a.value).slice(0, 20);
    let regionData: any[] = Array.from(regionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    let genderData: any[] = [];
    let interestData: any[] = [];

    // 1. Get Integration Token
    const integration = await biDb.query.integrations.findFirst({
        where: and(
            eq(integrations.organizationId, orgId),
            eq(integrations.provider, "google_analytics")
        )
    });

    const isDemoToken = integration?.accessToken === "DEMO_TOKEN";

    if (!integration || !integration.accessToken) {
        console.warn("[getAnalyticsMetrics] No Google Analytics integration found or missing token. Skipping Map data.");
    } else if (isDemoToken) {
        console.warn("[getAnalyticsMetrics] Demo token detected. Skipping real API calls.");
    } else {
        try {
            // 2. Refresh Token if needed
            const accessToken = await getValidAccessToken(integration.id);

            // Check adAccountSettings.
            const settings = await biDb.query.adAccountSettings.findFirst({
                where: eq(adAccountSettings.organizationId, orgId),
            });
            const targetPropertyId = settings?.ga4PropertyId || process.env.GA4_PROPERTY_ID;

            if (targetPropertyId) {
                // Fetch City Data
                const cityRows = await runReport(
                    accessToken,
                    targetPropertyId,
                    from || '30daysAgo',
                    to || 'today',
                    [{ name: 'city' }, { name: 'region' }],
                    [{ name: 'sessions' }],
                    [{ metric: { metricName: 'sessions' }, desc: true }],
                    20
                );

                cityData = cityRows.map((row: any) => ({
                    name: row.city || 'Unknown',
                    region: row.region || '',
                    value: Number(row.sessions || 0),
                }));

                // Fetch Region Data
                const regionRows = await runReport(
                    accessToken,
                    targetPropertyId,
                    from || '30daysAgo',
                    to || 'today',
                    [{ name: 'region' }],
                    [{ name: 'sessions' }],
                    undefined,
                    27
                );

                regionData = regionRows.map((row: any) => ({
                    name: row.region || 'Unknown',
                    value: Number(row.sessions || 0),
                }));

                // Fetch Gender Data
                const genderRows = await runReport(
                    accessToken,
                    targetPropertyId,
                    from || '30daysAgo',
                    to || 'today',
                    [{ name: 'userGender' }],
                    [{ name: 'activeUsers' }],
                    undefined,
                    10
                );

                genderData = genderRows.map((row: any) => ({
                    name: row.userGender || 'Unknown',
                    value: Number(row.activeUsers || 0),
                }));



            } else {
                console.warn("[getAnalyticsMetrics] Missing GA4_PROPERTY_ID locally and in settings. Skipping City/Region fetch.");
            }

        } catch (err: any) {
            console.error("[getAnalyticsMetrics] Error fetching geo data via OAuth:", err.message);
            // If token is invalid, we might want to throw to let user know re-login is needed
            if (err.message && (err.message.includes("invalid_grant") || err.message.includes("unauthenticated"))) {
                throw new Error("Sessão do Google Analytics expirada. Por favor, desconecte e conector novamente nas configurações.");
            }
            throw new Error(`Google Analytics API Error: ${err.message}`);
        }
    }

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
        sources: sources,
        pages: pages,
        osData,
        deviceData,
        browserData,
        weekData,
        cityData,
        regionData,
        genderData,
        interestData
    };
}
