import { prisma } from "@/lib/db"
import { stackServerApp } from "@/lib/stack"
import { cookies } from "next/headers"

export interface TenantContext {
    userId: string
    userEmail: string
    userName: string | null
    organizationId: string | null
    organizationName: string | null
    organizationSlug: string | null
    role: "SUPER_ADMIN" | "ADMIN" | "STAFF"
    isSuperAdmin: boolean
    isAdmin: boolean
    canManageStock: boolean // STAFF, ADMIN, and SUPER_ADMIN can manage stock
    subscriptionStatus: string | null
    subscriptionExpiresAt: Date | null
}

/**
 * Get the current tenant context from the logged-in user
 * This should be called in Server Components or API routes
 */
export async function getTenantContext(): Promise<TenantContext | null> {
    try {
        // Get user from Stack Auth
        const stackUser = await stackServerApp.getUser()

        if (!stackUser) {
            return null
        }

        // Find user in our database
        let dbUser = await prisma.user.findUnique({
            where: { privyId: stackUser.id },
            include: { organization: true }
        })

        // If user doesn't exist in our DB yet, checking by privyId
        if (!dbUser && stackUser.primaryEmail) {
            // Check if user exists by email (e.g. was invited)
            // Ensure case-insensitive comparison
            const existingUserByEmail = await prisma.user.findFirst({
                where: {
                    email: {
                        equals: stackUser.primaryEmail,
                        mode: "insensitive"
                    }
                },
                include: { organization: true }
            })

            if (existingUserByEmail) {
                // Link the Stack Auth user to the existing invited user
                dbUser = await prisma.user.update({
                    where: { id: existingUserByEmail.id },
                    data: {
                        privyId: stackUser.id,
                        // Update name if it wasn't set or if we want to sync it
                        name: existingUserByEmail.name || stackUser.displayName
                    },
                    include: { organization: true }
                })
            }
        }

        // If still no user, create a new one
        if (!dbUser) {
            // Check if this is a super admin
            const superAdminEmails = (process.env.SUPER_ADMIN_EMAIL || "").split(",").map(e => e.trim())
            const isSuperAdmin = stackUser.primaryEmail && superAdminEmails.includes(stackUser.primaryEmail)

            dbUser = await prisma.user.create({
                data: {
                    privyId: stackUser.id,
                    email: stackUser.primaryEmail || "",
                    name: stackUser.displayName,
                    role: isSuperAdmin ? "SUPER_ADMIN" : "STAFF",
                },
                include: { organization: true }
            })
        }

        const isSuperAdmin = dbUser.role === "SUPER_ADMIN"
        const isAdmin = dbUser.role === "ADMIN" || isSuperAdmin
        const canManageStock = true // All roles (STAFF, ADMIN, SUPER_ADMIN) can manage stock

        return {
            userId: dbUser.id,
            userEmail: dbUser.email,
            userName: dbUser.name,
            organizationId: dbUser.organizationId,
            organizationName: dbUser.organization?.name || null,
            organizationSlug: dbUser.organization?.slug || null,
            role: dbUser.role as "SUPER_ADMIN" | "ADMIN" | "STAFF",
            isSuperAdmin,
            isAdmin,
            canManageStock,
            subscriptionStatus: dbUser.organization?.subscriptionStatus || null,
            subscriptionExpiresAt: dbUser.organization?.subscriptionExpiresAt || null
        }
    } catch (error) {
        console.error("Error getting tenant context:", error)
        return null
    }
}

/**
 * Require a valid tenant context - redirects to login if not authenticated
 */
export async function requireTenantContext(): Promise<TenantContext> {
    const context = await getTenantContext()
    if (!context) {
        throw new Error("User not authenticated")
    }
    return context
}

/**
 * Require an organization - redirects to onboarding if no organization
 * Also checks Subscription Status
 */
export async function requireOrganization(options: { allowExpired?: boolean } = {}): Promise<TenantContext & { organizationId: string }> {
    const context = await requireTenantContext()

    // Super admins can access without an organization
    if (context.isSuperAdmin) {
        return context as TenantContext & { organizationId: string }
    }

    if (!context.organizationId) {
        throw new Error("User has no organization - needs onboarding")
    }

    // Check Subscription Block
    // valid statuses: 'active', 'trialing'. 
    // 'past_due' might allow access with warning? User said "bloqueado".
    // 'incomplete' means payment failed initial.
    if (!options.allowExpired) {
        const validStatuses = ["active", "trialing"];
        // If status is present AND not valid
        // Note: if status is null (legacy/free?), we might block IF the system is fully strictly paid.
        // User said: "vamos ter apenas um tipo de plano". implies NO free tier.
        // So null status = blocked (or needs to subscribe).

        const status = context.subscriptionStatus;
        if (!status || !validStatuses.includes(status)) {
            // We can check expiry date grace period?
            // For now, strict:
            // throw new Error("Subscription inactive"); 
            // Ideally we redirect, but this function throws. The PAGE catches ideally.
            // But throwing a specific error helps middleware or wrapper.

            // UNLESS we are in an API that handles this?
            // Let's attach a specific error property or message.
            const error = new Error("Subscription Required");
            (error as any).code = "SUBSCRIPTION_REQUIRED";
            throw error;
        }
    }

    return context as TenantContext & { organizationId: string }
}

/**
 * Check if user has a specific role or higher
 */
export function hasRole(context: TenantContext, requiredRole: "STAFF" | "ADMIN" | "SUPER_ADMIN"): boolean {
    const roleHierarchy = { STAFF: 1, ADMIN: 2, SUPER_ADMIN: 3 }
    return roleHierarchy[context.role] >= roleHierarchy[requiredRole]
}
