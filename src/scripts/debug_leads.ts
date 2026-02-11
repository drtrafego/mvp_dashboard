
import 'dotenv/config';
import { biDb } from "../server/db";
import { leadAttribution, campaignMetrics, integrations } from "../server/db/schema";
import { desc, eq, and, gte } from "drizzle-orm";

async function main() {
    console.log("=== DIAGNOSTIC REPORT ===");

    // 1. Integrations
    const allIntegrations = await biDb.select().from(integrations);
    console.log(`\nIntegrations Found: ${allIntegrations.length}`);
    console.table(allIntegrations.map(i => ({ id: i.id, provider: i.provider })));

    // 2. Metrics (Spend) last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const metrics = await biDb.select({
        date: campaignMetrics.date,
        spend: campaignMetrics.spend,
        provider: integrations.provider
    })
        .from(campaignMetrics)
        .leftJoin(integrations, eq(campaignMetrics.integrationId, integrations.id))
        .where(gte(campaignMetrics.date, thirtyDaysAgo))
        .orderBy(desc(campaignMetrics.date))
        .limit(50);

    const metaSpend = metrics.filter(m => m.provider === 'meta').reduce((a, b) => a + Number(b.spend), 0);
    const googleSpend = metrics.filter(m => m.provider === 'google_ads').reduce((a, b) => a + Number(b.spend), 0);

    console.log(`\nRecent Spend (Last 30 Days Sample):`);
    console.log(`Meta Spend: ${metaSpend}`);
    console.log(`Google Spend: ${googleSpend}`);

    // 3. Leads (Attribution)
    const leads = await biDb.select({
        date: leadAttribution.conversionDate,
        source: leadAttribution.source,
    })
        .from(leadAttribution)
        .orderBy(desc(leadAttribution.conversionDate))
        .limit(50);

    console.log(`\nRecent Leads (Last 50): ${leads.length} records`);
    if (leads.length > 0) {
        console.table(leads.map(l => ({
            date: l.date?.toISOString().split('T')[0],
            source: l.source
        })));
    } else {
        console.log("NO LEADS FOUND in leadAttribution table.");
    }
}

main().catch(console.error).then(() => process.exit(0));
