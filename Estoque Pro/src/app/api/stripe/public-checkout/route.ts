import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// PUBLIC endpoint - no auth required
// Creates a Stripe checkout session for new users who haven't signed up yet
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const plan = searchParams.get("plan");

    console.log("[STRIPE PUBLIC CHECKOUT] Plan requested:", plan);
    console.log("[STRIPE PUBLIC CHECKOUT] STRIPE_SECRET_KEY present:", !!process.env.STRIPE_SECRET_KEY);
    console.log("[STRIPE PUBLIC CHECKOUT] Key prefix:", process.env.STRIPE_SECRET_KEY?.substring(0, 7));

    // Check for required env vars
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("[STRIPE PUBLIC CHECKOUT] STRIPE_SECRET_KEY is missing!");
        return NextResponse.json({
            error: "Stripe not configured",
            details: "STRIPE_SECRET_KEY is missing"
        }, { status: 500 });
    }

    // Check if key starts with sk_ (secret key) not pk_ (public key)
    if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_")) {
        console.error("[STRIPE PUBLIC CHECKOUT] STRIPE_SECRET_KEY is not a secret key! It should start with sk_");
        return NextResponse.json({
            error: "Invalid Stripe key",
            details: "STRIPE_SECRET_KEY should start with sk_, not pk_"
        }, { status: 500 });
    }

    if (!plan) {
        return NextResponse.json({ error: "Plan is required" }, { status: 400 });
    }

    // Map plan to price ID, or use direct priceId if provided
    const directPriceId = searchParams.get("priceId");
    let priceId: string | undefined = directPriceId || undefined;

    if (!priceId) {
        if (plan === "monthly") priceId = process.env.STRIPE_PRICE_ID_MONTHLY;
        if (plan === "yearly") priceId = process.env.STRIPE_PRICE_ID_YEARLY;
        if (plan === "semestral") priceId = process.env.STRIPE_PRICE_ID_SEMESTRAL;
    }

    console.log("[STRIPE PUBLIC CHECKOUT] Price ID:", priceId);
    console.log("[STRIPE PUBLIC CHECKOUT] Env vars present:", {
        monthly: process.env.STRIPE_PRICE_ID_MONTHLY || "NOT SET",
        yearly: process.env.STRIPE_PRICE_ID_YEARLY || "NOT SET",
        semestral: process.env.STRIPE_PRICE_ID_SEMESTRAL || "NOT SET",
    });

    if (!priceId) {
        console.error("[STRIPE PUBLIC CHECKOUT] No price ID found for plan:", plan);
        return NextResponse.json({
            error: "Invalid plan",
            details: `No price ID configured for plan: ${plan}`,
            configured: {
                monthly: !!process.env.STRIPE_PRICE_ID_MONTHLY,
                yearly: !!process.env.STRIPE_PRICE_ID_YEARLY,
                semestral: !!process.env.STRIPE_PRICE_ID_SEMESTRAL,
            }
        }, { status: 400 });
    }

    try {
        // Initialize Stripe with the secret key
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
            typescript: true,
        });

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: "subscription",
            success_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/#pricing`,
            billing_address_collection: "auto",
        });

        console.log("[STRIPE PUBLIC CHECKOUT] Session created:", session.id);

        if (session.url) {
            return NextResponse.redirect(session.url);
        }

        return NextResponse.json({ error: "No checkout URL returned" }, { status: 500 });
    } catch (error: any) {
        console.error("[STRIPE PUBLIC CHECKOUT] Error:", error);
        return NextResponse.json({
            error: "Stripe error",
            details: error.message,
            type: error.type
        }, { status: 500 });
    }
}
