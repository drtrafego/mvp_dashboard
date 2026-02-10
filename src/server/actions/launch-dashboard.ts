"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, leadAttribution, users } from "@/server/db/schema";
import { and, eq, gte, lte, sql } from "drizzle-orm";
import { subDays, format } from "date-fns";

export type LaunchMetrics = {
    summary: {
        leads: number;
        investment: number;
        cpl: number;
        trackingRate: number;
        leadsTracked: number;
        leadsUntracked: number;
    };
    daily: {
        date: string;
        leads: number;
        investment: number;
    }[];
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

    // 1. Fetch Investment (Spend) from Campaign Metrics
    const metrics = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
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
        utmSource: leadAttribution.utmSource,
        utmMedium: leadAttribution.utmMedium,
        utmCampaign: leadAttribution.utmCampaign,
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
    const groupAndCount = (data: typeof leads, key: keyof typeof leads) => {
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

    return {
        summary: {
            leads: totalLeads,
            investment: totalInvestment,
            cpl,
            trackingRate,
            leadsTracked: trackedLeads,
            leadsUntracked: totalLeads - trackedLeads,
        },
        daily,
        temperature,
        utmSource: groupAndCount(leads, "utmSource"),
        utmMedium: groupAndCount(leads, "utmMedium"),
        utmCampaign: groupAndCount(leads, "utmCampaign"),
    };
}
