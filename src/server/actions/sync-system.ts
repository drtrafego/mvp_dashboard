
import { biDb } from "@/server/db";
import { integrations, campaignMetrics } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { getMetaAdsData } from "@/server/integrations/meta-ads";
import { logSystem } from "@/server/logger";

export async function syncAllMetaAdsIntegrations(days = 30) {
    console.log("[CRON] Starting Meta Ads System Sync...");

    // 1. Fetch all Meta Integrations
    const metaIntegrations = await biDb.select()
        .from(integrations)
        .where(eq(integrations.provider, "meta"));

    console.log(`[CRON] Found ${metaIntegrations.length} Meta integrations.`);

    const results = [];

    for (const integration of metaIntegrations) {
        try {
            console.log(`[CRON] Syncing Org ${integration.organizationId} (Integration ${integration.id})...`);

            // 2. Fetch Data
            // Note: getMetaAdsData uses the System Token from ENV, which is correct for now.
            // It looks up adAccountSettings using orgId.
            const data = await getMetaAdsData(integration.organizationId, days);

            if (!data.length) {
                console.log(`[CRON] No data for Org ${integration.organizationId}`);
                results.push({ organizationId: integration.organizationId, status: 'skipped', reason: 'no_data' });
                continue;
            }

            // 3. Atomic Update
            const startDate = subDays(new Date(), days);

            // Delete existing
            await biDb.delete(campaignMetrics)
                .where(and(
                    eq(campaignMetrics.integrationId, integration.id),
                    gte(campaignMetrics.date, startDate)
                ));

            // Insert new
            const values = data.map((item: any) => ({
                integrationId: integration.id,
                organizationId: integration.organizationId,
                date: new Date(item.date),
                campaignId: item.campaignId,
                campaignName: item.campaignName,
                adId: item.adId,
                adName: item.adName,

                impressions: Number(item.impressions) || 0,
                clicks: Number(item.clicks) || 0,
                spend: String(item.spend || 0),
                conversions: Number(item.conversions) || 0,
                leads: Number(item.leads) || 0,
                conversionValue: String(item.conversionValue || 0),

                ctr: String(item.ctr || 0),
                cpc: String(item.cpc || 0),

                videoViews3s: Number(item.videoViews3s) || 0,
                videoThruplays: Number(item.videoThruplays) || 0,
                videoViews75: Number(item.videoViews75) || 0,
                videoCompletes: Number(item.videoCompletes) || 0,
                linkClicks: Number(item.linkClicks) || 0,
                landingPageViews: Number(item.landingPageViews) || 0,
            }));

            if (values.length > 0) {
                await biDb.insert(campaignMetrics).values(values);
            }

            console.log(`[CRON] Synced ${values.length} records for Org ${integration.organizationId}`);
            results.push({ organizationId: integration.organizationId, status: 'success', count: values.length });

        } catch (error: any) {
            console.error(`[CRON] Failed to sync Org ${integration.organizationId}:`, error);
            await logSystem(integration.organizationId, "META_ADS", "ERROR", `CRON Sync Error: ${error.message}`);
            results.push({ organizationId: integration.organizationId, status: 'error', error: error.message });
        }
    }

    return results;
}
