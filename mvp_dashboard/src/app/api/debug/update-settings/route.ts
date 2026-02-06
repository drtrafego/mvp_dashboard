import { biDb } from "@/server/db";
import { adAccountSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { organizationId, googleAdsCustomerId, ga4PropertyId, facebookAdAccountId } = body;

        if (!organizationId) {
            return Response.json({ error: "organizationId required" }, { status: 400 });
        }

        // Check if settings exist
        const existing = await biDb
            .select()
            .from(adAccountSettings)
            .where(eq(adAccountSettings.organizationId, organizationId))
            .limit(1);

        if (existing.length) {
            await biDb
                .update(adAccountSettings)
                .set({
                    googleAdsCustomerId: googleAdsCustomerId ?? existing[0].googleAdsCustomerId,
                    ga4PropertyId: ga4PropertyId ?? existing[0].ga4PropertyId,
                    facebookAdAccountId: facebookAdAccountId ?? existing[0].facebookAdAccountId,
                    updatedAt: new Date(),
                })
                .where(eq(adAccountSettings.organizationId, organizationId));
        }

        // Get updated settings
        const updated = await biDb
            .select()
            .from(adAccountSettings)
            .where(eq(adAccountSettings.organizationId, organizationId))
            .limit(1);

        return Response.json({
            success: true,
            settings: updated[0],
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
