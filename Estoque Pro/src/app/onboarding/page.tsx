import { getTenantContext } from "@/lib/tenant"
import { redirect } from "next/navigation"
import { OnboardingForm } from "./form"

export default async function OnboardingPage() {
    const context = await getTenantContext()

    // If user already has an organization (e.g. came from Stripe webhook purchase),
    // skip onboarding and go straight to dashboard
    if (context?.organizationId) {
        redirect("/dashboard")
    }

    return <OnboardingForm />
}
