"use server";

import { getMetaAdsData } from "@/server/integrations/meta-ads";
import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { users, adAccountSettings, integrations, campaignMetrics } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays, format } from "date-fns";
import { logSystem } from "@/server/logger";

export async function syncMetaAds() {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Não autenticado" };

    // 1. Get User & Org
    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email),
    });

    if (!user || !user.organizationId) return { success: false, error: "Usuário sem organização" };

    const orgId = user.organizationId;

    // 2. Get Settings (Ad Account ID)
    const settings = await biDb.query.adAccountSettings.findFirst({
        where: eq(adAccountSettings.organizationId, orgId),
    });

    if (!settings?.facebookAdAccountId) {
        return { success: false, error: "ID da conta de anúncios não configurado em Ajustes" };
    }

    const adAccountId = settings.facebookAdAccountId;

    try {
        // 3. Ensure Integration Record Exists
        // We use a placeholder for token since we use the system ENV token for now.
        let integration = await biDb.query.integrations.findFirst({
            where: and(
                eq(integrations.organizationId, orgId),
                eq(integrations.provider, "meta"),
                eq(integrations.providerAccountId, adAccountId)
            ),
        });

        if (!integration) {
            const [newIntegration] = await biDb.insert(integrations).values({
                organizationId: orgId,
                provider: "meta",
                providerAccountId: adAccountId,
                accessToken: "SYSTEM_ENV", // Placeholder
                refreshToken: "SYSTEM_ENV",
            }).returning();
            integration = newIntegration;
        }

        // 4. Fetch Data (Last 120 Days)
        await logSystem(orgId, "META_ADS", "INFO", "Buscando dados da API Meta (120 dias)...");
        const daysToSync = 120;
        const data = await getMetaAdsData(orgId, daysToSync);

        if (!data.length) {
            await logSystem(orgId, "META_ADS", "WARN", "Nenhum dado retornado pela API");
            return { success: true, count: 0, message: "Nenhum dado encontrado nos últimos 120 dias." };
        }

        // 5. Atomic Update (Delete Old -> Insert New for the date range)
        // Define safety window: delete records >= 30 days ago for this integration
        const startDate = subDays(new Date(), daysToSync);

        // 5. Atomic Update (Delete Old -> Insert New for the date range)
        // Define safety window: delete records >= 30 days ago for this integration
        const startDate = subDays(new Date(), daysToSync);

        // Delete existing
        await biDb.delete(campaignMetrics)
            .where(and(
                eq(campaignMetrics.integrationId, integration!.id),
                gte(campaignMetrics.date, startDate)
            ));

        // Insert new
        // Map API data to Schema
        const values = data.map((item: any) => ({
            integrationId: integration!.id,
            organizationId: orgId,
            date: new Date(item.date),
            campaignId: item.campaignId,
            campaignName: item.campaignName,
            adId: item.adId,
            // Unified Metrics
            impressions: Number(item.impressions) || 0,
            clicks: Number(item.clicks) || 0,
            spend: String(item.spend || 0),
            conversions: Number(item.conversions) || 0,
            conversionValue: String(item.conversionValue || 0),
            // Calculated / Meta Specific
            ctr: String(item.ctr || 0),
            cpc: String(item.cpc || 0),
        }));

        // Batch insert? Drizzle handles it, but let's be safe with chunking if huge
        if (values.length > 0) {
            await biDb.insert(campaignMetrics).values(values);
        }

        return { success: true, count: data.length };

    } catch (error: any) {
        console.error("Sync Error:", error);
        return { success: false, error: error.message };
    }
}
