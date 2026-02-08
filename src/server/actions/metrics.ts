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
        cpm: number;
        frequency: number;
        leads: number;
    };
    campaigns: any[];
    ads: any[];
    daily: any[];
};

export async function getMetaAdsMetrics(from?: string, to?: string): Promise<DashboardMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    // Filter by Date
    // If no date provided, default to last 30 days
    const endDate = to ? new Date(to) : new Date();
    const startDate = from ? new Date(from) : subDays(new Date(), 30);

    // Fetch Raw Data
    // We join with integrations to ensure we only get 'meta' provider data
    const metrics = await biDb.select({
        campaignName: campaignMetrics.campaignName,
        spend: campaignMetrics.spend,
        impressions: campaignMetrics.impressions,
        clicks: campaignMetrics.clicks,
        conversions: campaignMetrics.conversions,
        leads: campaignMetrics.leads, // Added
        conversionValue: campaignMetrics.conversionValue,
        date: campaignMetrics.date,
        cpm: campaignMetrics.cpm,
        frequency: campaignMetrics.frequency,
        adName: campaignMetrics.adName, // Explicitly selecting adName
    })
        .from(campaignMetrics)
        .innerJoin(integrations, eq(campaignMetrics.integrationId, integrations.id))
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            eq(integrations.provider, "meta"),
            gte(campaignMetrics.date, startDate),
            sql`${campaignMetrics.date} <= ${endDate}` // Use SQL for upper bound to be safe with timestamps
        ));

    // Aggregation
    let totalSpend = 0;
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalConversions = 0;
    let totalLeads = 0; // Added
    let totalConversionValue = 0;

    // Daily Map for Charts
    const dailyMap = new Map<string, any>();
    // Campaign Map for Table
    const campaignMap = new Map<string, any>();
    // Ad Map for Pie Chart
    const adMap = new Map<string, any>();

    for (const m of metrics) {
        const dateStr = new Date(m.date).toISOString().split('T')[0];
        const spend = Number(m.spend);
        const imps = m.impressions || 0;
        const clicks = m.clicks || 0;
        const conv = m.conversions || 0;
        const leads = m.leads || 0; // Added
        const val = Number(m.conversionValue) || 0;

        // Totals
        totalSpend += spend;
        totalImpressions += imps;
        totalClicks += clicks;
        totalConversions += conv;
        totalLeads += leads;
        totalConversionValue += val;

        // Daily Grouping
        if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, {
                date: dateStr,
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                leads: 0, // Added
                value: 0,
                roas: 0
            });
        }
        const d = dailyMap.get(dateStr);
        d.spend += spend;
        d.impressions += imps;
        d.clicks += clicks;
        d.conversions += conv;
        d.leads += leads;
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
                leads: 0,
                value: 0
            });
        }
        const c = campaignMap.get(name);
        c.spend += spend;
        c.impressions += imps;
        c.clicks += clicks;
        c.conversions += conv;
        c.leads += leads;
        c.value += val;

        // Ad Grouping
        const adName = m.adName || "Unknown Ad";
        if (!adMap.has(adName)) {
            adMap.set(adName, {
                name: adName,
                spend: 0,
                impressions: 0,
                clicks: 0,
                conversions: 0,
                leads: 0,
                value: 0
            });
        }
        const a = adMap.get(adName);
        a.spend += spend;
        a.impressions += imps;
        a.clicks += clicks;
        a.conversions += conv;
        a.leads += leads;
        a.value += val;
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
        cpl: c.leads > 0 ? c.spend / c.leads : 0, // Cost per Lead
        roas: c.spend > 0 ? c.value / c.spend : 0,
    })).sort((a, b) => b.spend - a.spend);

    const ads = Array.from(adMap.values()).map(a => ({
        ...a,
        roas: a.spend > 0 ? a.value / a.spend : 0,
    })).sort((a, b) => b.conversions - a.conversions); // Sort by conversions for "Best Ads"

    const daily = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
        totals: {
            spend: totalSpend,
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            leads: totalLeads, // Added
            value: totalConversionValue,
            ctr: avgCTR,
            cpc: avgCPC,
            cpa: avgCPA,
            roas: avgROAS,
            cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
            frequency: 1.2, // Placeholder average, as we don't have weighted avg logic yet for multiple campaigns
        },
        campaigns,
        ads,
        daily
    };
}
