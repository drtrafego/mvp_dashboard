
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../server/db/schema";
import { desc } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const sql = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
    console.log("Checking DB Connection...");
    try {
        const metrics = await db.query.campaignMetrics.findMany({
            orderBy: [desc(schema.campaignMetrics.date)],
            limit: 5
        });

        console.log(`Found ${metrics.length} metrics.`);
        if (metrics.length > 0) {
            console.log("Sample:", JSON.stringify(metrics[0], null, 2));
        } else {
            console.log("No metrics found.");
        }
    } catch (e) {
        console.error("Error:", e);
    }
}

main();
