import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';
import { biDb } from "@/server/db";
import { adAccountSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { subDays, format } from "date-fns";
import { logSystem } from "@/server/logger";

// Initialize API with default token (System Token or User Token)
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN ? process.env.META_ACCESS_TOKEN.replace(/^"|"$/g, '') : undefined;

export async function getMetaAdsData(organizationId: string, days = 30) {
    if (!META_ACCESS_TOKEN) {
        throw new Error("META_ACCESS_TOKEN not configured in environment");
    }

    // 1. Get Ad Account ID from DB
    const settings = await biDb.select()
        .from(adAccountSettings)
        .where(eq(adAccountSettings.organizationId, organizationId))
        .limit(1);

    if (!settings.length || !settings[0].facebookAdAccountId) {
        throw new Error("Conta de anúncios da Meta não configurada para esta organização");
    }

    const adAccountId = settings[0].facebookAdAccountId;

    // 2. Initialize API
    const api = FacebookAdsApi.init(META_ACCESS_TOKEN);
    // api.setDebug(true); // Enable for debugging

    const account = new AdAccount(adAccountId);

    // 3. Define Fields & Params
    const fields = [
        'account_id',
        'account_name',
        'campaign_name',
        'campaign_id',
        'adset_name',
        'adset_id',
        'ad_name',
        'ad_id',
        'spend',
        'impressions',
        'clicks',
        'cpc',
        'cpm',
        'ctr',
        'actions',
        'action_values',
    ];

    // Calculate date range based on days parameter
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const params = {
        'level': 'ad',
        'time_range': {
            'since': format(startDate, 'yyyy-MM-dd'),
            'until': format(endDate, 'yyyy-MM-dd'),
        },
        'time_increment': 1, // Daily breakdown
        'limit': 5000,
    };

    // Debug logging
    await logSystem(organizationId, "META_ADS", "INFO", "Request params", {
        adAccountId,
        dateRange: params.time_range,
        hasToken: !!META_ACCESS_TOKEN,
        tokenPreview: META_ACCESS_TOKEN?.substring(0, 10) + "..."
    });

    try {
        // Fetch Insights
        const insights = await account.getInsights(fields, params);

        await logSystem(organizationId, "META_ADS", "INFO", `API returned ${insights.length} raw records`, {
            rawCount: insights.length,
            firstRecord: insights[0] || null,
            lastRecord: insights[insights.length - 1] || null
        });

        // Transform Data
        const data = insights.map((item: any) => ({
            date: item.date_start,
            campaignId: item.campaign_id,
            campaignName: item.campaign_name,
            adId: item.ad_id,
            adName: item.ad_name,
            spend: item.spend,
            impressions: item.impressions,
            clicks: item.clicks,
            ctr: item.ctr,
            cpc: item.cpc,
            conversions: item.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0,
            conversionValue: item.action_values?.find((a: any) => a.action_type === 'purchase_value')?.value || 0,
        }));

        return data;
    } catch (error: any) {
        const errorMsg = error?.message || String(error) || "Erro desconhecido";
        await logSystem(organizationId, "META_ADS", "ERROR", `API Error: ${errorMsg}`, {
            errorCode: error?.code,
            errorType: error?.type,
            adAccountId
        });
        throw new Error(`Erro ao buscar dados do Meta Ads: ${errorMsg}`);
    }
}
