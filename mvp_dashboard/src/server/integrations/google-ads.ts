import { GoogleAdsApi } from "google-ads-api";

export async function getGoogleAdsData(
    accessToken: string,
    customerId: string,
    refreshToken: string,
    days = 30,
    loginCustomerId?: string // MCC ID for agency accounts
) {
    // Validate inputs
    if (!process.env.GOOGLE_ADS_DEVELOPER_TOKEN) {
        throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN não configurado no .env");
    }

    if (!customerId) {
        throw new Error("Customer ID não fornecido");
    }

    // Remove dashes and dots from customer IDs
    const cleanCustomerId = customerId.replace(/[-\.]/g, "");
    const cleanLoginCustomerId = loginCustomerId?.replace(/[-\.]/g, "");

    try {
        const client = new GoogleAdsApi({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        });

        // Customer config - includes login_customer_id for MCC access
        const customerConfig: any = {
            customer_id: cleanCustomerId,
            refresh_token: refreshToken,
        };

        // If accessing via MCC (agency account), add login_customer_id
        if (cleanLoginCustomerId) {
            customerConfig.login_customer_id = cleanLoginCustomerId;
        }

        const customer = client.Customer(customerConfig);

        const report = await customer.report({
            entity: "campaign",
            attributes: [
                "campaign.id",
                "campaign.name",
                "segments.date"
            ],
            metrics: [
                "metrics.cost_micros",
                "metrics.impressions",
                "metrics.clicks",
                "metrics.conversions",
                "metrics.all_conversions_value",
            ],
            constraints: {
                "segments.date": "DURING_LAST_30_DAYS",
            },
            limit: 1000,
        });

        const rows = [];
        // @ts-ignore
        for (const row of report) {
            rows.push({
                date: row.segments?.date,
                campaignId: row.campaign?.id,
                campaignName: row.campaign?.name,
                spend: (row.metrics?.cost_micros || 0) / 1000000,
                impressions: row.metrics?.impressions || 0,
                clicks: row.metrics?.clicks || 0,
                conversions: row.metrics?.conversions || 0,
                conversionValue: row.metrics?.all_conversions_value || 0,
            });
        }

        return rows;
    } catch (error: any) {
        // Extract meaningful error message
        let errorMessage = "Erro desconhecido na API Google Ads";

        if (error?.errors && Array.isArray(error.errors)) {
            errorMessage = error.errors.map((e: any) => e.message || JSON.stringify(e.error_code)).join("; ");
        } else if (error?.message) {
            errorMessage = error.message;
        } else if (typeof error === 'object') {
            errorMessage = JSON.stringify(error);
        } else {
            errorMessage = String(error);
        }

        throw new Error(errorMessage);
    }
}
