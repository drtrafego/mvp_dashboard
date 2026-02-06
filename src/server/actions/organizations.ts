"use server";

import { biDb } from "@/server/db";
import { organizations, users } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";

// Reusing admin check logic
async function ensureSuperAdmin() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = adminEmails.includes(session.user.email);

    if (!isSuperAdmin) {
        throw new Error("Acesso negado: Apenas Super Admins podem realizar esta ação.");
    }
    return session;
}

export async function listOrganizations() {
    await ensureSuperAdmin();

    // Fetch orgs with member count (simplified for now, just fetch orgs)
    const orgs = await biDb.select().from(organizations).orderBy(desc(organizations.createdAt));
    return orgs;
}

export type CreateOrgData = {
    name: string;
    slug: string;
};

export async function createOrganization(data: CreateOrgData) {
    await ensureSuperAdmin();

    // Check slug uniqueness
    const existing = await biDb.select().from(organizations).where(eq(organizations.slug, data.slug));
    if (existing.length) {
        throw new Error("Slug já existe. Escolha outro.");
    }

    const [newOrg] = await biDb.insert(organizations).values({
        name: data.name,
        slug: data.slug,
    }).returning();

    revalidatePath("/admin");
    return newOrg;
}

export async function getOrganization(id: string) {
    await ensureSuperAdmin();
    const [org] = await biDb.select().from(organizations).where(eq(organizations.id, id));
    return org;
}
