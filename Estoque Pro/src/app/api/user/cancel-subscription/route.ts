import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover"
})

export async function POST(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.userId || !context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { requestRefund } = body

        // Get organization with subscription info
        const org = await prisma.organization.findUnique({
            where: { id: context.organizationId }
        })

        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 })
        }

        // Check if user is admin of the organization
        const user = await prisma.user.findUnique({
            where: { id: context.userId }
        })

        if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
            return NextResponse.json({
                error: "Apenas administradores podem cancelar a assinatura"
            }, { status: 403 })
        }

        if (!org.stripeSubscriptionId) {
            return NextResponse.json({
                error: "Nenhuma assinatura ativa encontrada"
            }, { status: 400 })
        }

        let refundIssued = false
        let refundAmount = 0
        let cancelAtPeriodEnd = true

        try {
            // Check if within 7 days for refund eligibility
            if (requestRefund && org.stripeCustomerId) {
                const paymentIntents = await stripe.paymentIntents.list({
                    customer: org.stripeCustomerId,
                    limit: 1
                })

                const latestPayment = paymentIntents.data[0]
                const daysSincePayment = latestPayment
                    ? Math.floor((Date.now() - latestPayment.created * 1000) / (1000 * 60 * 60 * 24))
                    : 999

                // Issue refund if within 7 days and requested
                if (daysSincePayment <= 7 && latestPayment && latestPayment.status === "succeeded") {
                    try {
                        const refund = await stripe.refunds.create({
                            payment_intent: latestPayment.id,
                            reason: "requested_by_customer"
                        })
                        refundIssued = true
                        refundAmount = refund.amount / 100
                        cancelAtPeriodEnd = false // Cancel immediately if refunded
                        console.log(`[CANCEL SUBSCRIPTION] Refund issued: R$ ${refundAmount}`)
                    } catch (refundError) {
                        console.error("[CANCEL SUBSCRIPTION] Refund failed:", refundError)
                    }
                }
            }

            if (refundIssued) {
                // Cancel immediately (subscription will be deleted, triggering webhook to delete data)
                await stripe.subscriptions.cancel(org.stripeSubscriptionId)
            } else {
                // Cancel at period end (keeps access until subscription expires)
                await stripe.subscriptions.update(org.stripeSubscriptionId, {
                    cancel_at_period_end: true
                })
            }

            // Update organization status
            await prisma.organization.update({
                where: { id: context.organizationId },
                data: {
                    subscriptionStatus: refundIssued ? "canceled" : "cancel_at_period_end"
                }
            })

            console.log(`[CANCEL SUBSCRIPTION] Organization ${org.id} subscription ${refundIssued ? 'canceled immediately' : 'set to cancel at period end'}`)

            return NextResponse.json({
                success: true,
                message: refundIssued
                    ? "Assinatura cancelada com reembolso. Seus dados serão removidos em breve."
                    : "Assinatura cancelada. Você terá acesso até o fim do período pago.",
                refundIssued,
                refundAmount: refundIssued ? `R$ ${refundAmount.toFixed(2)}` : null,
                canceledImmediately: refundIssued,
                accessUntil: refundIssued ? null : org.subscriptionExpiresAt
            })

        } catch (stripeError: any) {
            console.error("[CANCEL SUBSCRIPTION] Stripe error:", stripeError)
            return NextResponse.json({
                error: "Erro ao cancelar assinatura na Stripe: " + (stripeError.message || "Erro desconhecido")
            }, { status: 500 })
        }

    } catch (error) {
        console.error("[CANCEL SUBSCRIPTION] Error:", error)
        return NextResponse.json({
            error: "Erro ao cancelar assinatura. Tente novamente."
        }, { status: 500 })
    }
}
