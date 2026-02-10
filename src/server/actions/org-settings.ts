"use server";

import { biDb } from "@/server/db";
import { adAccountSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { isSuperAdmin } from "./super-admin";

export async function getOrgMetaDashboardType(orgId: string): Promise<string> {
    if (!(await isSuperAdmin())) throw new Error("Acesso negado");

    const settings = await biDb
        .select({ metaDashboardType: adAccountSettings.metaDashboardType })
        .from(adAccountSettings)
        .where(eq(adAccountSettings.organizationId, orgId))
        .limit(1);

    return settings[0]?.metaDashboardType || "ecommerce";
}

export async function updateOrgMetaDashboardType(orgId: string, type: string) {
    if (!(await isSuperAdmin())) throw new Error("Acesso negado");

    const validTypes = ["ecommerce", "captacao", "lancamento"];
    if (!validTypes.includes(type)) throw new Error("Tipo inválido");

    const existing = await biDb
        .select()
        .from(adAccountSettings)
        .where(eq(adAccountSettings.organizationId, orgId))
        .limit(1);

    if (existing.length) {
        await biDb
            .update(adAccountSettings)
            .set({ metaDashboardType: type, updatedAt: new Date() })
            .where(eq(adAccountSettings.organizationId, orgId));
    } else {
        await biDb.insert(adAccountSettings).values({
            organizationId: orgId,
            metaDashboardType: type,
        });
    }

    revalidatePath("/admin");
    revalidatePath("/meta-ads");
    return { success: true };
}
