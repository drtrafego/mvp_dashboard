
import { NextResponse } from 'next/server';
import { biDb } from '@/server/db';
import { integrations, campaignMetrics } from '@/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { subDays } from 'date-fns';
import { getGoogleAdsData } from '@/server/integrations/google-ads';
import { getValidAccessToken } from '@/server/utils/token-refresh';
import { logSystem } from '@/server/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
    try {
        // Validate CRON_SECRET
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error("[CRON] sync-google: Unauthorized request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[CRON] Starting Google Ads sync at", new Date().toISOString());

        // Fetch all Google Ads integrations
        const googleIntegrations = await biDb.select()
            .from(integrations)
            .where(eq(integrations.provider, "google_ads"));

        console.log(`[CRON] Found ${googleIntegrations.length} Google Ads integrations.`);

        const results = [];

        for (const integration of googleIntegrations) {
            try {
                console.log(`[CRON] Syncing Google Ads for Org ${integration.organizationId}...`);

                // Get fresh access token
                const accessToken = await getValidAccessToken(integration.id);
                const refreshToken = integration.refreshToken || "";
                const customerId = integration.providerAccountId;

                if (!accessToken || !customerId) {
                    console.log(`[CRON] Missing credentials for Org ${integration.organizationId}`);
                    results.push({ organizationId: integration.organizationId, status: 'skipped', reason: 'missing_credentials' });
                    continue;
                }

                // Fetch data
                const data = await getGoogleAdsData(accessToken, customerId, refreshToken, 30);

                if (!data.length) {
                    console.log(`[CRON] No data for Org ${integration.organizationId}`);
                    results.push({ organizationId: integration.organizationId, status: 'skipped', reason: 'no_data' });
                    continue;
                }

                // Atomic update: delete old -> insert new
                const startDate = subDays(new Date(), 30);

                await biDb.delete(campaignMetrics)
                    .where(and(
                        eq(campaignMetrics.integrationId, integration.id),
                        gte(campaignMetrics.date, startDate)
                    ));

                const values = data.map((item: any) => ({
                    integrationId: integration.id,
                    organizationId: integration.organizationId,
                    date: new Date(item.date),
                    campaignId: item.campaignId,
                    campaignName: item.campaignName,
                    impressions: Number(item.impressions) || 0,
                    clicks: Number(item.clicks) || 0,
                    spend: String(item.spend || 0),
                    conversions: Number(item.conversions) || 0,
                    conversionValue: String(item.conversionValue || 0),
                }));

                if (values.length > 0) {
                    await biDb.insert(campaignMetrics).values(values);
                }

                console.log(`[CRON] Synced ${values.length} records for Org ${integration.organizationId}`);
                results.push({ organizationId: integration.organizationId, status: 'success', count: values.length });

            } catch (error: any) {
                console.error(`[CRON] Failed to sync Org ${integration.organizationId}:`, error.message);
                await logSystem(integration.organizationId, "GOOGLE_ADS", "ERROR", `CRON Sync Error: ${error.message}`);
                results.push({ organizationId: integration.organizationId, status: 'error', error: error.message });
            }
        }

        console.log("[CRON] Google Ads sync completed:", JSON.stringify(results));

        return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error("[CRON] Google Ads sync FAILED:", error);
        return NextResponse.json(
            { success: false, error: error.message, timestamp: new Date().toISOString() },
            { status: 500 }
        );
    }
}
