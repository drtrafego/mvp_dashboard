import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        console.log("[STRIPE CHECKOUT] Starting checkout process");
        const context = await getTenantContext();
        if (!context || !context.userId) {
            console.error("[STRIPE CHECKOUT] Unauthorized: No tenant context or userId");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { priceId, planName } = await req.json();
        console.log("[STRIPE CHECKOUT] Request payload:", { priceId, planName });

        if (!priceId) {
            console.error("[STRIPE CHECKOUT] Missing priceId");
            return NextResponse.json({ error: "Price ID is required" }, { status: 400 });
        }

        // Determine the Price ID based on the plan name passed from frontend if explicitly mapped,
        // OR just use the priceId passed directly (if it's the raw ID).
        // For safety, let's map:
        let finalPriceId = priceId;
        if (priceId === 'monthly') finalPriceId = process.env.STRIPE_PRICE_ID_MONTHLY;
        if (priceId === 'yearly') finalPriceId = process.env.STRIPE_PRICE_ID_YEARLY;
        if (priceId === 'semestral') finalPriceId = process.env.STRIPE_PRICE_ID_SEMESTRAL;

        console.log("[STRIPE CHECKOUT] Resolved Price ID:", finalPriceId);

        if (!finalPriceId) {
            console.error("[STRIPE CHECKOUT] Invalid price configuration. Env vars loaded:", {
                monthly: !!process.env.STRIPE_PRICE_ID_MONTHLY,
                yearly: !!process.env.STRIPE_PRICE_ID_YEARLY,
                semestral: !!process.env.STRIPE_PRICE_ID_SEMESTRAL,
                receivedId: priceId
            });
            return NextResponse.json({ error: "Invalid price configuration" }, { status: 400 });
        }

        // Get current org (if exists) or we might be creating one?
        // Actually, usually they sign up, get a "FREE" org, and then upgrade.
        // OR they pay first? The flow says "/login" -> Dashboard -> then they might see "Upgrade".
        // BUT the Landing Page has "Assinar Mensal" -> Login -> Then Checkout?

        // Let's assume the flow: User Logs in. If they don't have a sub, they are redirected or can choose plan.
        // If they click "Assinar" on Home, they go to Login. After Login, if no sub, show Plans?

        // Here we assume they are logged in.

        const user = await prisma.user.findUnique({
            where: { id: context.userId },
            include: { organization: true }
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Create Stripe Customer if not exists
        let customerId = user.organization?.stripeCustomerId;

        // If user has no organization, we might need to handle onboarding FIRST.
        // But if we want to sell subscription, maybe we attach it to the User temporarily or Org?
        // The Schema put stripe fields on Organization. So they NEED an organization.
        // If they are just "invited" staff, they don't pay. The OWNER pays.

        if (!context.organizationId) {
            return NextResponse.json({ error: "No organization found to upgrade" }, { status: 400 });
        }

        const orgId = context.organizationId;
        const orgName = context.organizationName || "Minha Empresa";
        const orgEmail = context.userEmail; // Use user email for billing

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: orgEmail,
                name: orgName,
                metadata: {
                    organizationId: orgId
                }
            });
            customerId = customer.id;

            await prisma.organization.update({
                where: { id: orgId },
                data: { stripeCustomerId: customerId }
            });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            line_items: [
                {
                    price: finalPriceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/settings/billing?success=true`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/settings/billing?canceled=true`,
            metadata: {
                organizationId: orgId,
                userId: context.userId
            },
            subscription_data: {
                metadata: {
                    organizationId: orgId
                }
            }
        });

        console.log("[STRIPE CHECKOUT] Session created:", session.id);

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("[STRIPE CHECKOUT] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
