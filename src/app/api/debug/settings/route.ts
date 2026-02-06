import { biDb } from "@/server/db";
import { adAccountSettings } from "@/server/db/schema";

export async function GET() {
    try {
        const settings = await biDb.select().from(adAccountSettings);

        return Response.json({
            settings: settings.map(s => ({
                id: s.id,
                organizationId: s.organizationId,
                googleAdsCustomerId: s.googleAdsCustomerId,
                ga4PropertyId: s.ga4PropertyId,
                facebookAdAccountId: s.facebookAdAccountId,
                updatedAt: s.updatedAt,
            })),
        });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
