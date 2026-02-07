
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "@/server/db/schema";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

dotenv.config({ path: require('path').resolve(process.cwd(), '.env') });

const sqlConn = neon(process.env.BI_DATABASE_URL!);
const db = drizzle(sqlConn, { schema });

async function main() {
    console.log("🕒 TIMEZONE CHECK");
    console.log("------------------");
    console.log(`Server Date (new Date()): ${new Date().toString()}`);
    console.log(`Server ISO: ${new Date().toISOString()}`);

    // Check DB Time
    const dbTime = await db.execute(sql`SELECT NOW() as db_time, current_setting('TIMEZONE') as db_tz`);
    console.log("DB Result:", dbTime.rows[0]);

    // Check Campaign Metrics sample to see how dates are stored
    const sample = await db.select({ date: schema.campaignMetrics.date }).from(schema.campaignMetrics).limit(1);
    if (sample.length > 0) {
        console.log(`Sample Metric Date (Raw): ${sample[0].date}`);
        console.log(`Sample Metric ISO: ${new Date(sample[0].date).toISOString()}`);
    }

    process.exit(0);
}

main().catch(console.error);
