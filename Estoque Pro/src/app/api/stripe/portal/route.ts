import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenant";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        const context = await getTenantContext();
        if (!context || !context.userId || !context.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const org = await prisma.organization.findUnique({
            where: { id: context.organizationId }
        });

        if (!org || !org.stripeCustomerId) {
            return NextResponse.json({ error: "No billing account found" }, { status: 400 });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin}/settings`,
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Stripe Portal Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
