
import { NextResponse } from 'next/server';
import { syncAllMetaAdsIntegrations } from '@/server/actions/sync-system';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for Pro plans

export async function GET(request: Request) {
    try {
        // Validate CRON_SECRET - Vercel Cron sends Bearer token automatically
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            console.error("[CRON] sync-meta: Unauthorized request");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[CRON] Starting Meta Ads sync at", new Date().toISOString());

        const results = await syncAllMetaAdsIntegrations(30);

        console.log("[CRON] Meta Ads sync completed:", JSON.stringify(results));

        return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error("[CRON] Meta Ads sync FAILED:", error);
        return NextResponse.json(
            { success: false, error: error.message, timestamp: new Date().toISOString() },
            { status: 500 }
        );
    }
}
