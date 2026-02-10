"use server";

import { auth } from "@/server/auth";
import { logSystem } from "@/server/logger";
import { biDb } from "@/server/db";
import { users, adAccountSettings, integrations, campaignMetrics, analyticsDimensions } from "@/server/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { subDays } from "date-fns";
import { getGoogleAdsData } from "@/server/integrations/google-ads";
import { getGA4Data, getGA4Dimensions } from "@/server/integrations/ga4";
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
            // 4. Persistence (Similar to Meta)

            await biDb.delete(campaignMetrics)
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
                await biDb.insert(campaignMetrics).values(values);
            }

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

        await logSystem(orgId, "GA4", "INFO", "Iniciando sincronização (90 dias)...");

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
            // 1. Fetch Standard Campaign Data (Existing Logic)
            const data = await getGA4Data(accessToken, propertyId, 90);

            // 4. Persistence for Standard Data
            const startDate = subDays(new Date(), 90);

            // Delete old GA4 data for this integration/period to avoid duplicates
            await biDb.delete(campaignMetrics)
                .where(and(
                    eq(campaignMetrics.integrationId, integration.id),
                    gte(campaignMetrics.date, startDate)
                ));

            const values = data.map((item: any) => {
                const parsedDate = parseGA4Date(item.date);
                return {
                    integrationId: integration.id,
                    organizationId: orgId,
                    date: parsedDate,
                    campaignName: item.campaign === '(not set)' ? 'Direto/Orgânico' : item.campaign,
                    sessions: Math.round(Number(item.sessions || 0)),
                    activeUsers: Math.round(Number(item.users || 0)),
                    conversions: Math.round(Number(item.conversions || 0)),
                };
            });

            if (values.length) {
                await biDb.insert(campaignMetrics).values(values);
            }

            // 2. Fetch Dimensions Data (New Logic)
            await logSystem(orgId, "GA4", "INFO", "Sincronizando dimensões (Cidade, OS, Device)...");

            // Delete old dimensions data
            await biDb.delete(analyticsDimensions)
                .where(and(
                    eq(analyticsDimensions.integrationId, integration.id),
                    gte(analyticsDimensions.date, startDate)
                ));

            const dimensionsToSync = [
                { type: 'CITY', apiDim: 'city' },
                { type: 'REGION', apiDim: 'region' },
                { type: 'DEVICE', apiDim: 'deviceCategory' },
                { type: 'OS', apiDim: 'operatingSystem' },
                { type: 'BROWSER', apiDim: 'browser' },
                { type: 'PAGE_PATH', apiDim: 'pagePath' },
                { type: 'SOURCE', apiDim: 'sessionSource' }
            ];

            let totalDimRows = 0;

            for (const dim of dimensionsToSync) {
                const dimData = await getGA4Dimensions(accessToken, propertyId, 90, dim.apiDim);

                if (dimData && dimData.length > 0) {
                    const dimValues = dimData.map((item: any) => ({
                        integrationId: integration.id,
                        organizationId: orgId,
                        date: parseGA4Date(item.date),
                        dimensionType: dim.type,
                        dimensionValue: item[dim.apiDim] || '(not set)',
                        sessions: Math.round(Number(item.sessions || 0)),
                        users: Math.round(Number(item.totalUsers || 0)),
                        conversions: Math.round(Number(item.conversions || 0)),
                    }));

                    // Insert in batches if needed, but for now direct insert
                    await biDb.insert(analyticsDimensions).values(dimValues);
                    totalDimRows += dimValues.length;
                }
            }

            await logSystem(orgId, "GA4", "INFO", `Sync concluído: ${data.length} campanhas, ${totalDimRows} linhas de dimensões.`);
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

function parseGA4Date(dateStr: string | number): Date {
    const dStr = String(dateStr);
    const year = dStr.substring(0, 4);
    const month = dStr.substring(4, 6);
    const day = dStr.substring(6, 8);
    return new Date(`${year}-${month}-${day}`);
}
