import "server-only";
import { db } from "@/server/db";
import { campaignMetrics } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface GoogleAdsMetric {
    campaign_id: string;
    campaign_name: string;
    cost_micros: number;
    impressions: number;
    clicks: number;
    conversions: number;
}

interface MetaAdsMetric {
    campaign_id: string;
    campaign_name: string;
    spend: string;
    impressions: string;
    clicks: string;
    actions?: Array<{ action_type: string; value: string }>;
}

export interface NormalizedMetric {
    campaignId: string;
    campaignName: string;
    spend: string; // In dollars
    impressions: number;
    clicks: number;
    conversions: number;
    date: Date;
}

export function normalizeGoogleAdsMetrics(
    rawMetrics: GoogleAdsMetric[]
): NormalizedMetric[] {
    return rawMetrics.map((metric) => ({
        campaignId: metric.campaign_id,
        campaignName: metric.campaign_name,
        spend: (metric.cost_micros / 1_000_000).toFixed(2),
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        date: new Date(),
    }));
}

export function normalizeMetaAdsMetrics(
    rawMetrics: MetaAdsMetric[]
): NormalizedMetric[] {
    return rawMetrics.map((metric) => {
        const conversions =
            metric.actions?.find((a) => a.action_type === "purchase")?.value || "0";

        return {
            campaignId: metric.campaign_id,
            campaignName: metric.campaign_name,
            spend: parseFloat(metric.spend).toFixed(2),
            impressions: parseInt(metric.impressions),
            clicks: parseInt(metric.clicks),
            conversions: parseInt(conversions),
            date: new Date(),
        };
    });
}

export async function saveMetrics(
    organizationId: string,
    integrationId: string,
    metrics: NormalizedMetric[]
) {
    const records = metrics.map((m) => ({
        organizationId,
        integrationId,
        date: m.date,
        impressions: m.impressions,
        clicks: m.clicks,
        spend: m.spend,
        conversions: m.conversions,
        campaignName: m.campaignName,
        campaignId: m.campaignId,
    }));

    await db.insert(campaignMetrics).values(records);
}
