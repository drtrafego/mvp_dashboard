"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { users, organizations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const SUPER_ADMIN_EMAILS = (process.env.SUPERADMIN_EMAILS || "").split(",");

export async function isSuperAdmin() {
    const session = await auth();
    if (!session?.user?.email) return false;
    return SUPER_ADMIN_EMAILS.includes(session.user.email);
}

export async function getAllOrganizations() {
    if (!(await isSuperAdmin())) {
        throw new Error("Acesso negado");
    }
    return await biDb.select().from(organizations);
}

export async function switchOrganization(orgId: string) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    if (!(await isSuperAdmin())) {
        // Also allow if user belongs to that org (handled by normal login, but switch implies admin privilege usually)
        // For MVP, strict Super Admin for switching freely.
        throw new Error("Apenas Super Admins podem trocar de organização livremente");
    }

    // Update user's organizationId
    if (!session.user.id) throw new Error("ID de usuário inválido");

    await biDb.update(users)
        .set({ organizationId: orgId })
        .where(eq(users.id, session.user.id));

    revalidatePath("/");
    return { success: true };
}
