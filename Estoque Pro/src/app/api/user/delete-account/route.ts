import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover"
})

export async function DELETE(req: Request) {
    try {
        const context = await getTenantContext()
        if (!context?.userId || !context?.organizationId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Get organization with subscription info
        const org = await prisma.organization.findUnique({
            where: { id: context.organizationId },
            include: { users: true }
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
                error: "Apenas administradores podem excluir a conta"
            }, { status: 403 })
        }

        let refundIssued = false
        let refundAmount = 0

        // Handle Stripe cancellation and refund
        if (org.stripeCustomerId) {
            try {
                // Get all subscriptions for this customer
                const subscriptions = await stripe.subscriptions.list({
                    customer: org.stripeCustomerId,
                    status: "active"
                })

                // Get the latest payment intent to check if within 7 days
                const paymentIntents = await stripe.paymentIntents.list({
                    customer: org.stripeCustomerId,
                    limit: 1
                })

                const latestPayment = paymentIntents.data[0]
                const daysSincePayment = latestPayment
                    ? Math.floor((Date.now() - latestPayment.created * 1000) / (1000 * 60 * 60 * 24))
                    : 999

                // Cancel all active subscriptions
                for (const sub of subscriptions.data) {
                    await stripe.subscriptions.cancel(sub.id)
                }

                // Issue refund if within 7 days
                if (daysSincePayment <= 7 && latestPayment && latestPayment.status === "succeeded") {
                    try {
                        const refund = await stripe.refunds.create({
                            payment_intent: latestPayment.id,
                            reason: "requested_by_customer"
                        })
                        refundIssued = true
                        refundAmount = refund.amount / 100
                        console.log(`[DELETE ACCOUNT] Refund issued: R$ ${refundAmount}`)
                    } catch (refundError) {
                        console.error("[DELETE ACCOUNT] Refund failed:", refundError)
                    }
                }

                // Delete customer from Stripe
                await stripe.customers.del(org.stripeCustomerId)

            } catch (stripeError) {
                console.error("[DELETE ACCOUNT] Stripe error:", stripeError)
                // Continue with database deletion even if Stripe fails
            }
        }

        // Delete all organization data
        // Due to onDelete: Cascade, this will delete:
        // - Users, Categories, Products, StockLogs, Settings, Variants, etc.
        await prisma.organization.delete({
            where: { id: context.organizationId }
        })

        console.log(`[DELETE ACCOUNT] Organization ${org.id} deleted successfully`)

        return NextResponse.json({
            success: true,
            message: "Conta excluída com sucesso",
            refundIssued,
            refundAmount: refundIssued ? `R$ ${refundAmount.toFixed(2)}` : null
        })

    } catch (error) {
        console.error("[DELETE ACCOUNT] Error:", error)
        return NextResponse.json({
            error: "Erro ao excluir conta. Tente novamente."
        }, { status: 500 })
    }
}
