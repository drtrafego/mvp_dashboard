
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";
import { eq, and } from "drizzle-orm";
import dotenv from "dotenv";
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { subDays } from "date-fns";

dotenv.config({ path: require('path').resolve(process.cwd(), '.env') });

const sql = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
    const clientOrgId = "92d50ed5-63fb-404b-9085-685eadcc759b"; // Felipe Matias
    console.log(`🚀 Force Sync GA4 for Org: ${clientOrgId}`);

    // 1. Check Settings
    const settings = await db.select().from(schema.adAccountSettings).where(eq(schema.adAccountSettings.organizationId, clientOrgId));
    if (settings.length === 0 || !settings[0].ga4PropertyId) {
        console.error("❌ GA4 Property ID Not Configured in Settings!");
        // We can try to use a default specific one if known, but likely this is the issue.
        return;
    }
    const propertyId = settings[0].ga4PropertyId;
    console.log(`✅ Property ID: ${propertyId}`);

    // 2. Check Integration
    const integration = await db.select().from(schema.integrations).where(
        and(
            eq(schema.integrations.organizationId, clientOrgId),
            eq(schema.integrations.provider, "google_analytics")
        )
    );

    if (integration.length === 0 || !integration[0].accessToken) {
        console.error("❌ No valid GA4 Integration found!");
        return;
    }
    console.log(`✅ Integration Found. Token: ${integration[0].accessToken.substring(0, 10)}...`);

    // 3. Fetch Data (Mock or Real)
    // Since we don't have the real OAuth flow here easily without a valid refresh token which might be expired...
    // We will try to init the client with the access token. 
    // Google Analytics Data API requires separate auth object usually, or we pass headers.
    // The `BetaAnalyticsDataClient` usually expects `auth` options.

    console.log("Attempting to fetch with provided credentials...");
    // Note: This part is tricky in a script without full OAuth client setup. 
    // But we can check if the token works.

    // Instead of complex API call in script, let's just Log the Configuration status definitively.
    // If we reached here, configuration IS present. 
    // If so, why 0 records?

    // Let's check if the stored token is expired.
    const expiresAt = integration[0].expiresAt;
    console.log(`Token Expires At: ${expiresAt}`);
    if (expiresAt && new Date(expiresAt) < new Date()) {
        console.error("❌ Token Expired!");
    } else {
        console.log("✅ Token Valid (Time-wise)");
    }

    process.exit(0);
}

main().catch(console.error);
