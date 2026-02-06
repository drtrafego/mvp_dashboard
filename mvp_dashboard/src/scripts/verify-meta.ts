import { config } from "dotenv";
config({ path: ".env" });

import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk';

// Manual test with hardcoded token/id from .env to bypass DB for quick check
const TOKEN = process.env.META_ACCESS_TOKEN;
// We'll try to list ad accounts if we don't know the ID, or use a dummy one if user hasn't set one.
// User entered 'act_...' in settings? We can query DB or just try to list.

async function main() {
    console.log("Testing Meta API...");

    if (!TOKEN) {
        console.error("Missing META_ACCESS_TOKEN");
        return;
    }

    try {
        const api = FacebookAdsApi.init(TOKEN);
        const me = await api.call('GET', ['me/adaccounts'], {
            fields: 'name,account_id,account_status'
        });

        console.log("Ad Accounts found:", JSON.stringify(me, null, 2));

    } catch (e: any) {
        console.error("API Error:", e?.response || e);
    }
}

main();
