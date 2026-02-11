"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, leadAttribution, users } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { subDays, format } from "date-fns";

export type AggregatedMetrics = {
    summary: {
        totalInvestment: number;
        totalLeads: number;
        totalConversions: number;
        avgCpl: number;
        metaSpend: number;
        googleSpend: number;
        metaLeads: number;
        googleLeads: number;
        metaCpl: number;
        googleCpl: number;
    };
    daily: {
        date: string;
        metaSpend: number;
        googleSpend: number;
        metaLeads: number;
        googleLeads: number;
        totalLeads: number;
        metaCpl: number;
        googleCpl: number;
        totalCpl: number;
    }[];
    pieInvestment: { name: string; value: number; fill: string }[];
    pieLeads: { name: string; value: number; fill: string }[];
};

export async function getAggregatedMetrics(from?: string, to?: string): Promise<AggregatedMetrics> {
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

    // 1. Fetch Campaign Metrics (Spend)
    const metricsData = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
        integrationId: campaignMetrics.integrationId,
    })
        .from(campaignMetrics)
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            gte(campaignMetrics.date, startDate),
            lte(campaignMetrics.date, endDate)
        ));

    // 2. Fetch Leads from Lead Attribution (Source of Truth for Leads)
    const leadsData = await biDb.select({
        date: leadAttribution.conversionDate,
        source: leadAttribution.source,
    })
        .from(leadAttribution)
        .where(and(
            eq(leadAttribution.organizationId, orgId),
            gte(leadAttribution.conversionDate, startDate),
            lte(leadAttribution.conversionDate, endDate)
        ));

    // Get integrations to map ID -> Provider
    const orgIntegrations = await biDb.query.integrations.findMany({
        where: eq(integrations.organizationId, orgId),
        columns: { id: true, provider: true } // provider: 'meta', 'google_ads'
    });

    const integrationMap = new Map(orgIntegrations.map(i => [i.id, i.provider]));

    // 3. Process Metrics
    let metaSpend = 0;
    let googleSpend = 0;
    let metaLeads = 0;
    let googleLeads = 0;
    let otherLeads = 0;

    const dailyMap = new Map<string, {
        metaSpend: number, googleSpend: number,
        metaLeads: number, googleLeads: number, totalLeads: number
    }>();

    // Helper to ensure daily entry exists
    const getDailyEntry = (dateKey: string) => {
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, {
                metaSpend: 0, googleSpend: 0,
                metaLeads: 0, googleLeads: 0, totalLeads: 0
            });
        }
        return dailyMap.get(dateKey)!;
    };

    // Process Spend
    metricsData.forEach(m => {
        const date = m.date ? format(m.date, 'yyyy-MM-dd') : null;
        if (!date) return;

        const provider = integrationMap.get(m.integrationId);
        const spend = Number(m.spend || 0);

        const entry = getDailyEntry(date);

        if (provider === 'meta') {
            metaSpend += spend;
            entry.metaSpend += spend;
        } else if (provider === 'google_ads') {
            googleSpend += spend;
            entry.googleSpend += spend;
        }
    });

    // Process Leads
    leadsData.forEach(l => {
        const date = l.date ? format(l.date, 'yyyy-MM-dd') : null;
        if (!date) return;

        const entry = getDailyEntry(date);
        const source = (l.source || "").toLowerCase();

        entry.totalLeads += 1;

        // Simple heuristic for platform attribution based on utm_source
        // Adjust these rules based on your actual data patterns
        if (source.includes('facebook') || source.includes('instagram') || source.includes('meta') || source.includes('fb') || source.includes('ig')) {
            metaLeads += 1;
            entry.metaLeads += 1;
        } else if (source.includes('google') || source.includes('adwords') || source.includes('youtube') || source.includes('gads')) {
            googleLeads += 1;
            entry.googleLeads += 1;
        } else {
            otherLeads += 1;
            // entry.otherLeads? We don't track otherLeads in daily breakdown typically, but included in total
        }
    });

    // Final Totals
    const totalInvestment = metaSpend + googleSpend;
    const totalLeads = metaLeads + googleLeads + otherLeads;
    const avgCpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;

    const metaCpl = metaLeads > 0 ? metaSpend / metaLeads : 0;
    const googleCpl = googleLeads > 0 ? googleSpend / googleLeads : 0;

    // Daily Array with CPL Calculation
    const daily = Array.from(dailyMap.entries())
        .map(([date, val]) => {
            const totalDailySpend = val.metaSpend + val.googleSpend;
            const dailyMetaCpl = val.metaLeads > 0 ? val.metaSpend / val.metaLeads : 0;
            const dailyGoogleCpl = val.googleLeads > 0 ? val.googleSpend / val.googleLeads : 0;
            const dailyTotalCpl = val.totalLeads > 0 ? totalDailySpend / val.totalLeads : 0;

            return {
                date,
                ...val,
                metaCpl: dailyMetaCpl,
                googleCpl: dailyGoogleCpl,
                totalCpl: dailyTotalCpl
            };
        })
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        summary: {
            totalInvestment,
            totalLeads,
            totalConversions: totalLeads,
            avgCpl,
            metaSpend,
            googleSpend,
            metaLeads,
            googleLeads,
            metaCpl,
            googleCpl
        },
        daily,
        pieInvestment: [
            { name: "Meta Ads", value: metaSpend, fill: "#3b82f6" }, // Blue
            { name: "Google Ads", value: googleSpend, fill: "#ef4444" }, // Red
        ].filter(i => i.value > 0),
        pieLeads: [
            { name: "Meta Ads", value: metaLeads, fill: "#3b82f6" },
            { name: "Google Ads", value: googleLeads, fill: "#ef4444" },
            { name: "Outros", value: otherLeads, fill: "#9ca3af" },
        ].filter(i => i.value > 0)
    };
}
