
import { NextResponse } from "next/server";
import { biDb } from "@/server/db";
import { campaignMetrics, integrations, users } from "@/server/db/schema";
import { desc, eq } from "drizzle-orm";

export async function GET() {
    try {
        // 1. Check Metrics
        const metrics = await biDb.select().from(campaignMetrics).limit(5).orderBy(desc(campaignMetrics.date));

        // 2. Check Integrations
        const allIntegrations = await biDb.select().from(integrations);

        // 3. Check Users
        const allUsers = await biDb.select().from(users).limit(5);

        return NextResponse.json({
            metricsCount: metrics.length,
            sampleMetric: metrics[0],
            integrations: allIntegrations,
            users: allUsers.map(u => ({ email: u.email, orgId: u.organizationId }))
        });
    } catch (error: any) {
        console.error("Debug route error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
