"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, leadAttribution, users } from "@/server/db/schema";
import { and, eq, gte, lte } from "drizzle-orm";
import { subDays, format } from "date-fns";

export type LaunchMetrics = {
    summary: {
        leads: number;
        investment: number;
        cpl: number;
        trackingRate: number;
        leadsTracked: number;
        leadsUntracked: number;
        impressions: number;
        clicks: number;
        ctr: number;
        pageViews: number;
        connectRate: number;
        hookRate: number;
        holdRate: number;
    };
    daily: {
        date: string;
        leads: number;
        investment: number;
    }[];
    dailyBySource: Record<string, string | number>[];
    temperature: {
        name: string; // "Frio" (P1) or "Quente" (P2)
        value: number;
        fill: string;
    }[];
    utmSource: {
        name: string;
        leads: number;
    }[];
    utmMedium: {
        name: string;
        leads: number;
    }[];
    utmCampaign: {
        name: string;
        leads: number;
    }[];
    utmTerm: {
        name: string;
        leads: number;
    }[];
    utmContent: {
        name: string;
        leads: number;
    }[];
};

export async function getLaunchMetrics(from?: string, to?: string): Promise<LaunchMetrics> {
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

    // 1. Fetch Investment + Ad Metrics from Campaign Metrics
    const metrics = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
        impressions: campaignMetrics.impressions,
        clicks: campaignMetrics.clicks,
        landingPageViews: campaignMetrics.landingPageViews,
        linkClicks: campaignMetrics.linkClicks,
        videoViews3s: campaignMetrics.videoViews3s,
        videoThruplays: campaignMetrics.videoThruplays,
    })
        .from(campaignMetrics)
        .where(and(
            eq(campaignMetrics.organizationId, orgId),
            gte(campaignMetrics.date, startDate),
            lte(campaignMetrics.date, endDate)
        ));

    // 2. Fetch Leads from Lead Attribution
    const leads = await biDb.select({
        date: leadAttribution.conversionDate,
        source: leadAttribution.source,
        utmSource: leadAttribution.source,
        utmMedium: leadAttribution.medium,
        utmCampaign: leadAttribution.utmCampaign,
        utmTerm: leadAttribution.utmTerm,
        utmContent: leadAttribution.utmContent,
    })
        .from(leadAttribution)
        .where(and(
            eq(leadAttribution.organizationId, orgId),
            gte(leadAttribution.conversionDate, startDate),
            lte(leadAttribution.conversionDate, endDate)
        ));

    // --- Processing ---

    // A. Summary KPIs
    const totalInvestment = metrics.reduce((acc, curr) => acc + Number(curr.spend || 0), 0);
    const totalLeads = leads.length;

    // Tracking Rate: Leads with ANY UTM Source vs Total
    const trackedLeads = leads.filter(l => l.utmSource && l.utmSource.trim() !== "").length;
    const trackingRate = totalLeads > 0 ? (trackedLeads / totalLeads) * 100 : 0;
    const cpl = totalLeads > 0 ? totalInvestment / totalLeads : 0;

    // Ad Performance Aggregations
    const totalImpressions = metrics.reduce((acc, curr) => acc + Number(curr.impressions || 0), 0);
    const totalClicks = metrics.reduce((acc, curr) => acc + Number(curr.clicks || 0), 0);
    const totalPageViews = metrics.reduce((acc, curr) => acc + Number(curr.landingPageViews || 0), 0);
    const totalLinkClicks = metrics.reduce((acc, curr) => acc + Number(curr.linkClicks || 0), 0);
    const totalVideoViews3s = metrics.reduce((acc, curr) => acc + Number(curr.videoViews3s || 0), 0);
    const totalVideoThruplays = metrics.reduce((acc, curr) => acc + Number(curr.videoThruplays || 0), 0);

    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const connectRate = totalLinkClicks > 0 ? (totalPageViews / totalLinkClicks) * 100 : 0;
    const hookRate = totalImpressions > 0 ? (totalVideoViews3s / totalImpressions) * 100 : 0;
    const holdRate = totalVideoViews3s > 0 ? (totalVideoThruplays / totalVideoViews3s) * 100 : 0;

    // B. Temperature (P1 vs P2)
    // Logic: 
    // P1 (Cold) = utm_source contains "p1" (case insensitive) -> "Frio"
    // P2 (Hot) = utm_source contains "p2" (case insensitive) -> "Quente"
    // Others -> "Outros"
    let p1Count = 0;
    let p2Count = 0;
    let otherCount = 0;

    leads.forEach(l => {
        const src = (l.utmSource || "").toLowerCase();
        if (src.includes("p1")) {
            p1Count++;
        } else if (src.includes("p2")) {
            p2Count++;
        } else {
            otherCount++;
        }
    });

    const temperature = [
        { name: "Frio (P1)", value: p1Count, fill: "#3b82f6" }, // Blue
        { name: "Quente (P2)", value: p2Count, fill: "#ef4444" }, // Red
        { name: "Outros", value: otherCount, fill: "#9ca3af" } // Gray
    ].filter(i => i.value > 0);


    // C. Daily Data (Combined)
    const dailyMap = new Map<string, { leads: number; investment: number }>();

    // Init from metrics (spend)
    metrics.forEach(m => {
        if (!m.date) return;
        const d = format(m.date, 'yyyy-MM-dd');
        if (!dailyMap.has(d)) dailyMap.set(d, { leads: 0, investment: 0 });
        dailyMap.get(d)!.investment += Number(m.spend || 0);
    });

    // Add leads
    leads.forEach(l => {
        if (!l.date) return;
        const d = format(l.date, 'yyyy-MM-dd');
        if (!dailyMap.has(d)) dailyMap.set(d, { leads: 0, investment: 0 });
        dailyMap.get(d)!.leads += 1;
    });

    const daily = Array.from(dailyMap.entries())
        .map(([date, val]) => ({ date, ...val }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // D. Drilldowns (Source/Medium/Campaign) - Top 10
    const groupAndCount = (data: typeof leads, key: keyof (typeof leads)[0]) => {
        const counts = new Map<string, number>();
        data.forEach(item => {
            const val = String(item[key] || "(not set)");
            counts.set(val, (counts.get(val) || 0) + 1);
        });
        return Array.from(counts.entries())
            .map(([name, leads]) => ({ name, leads }))
            .sort((a, b) => b.leads - a.leads)
            .slice(0, 10);
    };

    // E. Daily Leads by Source (for Evolution Chart)
    const dailyBySourceMap = new Map<string, Map<string, number>>();
    // Structure: date -> { source1: count, source2: count ... }

    leads.forEach(l => {
        if (!l.date) return;
        const d = format(l.date, 'yyyy-MM-dd');
        const s = l.utmSource || "(not set)";

        if (!dailyBySourceMap.has(d)) dailyBySourceMap.set(d, new Map());
        const dateMap = dailyBySourceMap.get(d)!;
        dateMap.set(s, (dateMap.get(s) || 0) + 1);
    });

    const dailyBySource = Array.from(dailyBySourceMap.entries())
        .map(([date, sourceCounts]) => {
            const entry: Record<string, string | number> = { date };
            sourceCounts.forEach((count, source) => {
                entry[source] = count;
            });
            return entry;
        })
        .sort((a, b) => (a.date as string).localeCompare(b.date as string));

    return {
        summary: {
            leads: totalLeads,
            investment: totalInvestment,
            cpl,
            trackingRate,
            leadsTracked: trackedLeads,
            leadsUntracked: totalLeads - trackedLeads,
            impressions: totalImpressions,
            clicks: totalClicks,
            ctr,
            pageViews: totalPageViews,
            connectRate,
            hookRate,
            holdRate,
        },
        daily,
        dailyBySource,
        temperature,
        utmSource: groupAndCount(leads, "utmSource"),
        utmMedium: groupAndCount(leads, "utmMedium"),
        utmCampaign: groupAndCount(leads, "utmCampaign"),
        utmTerm: groupAndCount(leads, "utmTerm"),
        utmContent: groupAndCount(leads, "utmContent"), // Assuming 'utmContent' mapped to 'utmContent' col? checking schema...
        // Wait, checking schema in previous steps... leadAttribution has utmContent?
        // Let's check schema first to be safe.
    };
}
