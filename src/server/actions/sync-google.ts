"use server";

import { auth } from "@/server/auth";
import { logSystem } from "@/server/logger";
import { biDb } from "@/server/db";
import { users, adAccountSettings, integrations, campaignMetrics } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { getGoogleAdsData } from "@/server/integrations/google-ads";
import { getGA4Data } from "@/server/integrations/ga4";
import { getValidAccessToken } from "@/server/utils/token-refresh";

export async function syncGoogleAds() {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Não autenticado" };

    try {
        const user = await biDb.query.users.findFirst({ where: eq(users.email, session.user.email) });
        if (!user || !user.organizationId) return { success: false, error: "Usuário sem organização" };
        const orgId = user.organizationId;

        await logSystem(orgId, "GOOGLE_ADS", "INFO", "Iniciando sincronização (120 dias)...");

        // 1. Get Settings
        const settings = await biDb.query.adAccountSettings.findFirst({
            where: eq(adAccountSettings.organizationId, orgId),
        });

        if (!settings?.googleAdsCustomerId) {
            await logSystem(orgId, "GOOGLE_ADS", "WARN", "Customer ID não configurado");
            return { success: false, error: "ID do Google Ads não configurado" };
        }

        const customerId = settings.googleAdsCustomerId;

        // 2. Mock Access Token (We assume it exists in integrations table for now for 'google_ads')
        // In reality, we need to implement OAuth flow to get this token.
        // For this task, we will try to fetch it, but if it fails, we fall back to a mock data fetch 
        // OR return an error saying "Auth required".
        // BUT, since user asked to "TEST EVERYTHING", we will assume the TOKEN is there or we mock the DATA FETCH if no token.

        // Let's check for integration record
        const integration = await biDb.query.integrations.findFirst({
            where: and(
                eq(integrations.organizationId, orgId),
                eq(integrations.provider, "google_ads")
            )
        });

        if (!integration || !integration.accessToken) {
            await logSystem(orgId, "GOOGLE_ADS", "ERROR", "Token de acesso não encontrado. É necessário autenticar.");
            return { success: false, error: "Integração não autenticada. Faça logout e login novamente." };
        }

        // 3. Get valid access token (auto-refreshes if expired)
        let accessToken: string;
        try {
            accessToken = await getValidAccessToken(integration.id);
            await logSystem(orgId, "GOOGLE_ADS", "INFO", "Token de acesso obtido (refresh automático se necessário)");
        } catch (tokenError: any) {
            await logSystem(orgId, "GOOGLE_ADS", "ERROR", `Erro ao obter token: ${tokenError.message}`);
            return { success: false, error: `Token expirado: ${tokenError.message}` };
        }

        // 4. Fetch Data
        try {
            const daysToSync = 120;
            // Pass MCC ID as login_customer_id for agency accounts
            const mccId = process.env.GOOGLE_ADS_MCC_ID || undefined;
            const data = await getGoogleAdsData(accessToken, customerId, integration.refreshToken || "", daysToSync, mccId);

            if (!data.length) {
                await logSystem(orgId, "GOOGLE_ADS", "WARN", "API retornou 0 registros");
                return { success: true, count: 0, message: "Nenhum dado recente." };
            }

            // 4. Persistence (Similar to Meta)
            const startDate = subDays(new Date(), daysToSync);
            await biDb.transaction(async (tx) => {
                await tx.delete(campaignMetrics)
                    .where(and(
                        eq(campaignMetrics.integrationId, integration.id),
                        gte(campaignMetrics.date, startDate)
                    ));

                const values = data.map((item: any) => ({
                    integrationId: integration.id,
                    organizationId: orgId,
                    date: new Date(item.date),
                    campaignId: item.campaignId,
                    campaignName: item.campaignName,
                    impressions: item.impressions,
                    clicks: item.clicks,
                    spend: String(item.spend),
                    conversions: item.conversions,
                    conversionValue: String(item.conversionValue),
                    ctr: String(item.clicks / (item.impressions || 1)),
                    cpc: String(item.spend / (item.clicks || 1)),
                }));

                if (values.length) {
                    await tx.insert(campaignMetrics).values(values);
                }
            });

            await logSystem(orgId, "GOOGLE_ADS", "INFO", `Sincronizados ${data.length} registros`);
            return { success: true, count: data.length };

        } catch (apiError: any) {
            // Extract meaningful error message from Google Ads API error structure
            let errorMsg = "Erro desconhecido na API Google Ads";

            if (apiError?.errors && Array.isArray(apiError.errors) && apiError.errors.length > 0) {
                // Google Ads API error structure: { errors: [{ message: "...", error_code: {...} }] }
                errorMsg = apiError.errors.map((e: any) => e.message || JSON.stringify(e.error_code)).join("; ");
            } else if (apiError?.message) {
                errorMsg = apiError.message;
            } else if (typeof apiError === 'string') {
                errorMsg = apiError;
            } else {
                errorMsg = JSON.stringify(apiError);
            }

            await logSystem(orgId, "GOOGLE_ADS", "ERROR", errorMsg, apiError);
            return { success: false, error: errorMsg };
        }

    } catch (e: any) {
        await logSystem(session.user.id || null, "GOOGLE_ADS", "ERROR", "Erro interno no sync", e);
        return { success: false, error: e.message };
    }
}

export async function syncGA4() {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Não autenticado" };

    try {
        const user = await biDb.query.users.findFirst({ where: eq(users.email, session.user.email) });
        if (!user || !user.organizationId) return { success: false, error: "Usuário sem organização" };
        const orgId = user.organizationId;

        await logSystem(orgId, "GA4", "INFO", "Iniciando sincronização (120 dias)...");

        const settings = await biDb.query.adAccountSettings.findFirst({
            where: eq(adAccountSettings.organizationId, orgId),
        });

        if (!settings?.ga4PropertyId) {
            await logSystem(orgId, "GA4", "WARN", "Property ID não configurado");
            return { success: false, error: "ID do GA4 não configurado" };
        }

        const propertyId = settings.ga4PropertyId;

        const integration = await biDb.query.integrations.findFirst({
            where: and(
                eq(integrations.organizationId, orgId),
                eq(integrations.provider, "google_analytics")
            )
        });

        if (!integration || !integration.accessToken) {
            await logSystem(orgId, "GA4", "ERROR", "Token de acesso não encontrado.");
            return { success: false, error: "Integração não autenticada. Faça logout e login novamente." };
        }

        // Get valid access token (auto-refreshes if expired)
        let accessToken: string;
        try {
            accessToken = await getValidAccessToken(integration.id);
            await logSystem(orgId, "GA4", "INFO", "Token de acesso obtido (refresh automático se necessário)");
        } catch (tokenError: any) {
            await logSystem(orgId, "GA4", "ERROR", `Erro ao obter token: ${tokenError.message}`);
            return { success: false, error: `Token expirado: ${tokenError.message}` };
        }

        try {
            const data = await getGA4Data(accessToken, propertyId, 30);

            // 4. Persistence
            const startDate = subDays(new Date(), 30);

            await biDb.transaction(async (tx) => {
                // Delete old GA4 data for this integration/period to avoid duplicates
                await tx.delete(campaignMetrics)
                    .where(and(
                        eq(campaignMetrics.integrationId, integration.id),
                        gte(campaignMetrics.date, startDate)
                    ));

                const values = data.map((item: any) => ({
                    integrationId: integration.id,
                    organizationId: orgId,
                    date: new Date(item.date),
                    campaignName: item.campaign === '(not set)' ? 'Direto/Orgânico' : item.campaign,
                    // GA4 Metrics mapping
                    sessions: item.sessions,
                    activeUsers: item.users,
                    conversions: item.conversions,
                    // Store Source/Medium in flexible fields or if strictly needed, we might need schema update.
                    // For now, we rely on campaignName.
                    // We can use 'adSetId' or 'adId' to store source/medium temporarily if needed, 
                    // but cleaner to just stick to core metrics found in schema.
                }));

                if (values.length) {
                    await tx.insert(campaignMetrics).values(values);
                }
            });

            await logSystem(orgId, "GA4", "INFO", `Sincronizados ${data.length} registros no DB`);
            return { success: true, count: data.length, message: "Dados sincronizados com sucesso!" };

        } catch (apiError: any) {
            const errorMsg = apiError?.message || String(apiError) || "Erro desconhecido na API GA4";
            await logSystem(orgId, "GA4", "ERROR", errorMsg, apiError);
            return { success: false, error: errorMsg };
        }

    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
