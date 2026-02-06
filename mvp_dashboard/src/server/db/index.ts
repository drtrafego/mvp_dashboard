// Database connection
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// BI Database Connection (Analytics - Campaigns, Metrics, AI Insights)
import * as schema from "./schema";

const biSql = neon(process.env.BI_DATABASE_URL!);
export const biDb = drizzle(biSql, { schema });

// For backward compatibility, export as 'db' (default)
export const db = biDb;
