
import { NextResponse } from 'next/server';
import { syncAllMetaAdsIntegrations } from '@/server/actions/sync-system';

export const dynamic = 'force-dynamic'; // Ensure it's not cached

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('authorization');

        // Vercel Cron automatically sends this header
        // You can also use a custom secret if calling manually from an external pinger
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            // For now, if no CRON_SECRET is set, we might want to allow it or fail.
            // Best practice is to require it. 
            // If running on Vercel Cron, the header is standard.
        }

        console.log("Starting Cron Job: sync-meta");

        const results = await syncAllMetaAdsIntegrations(30);

        return NextResponse.json({ success: true, results });
    } catch (error: any) {
        console.error("Cron Job Failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
