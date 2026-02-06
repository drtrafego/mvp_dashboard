import "server-only";
import { decrypt } from "@/lib/encryption";

interface MetaInsightsResponse {
    data: Array<{
        campaign_id: string;
        campaign_name: string;
        spend: string;
        impressions: string;
        clicks: string;
        actions?: Array<{ action_type: string; value: string }>;
    }>;
    paging?: {
        cursors: { after: string };
    };
}

export class MetaAdsService {
    private baseUrl = "https://graph.facebook.com/v19.0";

    async fetchCampaignInsights(
        accessToken: string,
        accountId: string,
        datePreset: string = "last_7d"
    ): Promise<MetaInsightsResponse> {
        const decryptedToken = decrypt(accessToken);

        const url = `${this.baseUrl}/act_${accountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,actions&date_preset=${datePreset}&level=campaign`;

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${decryptedToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Meta API Error: ${response.statusText}`);
        }

        return response.json();
    }

    async refreshAccessToken(refreshToken: string): Promise<{
        access_token: string;
        expires_in: number;
    }> {
        // Meta doesn't use refresh tokens the same way as Google
        // This is a placeholder for implementing long-lived token exchange
        throw new Error("Meta token refresh not yet implemented");
    }
}

export const metaAdsService = new MetaAdsService();
