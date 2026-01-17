import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/email";
import { trackPurchaseConversion } from "@/lib/conversions";

// Helper function to generate a slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 50);
}

// Helper function to generate random password
function generateRandomPassword(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Helper function to check if email is Gmail
function isGmailEmail(email: string): boolean {
    return email.toLowerCase().endsWith("@gmail.com");
}

// Helper function to safely get subscription expiration date
function getSubscriptionExpirationDate(subscription: Stripe.Subscription): Date {
    // Try to get current_period_end from subscription
    const periodEnd = (subscription as any).current_period_end;

    if (periodEnd && typeof periodEnd === 'number') {
        return new Date(periodEnd * 1000);
    }

    // Fallback: 30 days from now
    console.log("[STRIPE WEBHOOK] Warning: current_period_end not available, using 30-day fallback");
    return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

export async function POST(req: Request) {
    const body = await req.text();
    const headerList = await headers();
    const signature = headerList.get("Stripe-Signature") as string;

    console.log("[STRIPE WEBHOOK] Received request");
    console.log("[STRIPE WEBHOOK] Signature present:", !!signature);
    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || "whsec_placeholder"
        );
        console.log("[STRIPE WEBHOOK] Event constructed successfully:", event.type);
    } catch (error: any) {
        console.error("[STRIPE WEBHOOK] Signature verification failed:", error.message);
        console.error("[STRIPE WEBHOOK] SECRET configured:", !!process.env.STRIPE_WEBHOOK_SECRET);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    try {
        // ============================================
        // CHECKOUT COMPLETED - Create User & Org
        // ============================================
        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            console.log("[STRIPE WEBHOOK] Processing checkout.session.completed");
            console.log("[STRIPE WEBHOOK] Session metadata:", session.metadata);

            const subscriptionId = session.subscription as string;
            const customerEmail = session.customer_details?.email;
            const customerName = session.customer_details?.name || customerEmail?.split("@")[0] || "Usuário";

            if (!customerEmail) {
                console.error("[STRIPE WEBHOOK] No customer email found in session");
                return new NextResponse("No customer email", { status: 400 });
            }

            // Retrieve subscription details
            const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;

            // Check if we have an existing organization (user upgrading from free)
            const existingOrgId = session.metadata?.organizationId;

            if (existingOrgId) {
                // User was upgrading an existing organization
                console.log("[STRIPE WEBHOOK] Updating existing organization:", existingOrgId);
                await prisma.organization.update({
                    where: { id: existingOrgId },
                    data: {
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: subscriptionId,
                        stripePriceId: subscription.items.data[0].price.id,
                        subscriptionStatus: subscription.status,
                        subscriptionExpiresAt: getSubscriptionExpirationDate(subscription),
                        plan: "PRO"
                    }
                });
            } else {
                // NEW USER - Create User and Organization
                console.log("[STRIPE WEBHOOK] Creating new user and organization for:", customerEmail);

                // Check if user already exists
                let existingUser = await prisma.user.findUnique({
                    where: { email: customerEmail }
                });

                if (existingUser) {
                    // User exists but might not have active subscription
                    console.log("[STRIPE WEBHOOK] User already exists, updating their organization");
                    if (existingUser.organizationId) {
                        await prisma.organization.update({
                            where: { id: existingUser.organizationId },
                            data: {
                                stripeCustomerId: session.customer as string,
                                stripeSubscriptionId: subscriptionId,
                                stripePriceId: subscription.items.data[0].price.id,
                                subscriptionStatus: subscription.status,
                                subscriptionExpiresAt: getSubscriptionExpirationDate(subscription),
                                plan: "PRO"
                            }
                        });
                    }
                } else {
                    // Create new organization
                    const baseSlug = generateSlug(customerName);
                    let uniqueSlug = baseSlug;
                    let slugCounter = 1;

                    // Ensure unique slug
                    while (await prisma.organization.findUnique({ where: { slug: uniqueSlug } })) {
                        uniqueSlug = `${baseSlug}-${slugCounter}`;
                        slugCounter++;
                    }

                    const newOrg = await prisma.organization.create({
                        data: {
                            name: customerName,
                            slug: uniqueSlug,
                            plan: "PRO",
                            stripeCustomerId: session.customer as string,
                            stripeSubscriptionId: subscriptionId,
                            stripePriceId: subscription.items.data[0].price.id,
                            subscriptionStatus: subscription.status,
                            subscriptionExpiresAt: getSubscriptionExpirationDate(subscription)
                        }
                    });

                    // Create default categories
                    const defaultCategories = [
                        "Proteínas",
                        "Hortifruti",
                        "Mercearia Seca",
                        "Laticínios e Frios",
                        "Molhos, Temperos e Condimentos",
                        "Bebidas",
                        "Padaria",
                        "Sobremesas"
                    ];

                    await Promise.all(defaultCategories.map(name =>
                        prisma.category.create({
                            data: {
                                name,
                                organizationId: newOrg.id
                            }
                        })
                    ));

                    // Create default settings for the organization
                    await prisma.settings.create({
                        data: {
                            organizationId: newOrg.id,
                            companyName: customerName,
                            ownerName: customerName,
                            companyEmail: customerEmail
                        }
                    });

                    // Create the user with a temporary ID until they sign up via Stack Auth
                    const tempPrivyId = `pending:${customerEmail}:${Date.now()}`;

                    // We DO NOT generate passwords anymore because Stack Auth handles auth.
                    // We will send an activation link instead.
                    console.log("[STRIPE WEBHOOK] Creating pending user, waiting for Stack Auth signup");

                    await prisma.user.create({
                        data: {
                            email: customerEmail,
                            privyId: tempPrivyId,
                            name: customerName,
                            role: "ADMIN",
                            organizationId: newOrg.id
                            // No passwordHash needed
                        }
                    });

                    console.log("[STRIPE WEBHOOK] Created new user and organization successfully");
                    console.log("[STRIPE WEBHOOK] Email:", customerEmail);
                    console.log("[STRIPE WEBHOOK] Org ID:", newOrg.id);

                    // Send welcome email with activation instructions
                    await sendWelcomeEmail({
                        to: customerEmail,
                        customerName
                    });
                    console.log("[STRIPE WEBHOOK] Welcome email sent to:", customerEmail);
                }
            }

            // Track purchase conversion for Meta and Google
            const amountTotal = session.amount_total ? session.amount_total / 100 : 0;
            await trackPurchaseConversion({
                email: customerEmail,
                value: amountTotal,
                currency: session.currency?.toUpperCase() || 'BRL',
                transactionId: session.id,
                customerName: customerName
            });
            console.log("[STRIPE WEBHOOK] Purchase conversion tracked");
        }

        // ============================================
        // INVOICE PAYMENT SUCCEEDED - Renew subscription
        // ============================================
        if (event.type === "invoice.payment_succeeded") {
            const invoice = event.data.object as any; // Cast to any for subscription access
            console.log("[STRIPE WEBHOOK] Processing invoice.payment_succeeded");

            if (invoice.subscription) {
                const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string) as Stripe.Subscription;

                // Update organization by subscription ID
                await prisma.organization.updateMany({
                    where: { stripeSubscriptionId: invoice.subscription as string },
                    data: {
                        subscriptionStatus: subscription.status,
                        subscriptionExpiresAt: new Date((subscription as any).current_period_end * 1000)
                    }
                });
            }
        }

        // ============================================
        // INVOICE PAYMENT FAILED - Mark as past_due
        // ============================================
        if (event.type === "invoice.payment_failed") {
            const invoice = event.data.object as any; // Cast to any for subscription access
            console.log("[STRIPE WEBHOOK] Processing invoice.payment_failed");

            if (invoice.subscription) {
                await prisma.organization.updateMany({
                    where: { stripeSubscriptionId: invoice.subscription as string },
                    data: {
                        subscriptionStatus: "past_due"
                    }
                });
            }
        }

        // ============================================
        // SUBSCRIPTION UPDATED
        // ============================================
        if (event.type === "customer.subscription.updated") {
            const subscription = event.data.object as Stripe.Subscription;
            console.log("[STRIPE WEBHOOK] Processing customer.subscription.updated");

            await prisma.organization.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    subscriptionStatus: subscription.cancel_at_period_end ? "cancel_at_period_end" : subscription.status,
                    subscriptionExpiresAt: getSubscriptionExpirationDate(subscription)
                }
            });
        }

        // ============================================
        // SUBSCRIPTION DELETED - Delete organization data
        // ============================================
        if (event.type === "customer.subscription.deleted") {
            const subscription = event.data.object as Stripe.Subscription;
            console.log("[STRIPE WEBHOOK] Processing customer.subscription.deleted - Will delete organization");

            // Find the organization
            const org = await prisma.organization.findFirst({
                where: { stripeSubscriptionId: subscription.id }
            });

            if (org) {
                console.log(`[STRIPE WEBHOOK] Deleting organization: ${org.name} (${org.id})`);

                // Delete the organization (cascade will delete all related data)
                await prisma.organization.delete({
                    where: { id: org.id }
                });

                console.log(`[STRIPE WEBHOOK] Organization ${org.id} and all data deleted successfully`);
            } else {
                console.log("[STRIPE WEBHOOK] No organization found for this subscription");
            }
        }

    } catch (error: any) {
        console.error("[STRIPE WEBHOOK] Handler Error:", error);
        console.error("[STRIPE WEBHOOK] Error name:", error?.name);
        console.error("[STRIPE WEBHOOK] Error message:", error?.message);
        console.error("[STRIPE WEBHOOK] Error stack:", error?.stack);
        // Return error details for debugging
        return new NextResponse(
            JSON.stringify({
                error: "Webhook Handler Error",
                message: error?.message,
                name: error?.name
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new NextResponse(null, { status: 200 });
}

