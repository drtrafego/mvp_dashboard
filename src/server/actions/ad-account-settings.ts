"use server";

import { biDb } from "@/server/db";
import { adAccountSettings, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";

export type AdAccountSettingsData = {
    googleAdsCustomerId: string | null;
    facebookAdAccountId: string | null;
    ga4PropertyId: string | null;
};

// Get current user's organization ID and check admin permission
async function getAuthorizedOrganization() {
    const session = await auth();
    if (!session?.user?.email) {
        throw new Error("Não autenticado");
    }

    const user = await biDb
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

    if (!user.length || !user[0].organizationId) {
        throw new Error("Usuário não encontrado ou sem organização");
    }

    // Check admin permission (DB role OR .env list)
    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = session.user.email && adminEmails.includes(session.user.email);

    if (!isSuperAdmin && user[0].role !== "admin" && user[0].role !== "owner") {
        throw new Error("Apenas administradores podem gerenciar configurações de contas");
    }

    return {
        organizationId: user[0].organizationId,
        userId: user[0].id,
        role: user[0].role,
    };
}

// Get ad account settings for current organization
export async function getAdAccountSettings(): Promise<AdAccountSettingsData | null> {
    const session = await auth();
    if (!session?.user?.email) {
        return null;
    }

    const user = await biDb
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

    if (!user.length || !user[0].organizationId) {
        return null;
    }

    const settings = await biDb
        .select()
        .from(adAccountSettings)
        .where(eq(adAccountSettings.organizationId, user[0].organizationId))
        .limit(1);

    if (!settings.length) {
        return {
            googleAdsCustomerId: null,
            facebookAdAccountId: null,
            ga4PropertyId: null,
        };
    }

    return {
        googleAdsCustomerId: settings[0].googleAdsCustomerId,
        facebookAdAccountId: settings[0].facebookAdAccountId,
        ga4PropertyId: settings[0].ga4PropertyId,
    };
}

// Update ad account settings (admin only)
export async function updateAdAccountSettings(data: AdAccountSettingsData) {
    const { organizationId } = await getAuthorizedOrganization();

    // Check if settings exist
    const existing = await biDb
        .select()
        .from(adAccountSettings)
        .where(eq(adAccountSettings.organizationId, organizationId))
        .limit(1);

    if (existing.length) {
        // Update existing
        await biDb
            .update(adAccountSettings)
            .set({
                googleAdsCustomerId: data.googleAdsCustomerId,
                facebookAdAccountId: data.facebookAdAccountId,
                ga4PropertyId: data.ga4PropertyId,
                updatedAt: new Date(),
            })
            .where(eq(adAccountSettings.organizationId, organizationId));
    } else {
        // Create new
        await biDb.insert(adAccountSettings).values({
            organizationId,
            googleAdsCustomerId: data.googleAdsCustomerId,
            facebookAdAccountId: data.facebookAdAccountId,
            ga4PropertyId: data.ga4PropertyId,
        });
    }

    revalidatePath("/dashboard");
    revalidatePath("/settings");

    return { success: true };
}

// Check if user is admin
export async function checkIsAdmin(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.email) {
        return false;
    }

    const user = await biDb
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

    if (!user.length) {
        return false;
    }

    // Check admin permission (DB role OR .env list)
    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    const isSuperAdmin = session.user.email && adminEmails.includes(session.user.email);

    return isSuperAdmin || user[0].role === "admin" || user[0].role === "owner";
}
