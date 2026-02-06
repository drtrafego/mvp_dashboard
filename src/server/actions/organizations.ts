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

export async function updateOrganization(id: string, data: Partial<CreateOrgData>) {
    await ensureSuperAdmin();

    if (data.slug) {
        const existing = await biDb.select().from(organizations).where(eq(organizations.slug, data.slug));
        if (existing.length && existing[0].id !== id) {
            throw new Error("Slug já existe na outra empresa.");
        }
    }

    await biDb.update(organizations)
        .set({
            ...data,
            updatedAt: new Date(),
        })
        .where(eq(organizations.id, id));

    revalidatePath("/admin");
    return { success: true };
}

export async function deleteOrganization(id: string) {
    await ensureSuperAdmin();

    // Cascading delete is handled by database constraints usually, but let's be explicit if needed
    // For now, simple delete. Drizzle/Postgres should handle cascade if configured, otherwise might error if FKs exist.
    // Given the simple schema, we'll try direct delete. If it fails due to foreign keys, the UI handles the error.

    await biDb.delete(organizations).where(eq(organizations.id, id));

    revalidatePath("/admin");
    return { success: true };
}
