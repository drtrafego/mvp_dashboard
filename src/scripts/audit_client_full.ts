
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";
import { eq, desc, and } from "drizzle-orm";
import dotenv from "dotenv";
import * as fs from 'fs';

dotenv.config({ path: require('path').resolve(process.cwd(), '.env') });

const sql = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
    const clientOrgId = "92d50ed5-63fb-404b-9085-685eadcc759b"; // Felipe Matias
    console.log(`🔍 FULL AUDIT For Client: Felipe Matias (${clientOrgId})`);

    let output = `AUDIT REPORT - ${new Date().toISOString()}\n`;
    output += `Client Org ID: ${clientOrgId}\n\n`;

    // 1. Check Integrations
    const integrs = await db.select().from(schema.integrations).where(eq(schema.integrations.organizationId, clientOrgId));
    output += `1. INTEGRATIONS Found: ${integrs.length}\n`;
    integrs.forEach(i => {
        output += ` - Provider: ${i.provider} | ID: ${i.id} | Account: ${i.providerAccountId}\n`;
    });
    output += "\n";

    // 2. Check Metrics by Provider
    const providers = ['meta', 'google_ads', 'google_analytics'];

    for (const provider of providers) {
        output += `2. CHECKING METRICS FOR: ${provider.toUpperCase()}\n`;

        // Find integration for this provider
        const integration = integrs.find(i => i.provider === provider);

        if (!integration) {
            output += `   ❌ No Integration found for ${provider}.\n\n`;
            continue;
        }

        const metrics = await db.select({
            date: schema.campaignMetrics.date,
            campaign: schema.campaignMetrics.campaignName,
            impressions: schema.campaignMetrics.impressions,
            sessions: schema.campaignMetrics.sessions
        })
            .from(schema.campaignMetrics)
            .where(eq(schema.campaignMetrics.integrationId, integration.id))
            .orderBy(desc(schema.campaignMetrics.date));

        output += `   Found ${metrics.length} records.\n`;

        if (metrics.length > 0) {
            const newest = metrics[0];
            const oldest = metrics[metrics.length - 1];
            output += `   📅 Date Range: ${new Date(oldest.date).toISOString().split('T')[0]} <--> ${new Date(newest.date).toISOString().split('T')[0]}\n`;
            output += "   Sample Records:\n";
            metrics.slice(0, 5).forEach(m => {
                const val = m.impressions ? `Impr: ${m.impressions}` : `Sessions: ${m.sessions}`;
                output += `    - ${new Date(m.date).toISOString().split('T')[0]} | ${m.campaign || 'N/A'} | ${val}\n`;
            });
        }
        output += "\n";
    }

    fs.writeFileSync('client_full_audit.txt', output);
    console.log("Written to client_full_audit.txt");

    process.exit(0);
}

main().catch(console.error);
