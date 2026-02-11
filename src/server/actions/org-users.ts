"use server";

import { biDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";

// Admin check
async function ensureSuperAdmin() {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Não autenticado");

    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(session.user.email)) {
        throw new Error("Acesso negado: Apenas Super Admins podem realizar esta ação.");
    }
    return session;
}

// List users for a specific organization
export async function getOrgUsers(orgId: string) {
    await ensureSuperAdmin();

    const orgUsers = await biDb.select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
    })
        .from(users)
        .where(eq(users.organizationId, orgId));

    return orgUsers;
}

// Add a new user to an organization
export async function addOrgUser(orgId: string, email: string, name?: string) {
    await ensureSuperAdmin();

    if (!email || !email.includes("@")) {
        throw new Error("Email inválido");
    }

    // Check if email already exists
    const existing = await biDb.select().from(users).where(eq(users.email, email));

    if (existing.length > 0) {
        const existingUser = existing[0];
        if (existingUser.organizationId === orgId) {
            throw new Error("Este email já está vinculado a esta organização.");
        }
        // Update existing user to this org
        await biDb.update(users)
            .set({ organizationId: orgId })
            .where(eq(users.id, existingUser.id));

        revalidatePath("/admin");
        return { success: true, action: "moved", userId: existingUser.id };
    }

    // Create new user entry (will be linked to a real NextAuth user on first login)
    const userId = `manual_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    await biDb.insert(users).values({
        id: userId,
        email: email.toLowerCase().trim(),
        name: name || email.split("@")[0],
        organizationId: orgId,
        role: "member",
    });

    revalidatePath("/admin");
    return { success: true, action: "created", userId };
}

// Update a user's email
export async function updateOrgUser(userId: string, data: { email?: string; name?: string }) {
    await ensureSuperAdmin();

    if (data.email && !data.email.includes("@")) {
        throw new Error("Email inválido");
    }

    // Check if new email conflicts
    if (data.email) {
        const existing = await biDb.select().from(users).where(eq(users.email, data.email));
        if (existing.length > 0 && existing[0].id !== userId) {
            throw new Error("Este email já está em uso por outro usuário.");
        }
    }

    const updateData: any = {};
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.name) updateData.name = data.name;

    await biDb.update(users)
        .set(updateData)
        .where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
}

// Delete a user from an organization
export async function deleteOrgUser(userId: string) {
    await ensureSuperAdmin();

    // Don't allow deleting super admins
    const user = await biDb.select().from(users).where(eq(users.id, userId));
    if (user.length > 0) {
        const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
        if (adminEmails.includes(user[0].email)) {
            throw new Error("Não é possível excluir um Super Admin.");
        }
    }

    await biDb.delete(users).where(eq(users.id, userId));

    revalidatePath("/admin");
    return { success: true };
}
