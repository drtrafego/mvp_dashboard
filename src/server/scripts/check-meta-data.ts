
import { biDb } from "../db";
import { campaignMetrics, integrations } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

async function main() {
    console.log("Checking Meta Ads Data...");

    const metaIntegrations = await biDb.select().from(integrations).where(eq(integrations.provider, 'facebook_ads'));

    if (metaIntegrations.length === 0) {
        console.log("No Meta (facebook_ads) integration found.");
        return;
    }

    for (const integration of metaIntegrations) {
        console.log(`Integration ID: ${integration.id}, Org ID: ${integration.organizationId}`);

        const latestMetrics = await biDb.select()
            .from(campaignMetrics)
            .where(eq(campaignMetrics.integrationId, integration.id))
            .orderBy(desc(campaignMetrics.date))
            .limit(5);

        if (latestMetrics.length === 0) {
            console.log("  No metrics found for this integration.");
        } else {
            console.log("  Latest 5 metrics:");
            latestMetrics.forEach(m => {
                console.log(`    Date: ${m.date}, Campaign: ${m.campaignName}, Impressions: ${m.impressions}, Spend: ${m.spend}`);
            });
        }
    }
}

main().catch(console.error);
