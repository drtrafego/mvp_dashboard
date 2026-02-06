import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/server/db/schema.ts",
    out: "./drizzle",
    dialect: "postgresql",
    dbCredentials: {
        // Use BI_DATABASE_URL for analytics schema
        url: process.env.BI_DATABASE_URL!,
    },
});
