/**
 * Server-side Conversions API for Meta and Google
 * Sends purchase events when Stripe webhook confirms payment
 */

import crypto from 'crypto';

// Meta Conversions API
const META_PIXEL_ID = process.env.META_PIXEL_ID || '510826690272749';
const META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;

// Google Analytics 4 Measurement Protocol
const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID || 'G-FY4WDHB2ZE';
const GA4_API_SECRET = process.env.GA4_API_SECRET;

interface PurchaseEventData {
    email: string;
    value: number;
    currency: string;
    transactionId: string;
    customerName?: string;
    userAgent?: string;
    clientIp?: string;
}

/**
 * Hash data for Meta Conversions API (requires SHA256 lowercase)
 */
function hashForMeta(data: string): string {
    return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Send Purchase event to Meta Conversions API
 */
export async function sendMetaPurchaseEvent(data: PurchaseEventData): Promise<boolean> {
    if (!META_ACCESS_TOKEN) {
        console.warn('[CONVERSIONS] Meta Access Token not configured');
        return false;
    }

    const eventTime = Math.floor(Date.now() / 1000);
    const eventId = `purchase_${data.transactionId}_${eventTime}`;

    const payload = {
        data: [{
            event_name: 'Purchase',
            event_time: eventTime,
            event_id: eventId,
            event_source_url: 'https://chefcontrol.online/checkout/success',
            action_source: 'website',
            user_data: {
                em: [hashForMeta(data.email)],
                fn: data.customerName ? [hashForMeta(data.customerName.split(' ')[0])] : undefined,
                ln: data.customerName ? [hashForMeta(data.customerName.split(' ').slice(1).join(' '))] : undefined,
                client_ip_address: data.clientIp,
                client_user_agent: data.userAgent,
            },
            custom_data: {
                currency: data.currency,
                value: data.value,
                content_type: 'product',
                content_name: 'ChefControl Subscription',
                content_ids: [data.transactionId],
            }
        }]
    };

    try {
        const response = await fetch(
            `https://graph.facebook.com/v18.0/${META_PIXEL_ID}/events?access_token=${META_ACCESS_TOKEN}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        const result = await response.json();

        if (response.ok) {
            console.log('[CONVERSIONS] Meta Purchase event sent successfully:', result);
            return true;
        } else {
            console.error('[CONVERSIONS] Meta API error:', result);
            return false;
        }
    } catch (error) {
        console.error('[CONVERSIONS] Error sending Meta event:', error);
        return false;
    }
}

/**
 * Send Purchase event to Google Analytics 4 via Measurement Protocol
 */
export async function sendGA4PurchaseEvent(data: PurchaseEventData): Promise<boolean> {
    if (!GA4_API_SECRET) {
        console.warn('[CONVERSIONS] GA4 API Secret not configured');
        return false;
    }

    // Generate a client_id (ideally from cookie, but we use email hash as fallback)
    const clientId = hashForMeta(data.email).substring(0, 32) + '.' + Math.floor(Date.now() / 1000);

    const payload = {
        client_id: clientId,
        events: [{
            name: 'purchase',
            params: {
                transaction_id: data.transactionId,
                value: data.value,
                currency: data.currency,
                items: [{
                    item_id: 'chefcontrol_subscription',
                    item_name: 'ChefControl Subscription',
                    price: data.value,
                    quantity: 1
                }]
            }
        }]
    };

    try {
        const response = await fetch(
            `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_MEASUREMENT_ID}&api_secret=${GA4_API_SECRET}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
        );

        if (response.ok || response.status === 204) {
            console.log('[CONVERSIONS] GA4 Purchase event sent successfully');
            return true;
        } else {
            const text = await response.text();
            console.error('[CONVERSIONS] GA4 API error:', response.status, text);
            return false;
        }
    } catch (error) {
        console.error('[CONVERSIONS] Error sending GA4 event:', error);
        return false;
    }
}

/**
 * Send purchase conversion to both Meta and Google
 */
export async function trackPurchaseConversion(data: PurchaseEventData): Promise<void> {
    console.log('[CONVERSIONS] Tracking purchase conversion for:', data.email);

    await Promise.all([
        sendMetaPurchaseEvent(data),
        sendGA4PurchaseEvent(data)
    ]);
}
