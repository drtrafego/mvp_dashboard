
"use client";

import { useState } from "react";
import { debugForceSync } from "@/server/actions/debug-actions";

export function DebugControls() {
    const [status, setStatus] = useState<string>("");
    const [loading, setLoading] = useState(false);

    const handleSync = async (provider: 'meta' | 'google' | 'ga4') => {
        setLoading(true);
        setStatus(`Syncing ${provider}...`);
        try {
            const res = await debugForceSync(provider);
            if (res.success) {
                setStatus(`✅ Sync Success! ${JSON.stringify(res.result)}`);
                window.location.reload(); // Refresh to see data
            } else {
                setStatus(`❌ Sync Failed: ${res.error}`);
            }
        } catch (e: any) {
            setStatus(`❌ Error: ${e.message}`);
        }
        setLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    onClick={() => handleSync('meta')}
                    disabled={loading}
                    className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                    Force Meta Sync
                </button>
                <button
                    onClick={() => handleSync('google')}
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                    Force Google Ads Sync
                </button>
                <button
                    onClick={() => handleSync('ga4')}
                    disabled={loading}
                    className="bg-orange-600 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                    Force GA4 Sync
                </button>
            </div>
            {status && (
                <div className="p-2 bg-gray-100 border rounded text-xs break-all">
                    {status}
                </div>
            )}
        </div>
    );
}
