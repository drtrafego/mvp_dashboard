import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

const users = pgTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    organizationId: uuid("organization_id"),
    role: text("role"),
});

const connectionString = "postgresql://neondb_owner:npg_0TzSY8rdaGtl@ep-small-credit-ahqbdrlt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = neon(connectionString);
const db = drizzle(sql);

async function check() {
    console.log("Checking dr.trafego@gmail.com...");
    const user = await db.select().from(users).where(eq(users.email, "dr.trafego@gmail.com"));
    console.log(JSON.stringify(user, null, 2));
}

check();
