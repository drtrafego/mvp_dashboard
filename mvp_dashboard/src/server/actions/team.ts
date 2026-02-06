"use server";

import { auth } from "@/server/auth";
import { biDb } from "@/server/db";
import { invitations, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function inviteUser(email: string, role: "admin" | "member" = "member") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado" };

    // Get current user's org
    const currentUser = await biDb.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!currentUser?.organizationId) {
        return { success: false, error: "Você não pertence a uma organização" };
    }

    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
        // Check if super admin
        const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
        if (!adminEmails.includes(currentUser.email)) {
            return { success: false, error: "Permissão insuficiente" };
        }
    }

    // Check if pending invitation exists
    const existingInvite = await biDb.query.invitations.findFirst({
        where: and(
            eq(invitations.email, email),
            eq(invitations.organizationId, currentUser.organizationId),
            eq(invitations.status, "pending")
        )
    });

    if (existingInvite) {
        return { success: false, error: "Já existe um convite pendente para este e-mail" };
    }

    // Check if user is already a member
    const existingMember = await biDb.query.users.findFirst({
        where: and(
            eq(users.email, email),
            eq(users.organizationId, currentUser.organizationId)
        )
    });

    if (existingMember) {
        return { success: false, error: "Este usuário já é membro da organização" };
    }

    // Create invitation
    await biDb.insert(invitations).values({
        email,
        organizationId: currentUser.organizationId,
        role,
        status: "pending",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    revalidatePath("/settings/team");
    return { success: true };
}

export async function getMembers() {
    const session = await auth();
    if (!session?.user?.id) return { members: [], pendingInvites: [] };

    const currentUser = await biDb.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!currentUser?.organizationId) return { members: [], pendingInvites: [] };

    // Get members
    const members = await biDb.query.users.findMany({
        where: eq(users.organizationId, currentUser.organizationId),
        orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    // Get pending invitations
    const pendingInvites = await biDb.query.invitations.findMany({
        where: and(
            eq(invitations.organizationId, currentUser.organizationId),
            eq(invitations.status, "pending")
        ),
    });

    return { members, pendingInvites, currentUserRole: currentUser.role };
}

export async function removeMember(userId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado" };

    const currentUser = await biDb.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!currentUser?.organizationId) return { success: false, error: "Sem organização" };

    // Permission check
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
        const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
        if (!adminEmails.includes(currentUser.email)) {
            return { success: false, error: "Permissão insuficiente" };
        }
    }

    // Prevent removing yourself
    if (userId === session.user.id) {
        return { success: false, error: "Você não pode remover a si mesmo" };
    }

    await biDb.update(users)
        .set({ organizationId: null, role: "member" })
        .where(eq(users.id, userId));

    revalidatePath("/settings/team");
    return { success: true };
}

export async function revokeInvitation(inviteId: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado" };

    const currentUser = await biDb.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!currentUser?.organizationId) return { success: false, error: "Sem organização" };

    // Permission check
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
        const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
        if (!adminEmails.includes(currentUser.email)) {
            return { success: false, error: "Permissão insuficiente" };
        }
    }

    await biDb.delete(invitations).where(eq(invitations.id, inviteId));

    revalidatePath("/settings");
    revalidatePath("/settings/team"); // Keep for safety until full migration
    return { success: true };
}

export async function updateMemberRole(userId: string, newRole: "admin" | "member") {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Não autenticado" };

    const currentUser = await biDb.query.users.findFirst({
        where: eq(users.id, session.user.id),
    });

    if (!currentUser?.organizationId) return { success: false, error: "Sem organização" };

    // Permission check
    if (currentUser.role !== "admin" && currentUser.role !== "owner") {
        const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
        if (!adminEmails.includes(currentUser.email)) {
            return { success: false, error: "Permissão insuficiente" };
        }
    }

    // Prevent demoting yourself if you are the only owner (simplified logic for now)
    if (userId === session.user.id && newRole !== "admin" && currentUser.role === "owner") {
        return { success: false, error: "O dono não pode alterar seu próprio cargo para membro." };
    }

    await biDb.update(users)
        .set({ role: newRole })
        .where(eq(users.id, userId));

    revalidatePath("/settings");
    revalidatePath("/settings/team");
    return { success: true };
}
