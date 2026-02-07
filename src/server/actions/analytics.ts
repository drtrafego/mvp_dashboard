
"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { subDays, startOfDay } from "date-fns";

export type AnalyticsMetrics = {
    totals: {
        sessions: number;
        users: number;
        conversions: number;
        engagementRate: number;
        avgSessionDuration: number;
        bounceRate: number;
    };
    sources: any[];
    pages: any[]; // Placeholder for now as we don't sync pages yet
};

export async function getAnalyticsMetrics(days = 90): Promise<AnalyticsMetrics> {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });
    if (!user || !user.organizationId) throw new Error("Usuário sem organização");
    const orgId = user.organizationId;

    const startDate = startOfDay(subDays(new Date(), days));

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
            gte(campaignMetrics.date, startDate)
        ));

    let totalSessions = 0;
    let totalUsers = 0;
    let totalConversions = 0;

    // Aggregation
    const sourceMap = new Map<string, any>();

    for (const m of metrics) {
        const sess = m.sessions || 0;
        const usrs = m.users || 0;
        const conv = m.conversions || 0;

        totalSessions += sess;
        totalUsers += usrs;
        totalConversions += conv;

        // Group by Source (Campaign Name used as proxy for now since schema is limited)
        const name = m.campaign || "Direto / Orgânico";
        if (!sourceMap.has(name)) {
            sourceMap.set(name, {
                name,
                sessions: 0,
                users: 0,
                conversions: 0
            });
        }
        const s = sourceMap.get(name);
        s.sessions += sess;
        s.users += usrs;
        s.conversions += conv;
    }

    const sources = Array.from(sourceMap.values())
        .map(s => ({
            ...s,
            percentage: totalSessions > 0 ? (s.sessions / totalSessions) * 100 : 0
        }))
        .sort((a, b) => b.sessions - a.sessions);

    return {
        totals: {
            sessions: totalSessions,
            users: totalUsers,
            conversions: totalConversions,
            engagementRate: 0, // Not synced yet
            avgSessionDuration: 0, // Not synced yet
            bounceRate: 0 // Not synced yet
        },
        sources,
        pages: []
    };
}
