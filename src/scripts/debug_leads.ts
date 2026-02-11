
import 'dotenv/config';
import { biDb } from "../server/db";
import { leadAttribution, campaignMetrics } from "../server/db/schema";
import { desc } from "drizzle-orm";

async function main() {
    console.log("Checking Lead Attribution Data...");

    // Get latest leads
    const leads = await biDb.select({
        id: leadAttribution.id,
        date: leadAttribution.conversionDate,
        source: leadAttribution.source,
        orgId: leadAttribution.organizationId
    })
        .from(leadAttribution)
        .orderBy(desc(leadAttribution.conversionDate))
        .limit(50);

    console.log(`Found ${leads.length} recent leads.`);
    if (leads.length > 0) {
        console.table(leads.map(l => ({
            date: l.date?.toISOString().split('T')[0],
            source: l.source,
            orgId: l.orgId
        })));
    }

    // Check Metrics (Spend) to see active orgs
    const metrics = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
        orgId: campaignMetrics.organizationId
    })
        .from(campaignMetrics)
        .orderBy(desc(campaignMetrics.date))
        .limit(10);

    console.log("\nRecent Campaign Metrics (Spend):");
    console.table(metrics.map(m => ({
        date: m.date?.toISOString().split('T')[0],
        spend: m.spend,
        orgId: m.orgId
    })));
}

main().catch(console.error).then(() => process.exit(0));
