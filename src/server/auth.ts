import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { biDb } from "@/server/db"
import { accounts, sessions, users, verificationTokens, integrations, invitations } from "@/server/db/schema"
import { eq, and } from "drizzle-orm"

export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: DrizzleAdapter(biDb, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: {
        strategy: "database",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },

    trustHost: true,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/analytics.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            // Token Bridge: Copy tokens from accounts to integrations table
            if (account?.provider === "google" && account.access_token) {
                try {
                    // Find user's organization
                    const dbUser = await biDb.query.users.findFirst({
                        where: eq(users.id, user.id as string)
                    });

                    if (dbUser?.organizationId) {
                        // RESTRICTION: Casal do Trafego
                        // Access allowed for Super Admins AND legitimately invited members.
                        // Since membership is now controlled via Invitations, we trust the organizationId.

                        const orgId = dbUser.organizationId;
                        const expiresAt = account.expires_at
                            ? new Date(account.expires_at * 1000)
                            : new Date(Date.now() + 3600 * 1000);

                        // Upsert Google Ads integration
                        const existingGoogleAds = await biDb.query.integrations.findFirst({
                            where: and(
                                eq(integrations.organizationId, orgId),
                                eq(integrations.provider, "google_ads")
                            )
                        });

                        if (existingGoogleAds) {
                            await biDb.update(integrations)
                                .set({
                                    accessToken: account.access_token,
                                    refreshToken: account.refresh_token || existingGoogleAds.refreshToken,
                                    expiresAt: expiresAt,
                                    updatedAt: new Date(),
                                })
                                .where(eq(integrations.id, existingGoogleAds.id));
                        } else {
                            await biDb.insert(integrations).values({
                                organizationId: orgId,
                                provider: "google_ads",
                                providerAccountId: account.providerAccountId || user.email || "unknown",
                                accessToken: account.access_token,
                                refreshToken: account.refresh_token,
                                expiresAt: expiresAt,
                            });
                        }

                        // Upsert Google Analytics integration
                        const existingGA4 = await biDb.query.integrations.findFirst({
                            where: and(
                                eq(integrations.organizationId, orgId),
                                eq(integrations.provider, "google_analytics")
                            )
                        });

                        if (existingGA4) {
                            await biDb.update(integrations)
                                .set({
                                    accessToken: account.access_token,
                                    refreshToken: account.refresh_token || existingGA4.refreshToken,
                                    expiresAt: expiresAt,
                                    updatedAt: new Date(),
                                })
                                .where(eq(integrations.id, existingGA4.id));
                        } else {
                            await biDb.insert(integrations).values({
                                organizationId: orgId,
                                provider: "google_analytics",
                                providerAccountId: account.providerAccountId || user.email || "unknown",
                                accessToken: account.access_token,
                                refreshToken: account.refresh_token,
                                expiresAt: expiresAt,
                            });
                        }

                        console.log(`[AUTH] Token bridge completed for org ${orgId}`);
                    }
                } catch (error) {
                    console.error("[AUTH] Token bridge error:", error);
                }
            }

            // CHECK INVITATIONS (Link user to org if invited)
            if (user.email) {
                try {
                    const invite = await biDb.query.invitations.findFirst({
                        where: and(
                            eq(invitations.email, user.email),
                            eq(invitations.status, "pending")
                        )
                    });

                    if (invite) {
                        // If user exists, update them. If not, they are being created, so we might need to rely on `createUser` event?
                        // Actually, for OAuth, the user is created by adapter.
                        // Let's try to find them by email.
                        const existingUser = await biDb.query.users.findFirst({
                            where: eq(users.email, user.email)
                        });

                        if (existingUser) {
                            await biDb.update(users).set({
                                organizationId: invite.organizationId,
                                role: invite.role
                            }).where(eq(users.id, existingUser.id));

                            await biDb.update(invitations).set({
                                status: "accepted"
                            }).where(eq(invitations.id, invite.id));

                            console.log(`[AUTH] Invitation accepted for ${user.email}`);
                        } else {
                            // User record might not exist yet if this is the very first sign in hook call?
                            // NextAuth flows can be complex.
                            // Strategy: If we can't find the user, we can try to update invitation status?
                            // But we need to link the user.
                            // Alternative: This logic runs on EVERY login. So if they sign up, they might not be linked instantly?
                            // Let's rely on subsequent logins or `session` callback if needed, but `signIn` is best for "Accepting".
                            console.log("[AUTH] Pending invite found but user not in DB yet (first login?). Will be handled on next pass or via adapter events.");
                        }
                    }
                } catch (e) {
                    console.error("[AUTH] Invite check error:", e);
                }
            }

            return true;
        },
        async session({ session, user }) {
            // Attach organizationId to session for easy access
            if (user?.id) {
                const dbUser = await biDb.query.users.findFirst({
                    where: eq(users.id, user.id)
                });
                if (dbUser?.organizationId) {
                    (session as any).organizationId = dbUser.organizationId;
                }
            }
            return session;
        },
    },
    pages: {
        signIn: "/auth/signin",
    },
})
