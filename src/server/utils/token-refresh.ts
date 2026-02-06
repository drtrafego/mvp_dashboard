"use server";

import { biDb } from "@/server/db";
import { integrations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

interface TokenRefreshResult {
    accessToken: string;
    expiresAt: Date;
}

/**
 * Refreshes an expired Google OAuth token using the refresh token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<TokenRefreshResult> {
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = await response.json();

    return {
        accessToken: data.access_token,
        expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
}

/**
 * Gets a valid access token for the given integration.
 * If the token is expired, it will be refreshed automatically.
 */
export async function getValidAccessToken(integrationId: string): Promise<string> {
    const integration = await biDb.query.integrations.findFirst({
        where: eq(integrations.id, integrationId),
    });

    if (!integration) {
        throw new Error("Integration not found");
    }

    if (!integration.accessToken) {
        throw new Error("No access token stored for this integration");
    }

    // Check if token is expired (with 5 minute buffer)
    const now = new Date();
    const expiryBuffer = 5 * 60 * 1000; // 5 minutes
    const isExpired = integration.expiresAt &&
        new Date(integration.expiresAt).getTime() - now.getTime() < expiryBuffer;

    if (!isExpired) {
        return integration.accessToken;
    }

    // Token is expired, refresh it
    if (!integration.refreshToken) {
        throw new Error("Token expired and no refresh token available. Please re-authenticate.");
    }

    console.log(`[TOKEN] Refreshing expired token for ${integration.provider}...`);

    try {
        const refreshed = await refreshGoogleToken(integration.refreshToken);

        // Update the token in the database
        await biDb.update(integrations)
            .set({
                accessToken: refreshed.accessToken,
                expiresAt: refreshed.expiresAt,
                updatedAt: new Date(),
            })
            .where(eq(integrations.id, integrationId));

        console.log(`[TOKEN] Token refreshed successfully. New expiry: ${refreshed.expiresAt}`);

        return refreshed.accessToken;
    } catch (error: any) {
        console.error(`[TOKEN] Failed to refresh token:`, error);
        throw new Error(`Token refresh failed: ${error.message}. Please re-authenticate.`);
    }
}
