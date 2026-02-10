"use server";

import { biDb } from "@/server/db";
import { adAccountSettings, users, accounts, integrations } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/server/auth";
import { revalidatePath } from "next/cache";

export type AdAccountSettingsData = {
    googleAdsCustomerId: string | null;
    facebookAdAccountId: string | null;
    ga4PropertyId: string | null;
    metaDashboardType: string | null;
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
            metaDashboardType: "ecommerce",
        };
    }

    return {
        googleAdsCustomerId: settings[0].googleAdsCustomerId,
        facebookAdAccountId: settings[0].facebookAdAccountId,
        ga4PropertyId: settings[0].ga4PropertyId,
        metaDashboardType: settings[0].metaDashboardType || "ecommerce",
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
                metaDashboardType: data.metaDashboardType,
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
            metaDashboardType: data.metaDashboardType,
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

// Manually link current user's Google Account to current Organization
export async function connectUserGoogleAccount() {
    const session = await auth();
    if (!session?.user?.email) {
        return { success: false, error: "Não autenticado" };
    }

    const user = await biDb.query.users.findFirst({
        where: eq(users.email, session.user.email)
    });

    if (!user || !user.organizationId) {
        return { success: false, error: "Usuário sem organização" };
    }

    const orgId = user.organizationId;

    // Find Google Account for this user
    // We look for provider = 'google' in accounts table
    const googleAccount = await biDb.query.accounts.findFirst({
        where: and(
            eq(accounts.userId, user.id),
            eq(accounts.provider, "google")
        )
    });

    if (!googleAccount || !googleAccount.access_token) {
        return { success: false, error: "Nenhuma conta Google conectada ao seu login. Tente sair e entrar novamente." };
    }

    const expiresAt = googleAccount.expires_at
        ? new Date(googleAccount.expires_at * 1000)
        : new Date(Date.now() + 3600 * 1000);

    // Upsert tokens into integrations table
    // 1. Google Ads
    const existingAds = await biDb.query.integrations.findFirst({
        where: and(
            eq(integrations.organizationId, orgId),
            eq(integrations.provider, "google_ads")
        )
    });

    if (existingAds) {
        await biDb.update(integrations).set({
            accessToken: googleAccount.access_token,
            refreshToken: googleAccount.refresh_token || existingAds.refreshToken,
            expiresAt: expiresAt,
            updatedAt: new Date(),
        }).where(eq(integrations.id, existingAds.id));
    } else {
        await biDb.insert(integrations).values({
            organizationId: orgId,
            provider: "google_ads",
            providerAccountId: googleAccount.providerAccountId,
            accessToken: googleAccount.access_token,
            refreshToken: googleAccount.refresh_token,
            expiresAt: expiresAt,
        });
    }

    // 2. GA4
    const existingGA4 = await biDb.query.integrations.findFirst({
        where: and(
            eq(integrations.organizationId, orgId),
            eq(integrations.provider, "google_analytics")
        )
    });

    if (existingGA4) {
        await biDb.update(integrations).set({
            accessToken: googleAccount.access_token,
            refreshToken: googleAccount.refresh_token || existingGA4.refreshToken,
            expiresAt: expiresAt,
            updatedAt: new Date(),
        }).where(eq(integrations.id, existingGA4.id));
    } else {
        await biDb.insert(integrations).values({
            organizationId: orgId,
            provider: "google_analytics",
            providerAccountId: googleAccount.providerAccountId,
            accessToken: googleAccount.access_token,
            refreshToken: googleAccount.refresh_token,
            expiresAt: expiresAt,
        });
    }

    revalidatePath("/settings");
    return { success: true, message: "Conta Google conectada com sucesso!" };
}
