"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";

export type DashboardMetrics = {
    totals: {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        ctr: number;
        cpc: number;
        cpa: number;
        roas: number;
        value: number;
    };
    campaigns: any[];
    daily: any[];
};

export async function getMetaAdsMetrics(days = 90): Promise<DashboardMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    // Filter by Date
    const startDate = startOfDay(subDays(new Date(), days));

    // Fetch Raw Data
    // We join with integrations to ensure we only get 'meta' provider data
    const metrics = await biDb.select({
        campaignName: campaignMetrics.campaignName,
        spend: campaignMetrics.spend,
        impressions: campaignMetrics.impressions,
        clicks: campaignMetrics.clicks,
        conversions: campaignMetrics.conversions,
        conversionValue: campaignMetrics.conversionValue,
        date: campaignMetrics.date,
    })
        .from(campaignMetrics)
        .innerJoin(integrations, eq(campaignMetrics.integrationId, integrations.id))
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            eq(integrations.provider, "meta"),
            gte(campaignMetrics.date, startDate)
        ));

    // Aggregation (in memory because numeric fields handle easier in JS for small datasets, 
    // but for scale we should use SQL SUM. For MVP/30days, memory is fine/fast.)

    // Aggregation
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalConversionValue = 0;

    // Daily Map for Charts
    const dailyMap = new Map<string, any>();
    // Campaign Map for Table
    const campaignMap = new Map<string, any>();

    for (const m of metrics) {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        const spend = Number(m.spend);
        const imps = m.impressions || 0;
        const clicks = m.clicks || 0;
        const conv = m.conversions || 0;
        const val = Number(m.conversionValue) || 0;

        // Totals
        totalSpend += spend;
        totalImpressions += imps;
        totalClicks += clicks;
        totalConversions += conv;
        totalConversionValue += val;

        // Daily Grouping
        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, {
                date: dateStr,
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                value: 0,
                roas: 0
            });
        }
        const d = dailyMap.get(dateStr);
        d.spend += spend;
        d.impressions += imps;
        d.clicks += clicks;
        d.conversions += conv;
        d.value += val;
        d.roas = d.spend > 0 ? d.value / d.spend : 0;

        // Campaign Grouping
        const name = m.campaignName || "Unknown";
        if (!campaignMap.has(name)) {
            campaignMap.set(name, {
                name,
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                value: 0
            });
        }
        const c = campaignMap.get(name);
        c.spend += spend;
        c.impressions += imps;
        c.clicks += clicks;
        c.conversions += conv;
        c.value += val;
    }

    // Calculations
    const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const avgROAS = totalSpend > 0 ? totalConversionValue / totalSpend : 0;

    const campaigns = Array.from(campaignMap.values()).map(c => ({
        ...c,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
        cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
        roas: c.spend > 0 ? c.value / c.spend : 0,
    })).sort((a, b) => b.spend - a.spend);

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
        totals: {
            spend: totalSpend,
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            value: totalConversionValue,
            ctr: avgCTR,
            cpc: avgCPC,
            cpa: avgCPA,
            roas: avgROAS,
        },
        campaigns,
        daily
    };
}
