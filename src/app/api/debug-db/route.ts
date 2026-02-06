
import { NextResponse } from "next/server";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { desc, sql } from "drizzle-orm";

export async function GET() {
    try {
        // 1. Metrics by Integration
        const metricsByIntegration = await biDb.select({
            integrationId: campaignMetrics.integrationId,
            count: sql<number>`count(*)`,
            minDate: sql<string>`min(${campaignMetrics.date})`,
            maxDate: sql<string>`max(${campaignMetrics.date})`
        })
            .from(campaignMetrics)
            .groupBy(campaignMetrics.integrationId);

        // 2. All Integrations
        const allIntegrations = await biDb.select().from(integrations);

        // 3. Match them up
        const report = allIntegrations.map(integ => {
            const stats = metricsByIntegration.find(m => m.integrationId === integ.id);
            return {
                integrationId: integ.id,
                provider: integ.provider,
                metricsCount: stats ? stats.count : 0,
                dateRange: stats ? `${stats.minDate} to ${stats.maxDate}` : "N/A"
            };
        });

        // Check for orphans
        const orphanMetrics = metricsByIntegration.filter(m => !allIntegrations.find(i => i.id === m.integrationId));

        // Users check
        const userSample = await biDb.select({ email: users.email, orgId: users.organizationId }).from(users).limit(3);

        return NextResponse.json({
            report,
            orphans: orphanMetrics,
            users: userSample
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
