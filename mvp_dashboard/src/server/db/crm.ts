import "server-only";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

// CRM Database Connection (Transactional - Leads, Contacts, Deals)
const crmSql = neon(process.env.CRM_DATABASE_URL!);
export const crmDb = drizzle(crmSql);
