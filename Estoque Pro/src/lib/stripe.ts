
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
    typescript: true,
});

if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[STRIPE INIT] STRIPE_SECRET_KEY is missing!");
} else {
    console.log("[STRIPE INIT] Stripe initialized with key starting:", process.env.STRIPE_SECRET_KEY.substring(0, 8) + "...");
}

export function getStripePriceId(interval: 'month' | 'year') {
    if (interval === 'month') return process.env.STRIPE_PRICE_ID_MONTHLY;
    if (interval === 'year') return process.env.STRIPE_PRICE_ID_YEARLY;
    return null;
}
