
"use server";

import { syncMetaAds } from "@/server/actions/sync";
import { syncGoogleAds, syncGA4 } from "@/server/actions/sync-google";
import { auth } from "@/server/auth";

export async function debugForceSync(provider: 'meta' | 'google' | 'ga4') {
    const session = await auth();
    if (!session?.user?.email) return { success: false, error: "Unauthorized" };

    try {
        let result;
        switch (provider) {
            case 'meta':
                result = await syncMetaAds(120); // Sync 120 days
                break;
            case 'google':
                result = await syncGoogleAds();
                break;
            case 'ga4':
                result = await syncGA4();
                break;
        }
        return { success: true, result };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
