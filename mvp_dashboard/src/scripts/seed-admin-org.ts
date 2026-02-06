import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

// Define schema validation
const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
});

const users = pgTable("users", {
    id: text("id").primaryKey(), // NextAuth ID
    email: text("email").notNull().unique(),
    organizationId: uuid("organization_id"),
    role: text("role"),
});

// Direct connection string (BI Database)
const connectionString = "postgresql://neondb_owner:npg_0TzSY8rdaGtl@ep-small-credit-ahqbdrlt-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(connectionString);
const db = drizzle(sql);

const ADMIN_EMAILS = ["dr.trafego@gmail.com", "amandafelixgolden@gmail.com"];

async function main() {
    console.log("🌱 STARTING SEED: Admin Organization & Users");

    try {
        // 1. Create Default Org
        console.log("Checking Organization...");
        let orgId = "";
        const existingOrg = await db.select().from(organizations).where(eq(organizations.slug, "hyperdash-hq")).limit(1);

        if (existingOrg.length > 0) {
            console.log("✅ Organization 'HyperDash HQ' exists.");
            orgId = existingOrg[0].id;
        } else {
            console.log("⚡ Creating Organization 'HyperDash HQ'...");
            const newOrg = await db.insert(organizations).values({
                name: "HyperDash HQ",
                slug: "hyperdash-hq",
            }).returning();
            orgId = newOrg[0].id;
            console.log("✅ Created Org ID:", orgId);
        }

        // 2. Update Users
        for (const email of ADMIN_EMAILS) {
            console.log(`\nChecking user: ${email}`);
            const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

            if (user.length === 0) {
                console.log(`❌ User ${email} NOT FOUND. They must sign in first!`);
            } else {
                console.log(`Found user ${user[0].id}. Updating...`);
                await db.update(users)
                    .set({
                        organizationId: orgId,
                        role: "owner"
                    })
                    .where(eq(users.email, email));
                console.log(`✅ User ${email} updated: Org Linked + Owner Role`);
            }
        }

    } catch (e) {
        console.error("❌ CRITICAL ERROR:", e);
    }

    console.log("\n🏁 SEED COMPLETE.");
}

main();
