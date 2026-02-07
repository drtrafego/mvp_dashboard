
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: require('path').resolve(process.cwd(), '.env') });

const sqlConn = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sqlConn, { schema });

async function main() {
    console.log("📊 AUDITING ALL METRICS IN DB...\n");

    // 1. Get all metrics grouped by Org
    const metricsSummary = await db.select({
        orgId: schema.campaignMetrics.organizationId,
        count: sql<number>`count(*)`,
        minDate: sql<string>`min(${schema.campaignMetrics.date})`,
        maxDate: sql<string>`max(${schema.campaignMetrics.date})`,
        sampleCampaign: sql<string>`max(${schema.campaignMetrics.campaignName})` // Just a sample
    })
        .from(schema.campaignMetrics)
        .groupBy(schema.campaignMetrics.organizationId);

    // 2. Get Org Names
    const orgs = await db.select().from(schema.organizations);
    const orgMap = new Map(orgs.map(o => [o.id, o.name]));

    console.log("Found metrics for the following Organizations:");
    console.log("---------------------------------------------------");

    if (metricsSummary.length === 0) {
        console.log("❌ TABLE 'campaignMetrics' IS EMPTY!");
    }

    metricsSummary.forEach(m => {
        const orgName = orgMap.get(m.orgId) || "Unknown Org";
        console.log(`🏢 ORG: ${orgName} (ID: ${m.orgId})`);
        console.log(`   - Records: ${m.count}`);
        console.log(`   - Range:   ${new Date(m.minDate).toISOString().split('T')[0]}  <-->  ${new Date(m.maxDate).toISOString().split('T')[0]}`);
        console.log(`   - Sample:  "${m.sampleCampaign}"`);
        console.log("---------------------------------------------------");
    });

    // 3. User check
    // Check which users belong to these orgs
    const users = await db.select().from(schema.users);
    console.log("\n👥 Users associated with data-holding Orgs:");
    metricsSummary.forEach(m => {
        const orgUsers = users.filter(u => u.organizationId === m.orgId);
        orgUsers.forEach(u => {
            console.log(`   - ${u.email} (Org: ${orgMap.get(m.orgId)})`);
        });
    });

    process.exit(0);
}

main().catch(console.error);
