"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { subDays, format } from "date-fns";

export type GoogleAdsMetrics = {
    summary: {
        totalSpend: number;
        totalConversions: number;
        costPerConversion: number;
        totalClicks: number;
        avgCpc: number;
        totalImpressions: number;
        ctr: number;
        conversionRate: number;
    };
    daily: {
        date: string;
        spend: number;
        conversions: number;
        costPerConversion: number;
    }[];
    campaigns: {
        name: string;
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        ctr: number;
        cpc: number;
        cpa: number;
    }[];
    keywords: {
        keyword: string;
        clicks: number;
        conversions: number;
    }[];
};

export async function getGoogleAdsMetrics(from?: string, to?: string): Promise<GoogleAdsMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    // Dates
    const endDate = to ? new Date(`${to}T23:59:59.999Z`) : new Date();
    const startDate = from ? new Date(`${from}T00:00:00.000Z`) : subDays(new Date(), 30);

    // Get Google Ads integration IDs for this org
    const googleIntegrations = await biDb.query.integrations.findMany({
        where: and(
            eq(integrations.organizationId, orgId),
            eq(integrations.provider, "google_ads")
        ),
        columns: { id: true }
    });

    const googleIntegrationIds = new Set(googleIntegrations.map(i => i.id));

    // Fetch all campaign metrics for Google Ads
    const metricsData = await biDb.select({
        date: campaignMetrics.date,
        campaignId: campaignMetrics.campaignId,
        campaignName: campaignMetrics.campaignName,
        spend: campaignMetrics.spend,
        impressions: campaignMetrics.impressions,
        clicks: campaignMetrics.clicks,
        conversions: campaignMetrics.conversions,
        ctr: campaignMetrics.ctr,
        cpc: campaignMetrics.cpc,
        cpa: campaignMetrics.cpa,
        integrationId: campaignMetrics.integrationId,
    })
        .from(campaignMetrics)
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            gte(campaignMetrics.date, startDate),
            lte(campaignMetrics.date, endDate)
        ));

    // Filter only Google Ads data
    const googleData = metricsData.filter(m => googleIntegrationIds.has(m.integrationId));

    // Aggregate totals
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;
    let totalConversions = 0;

    // Daily aggregation
    const dailyMap = new Map<string, { spend: number; conversions: number }>();

    // Campaign aggregation
    const campaignMap = new Map<string, {
        name: string; spend: number; impressions: number;
        clicks: number; conversions: number;
    }>();

    googleData.forEach(m => {
        const date = m.date ? format(m.date, 'yyyy-MM-dd') : null;
        const spend = Number(m.spend || 0);
        const clicks = Number(m.clicks || 0);
        const impressions = Number(m.impressions || 0);
        const conversions = Number(m.conversions || 0);

        totalSpend += spend;
        totalClicks += clicks;
        totalImpressions += impressions;
        totalConversions += conversions;

        // Daily
        if (date) {
            const existing = dailyMap.get(date) || { spend: 0, conversions: 0 };
            existing.spend += spend;
            existing.conversions += conversions;
            dailyMap.set(date, existing);
        }

        // Campaign
        const campKey = m.campaignId || m.campaignName || 'unknown';
        const campName = m.campaignName || campKey;
        const existing = campaignMap.get(campKey) || {
            name: campName, spend: 0, impressions: 0, clicks: 0, conversions: 0
        };
        existing.spend += spend;
        existing.impressions += impressions;
        existing.clicks += clicks;
        existing.conversions += conversions;
        campaignMap.set(campKey, existing);
    });

    // Calculations
    const costPerConversion = totalConversions > 0 ? totalSpend / totalConversions : 0;
    const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    // Daily array
    const daily = Array.from(dailyMap.entries())
        .map(([date, val]) => ({
            date,
            spend: val.spend,
            conversions: val.conversions,
            costPerConversion: val.conversions > 0 ? val.spend / val.conversions : 0,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Campaigns array
    const campaigns = Array.from(campaignMap.values())
        .map(c => ({
            ...c,
            ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
            cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
            cpa: c.conversions > 0 ? c.spend / c.conversions : 0,
        }))
        .sort((a, b) => b.spend - a.spend);

    return {
        summary: {
            totalSpend,
            totalConversions,
            costPerConversion,
            totalClicks,
            avgCpc,
            totalImpressions,
            ctr,
            conversionRate,
        },
        daily,
        campaigns,
        keywords: [], // Keywords require separate API query (future enhancement)
    };
}
