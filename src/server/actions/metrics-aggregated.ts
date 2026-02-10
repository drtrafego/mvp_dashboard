"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, leadAttribution, integrations, users } from "@/server/db/schema";
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

    // 1. Fetch Campaign Metrics (Includes Platform breakdown via Integration)
    // We need to join with integrations table to know which provider it is
    // But Drizzle Query Builder with 'with' is easier if relations are set up, 
    // or we just fetch metrics and manual join if we have integrationId
    // campaignMetrics has integrationId.

    const metricsData = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
        leads: campaignMetrics.leads,
        integrationId: campaignMetrics.integrationId,
    })
        .from(campaignMetrics)
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            gte(campaignMetrics.date, startDate),
            lte(campaignMetrics.date, endDate)
        ));

    // Get integrations to map ID -> Provider
    const orgIntegrations = await biDb.query.integrations.findMany({
        where: eq(integrations.organizationId, orgId),
        columns: { id: true, provider: true } // provider: 'meta', 'google_ads'
    });

    const integrationMap = new Map(orgIntegrations.map(i => [i.id, i.provider]));

    // 2. Process Metrics
    let metaSpend = 0;
    let googleSpend = 0;

    // For leads, we might prefer 'leadAttribution' table for accuracy if available,
    // but campaignMetrics also has 'leads' column if synced correctly.
    // Let's use campaignMetrics for leads for now to align with spend, 
    // OR fetch leadAttribution for better source truth?
    // The requirement says "Launch Dashboard" uses leadAttribution.
    // Let's try to use leadAttribution for Leads to be consistent with Launch Dashboard.

    const leadsData = await biDb.select({
        date: leadAttribution.conversionDate,
        source: leadAttribution.source, // 'meta', 'google'
    })
        .from(leadAttribution)
        .where(and(
            eq(leadAttribution.organizationId, orgId),
            gte(leadAttribution.conversionDate, startDate),
            lte(leadAttribution.conversionDate, endDate)
        ));

    let metaLeads = 0;
    let googleLeads = 0;
    let otherLeads = 0;

    // Process Leads
    const dailyMap = new Map<string, { metaSpend: number, googleSpend: number, metaLeads: number, googleLeads: number, totalLeads: number }>();

    leadsData.forEach(l => {
        const source = l.source?.toLowerCase() || 'other';
        const date = format(l.date, 'yyyy-MM-dd');

        if (!dailyMap.has(date)) dailyMap.set(date, { metaSpend: 0, googleSpend: 0, metaLeads: 0, googleLeads: 0, totalLeads: 0 });
        const entry = dailyMap.get(date)!;

        entry.totalLeads++;

        if (source.includes('meta') || source.includes('facebook') || source.includes('instagram')) {
            metaLeads++;
            entry.metaLeads++;
        } else if (source.includes('google')) {
            googleLeads++;
            entry.googleLeads++;
        } else {
            otherLeads++;
        }
    });

    // Process Spend & Map Integration
    metricsData.forEach(m => {
        const date = m.date ? format(m.date, 'yyyy-MM-dd') : null;
        if (!date) return;

        const provider = integrationMap.get(m.integrationId);
        const spend = Number(m.spend || 0);

        if (!dailyMap.has(date)) dailyMap.set(date, { metaSpend: 0, googleSpend: 0, metaLeads: 0, googleLeads: 0, totalLeads: 0 });
        const entry = dailyMap.get(date)!;

        if (provider === 'meta') {
            metaSpend += spend;
            entry.metaSpend += spend;
        } else if (provider === 'google_ads') {
            googleSpend += spend;
            entry.googleSpend += spend;
        }
    });

    // Final Totals
    const totalInvestment = metaSpend + googleSpend;
    const totalLeads = metaLeads + googleLeads + otherLeads;
    const avgCpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;

    const metaCpl = metaLeads > 0 ? metaSpend / metaLeads : 0;
    const googleCpl = googleLeads > 0 ? googleSpend / googleLeads : 0;

    // Daily Array
    const daily = Array.from(dailyMap.entries())
        .map(([date, val]) => ({ date, ...val }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return {
        summary: {
            totalInvestment,
            totalLeads,
            totalConversions: totalLeads, // Assuming leads = conversions for this dashboard
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
