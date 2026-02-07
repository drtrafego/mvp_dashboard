
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";
import { eq } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: require('path').resolve(process.cwd(), '.env') });

const sql = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
    const clientOrgId = "92d50ed5-63fb-404b-9085-685eadcc759b"; // Felipe Matias
    console.log(`Checking Settings for Org: ${clientOrgId}`);

    const settings = await db.select().from(schema.adAccountSettings).where(eq(schema.adAccountSettings.organizationId, clientOrgId));

    if (settings.length === 0) {
        console.log("❌ No Settings found for this Org.");
    } else {
        console.log("✅ Settings Found:", settings[0]);
        console.log("   - GA4 Property ID:", settings[0].ga4PropertyId || "❌ MISSING");
        console.log("   - Google Ads Customer ID:", settings[0].googleAdsCustomerId || "❌ MISSING");
        console.log("   - Meta Ad Account ID:", settings[0].facebookAdAccountId || "❌ MISSING");
    }

    process.exit(0);
}

main().catch(console.error);
