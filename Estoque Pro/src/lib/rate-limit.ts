/**
 * Rate Limiting Implementation for API Routes
 * 
 * This module provides a simple in-memory rate limiter for development
 * and a Redis-based rate limiter placeholder for production.
 * 
 * For production, replace with Upstash Redis or similar:
 * npm install @upstash/ratelimit @upstash/redis
 */

interface RateLimitResult {
    success: boolean
    remaining: number
    reset: number
}

interface RateLimitStore {
    [key: string]: {
        count: number
        resetTime: number
    }
}

// In-memory store (for development - NOT for production with multiple instances)
const rateLimitStore: RateLimitStore = {}

// Default configuration
const DEFAULT_WINDOW_MS = 60 * 1000     // 1 minute
const DEFAULT_MAX_REQUESTS = 100         // 100 requests per window

/**
 * Simple in-memory rate limiter
 * Works for single-instance deployments
 * For production with multiple instances, use Redis-based solution
 */
export async function rateLimit(
    identifier: string,
    maxRequests: number = DEFAULT_MAX_REQUESTS,
    windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
    const now = Date.now()
    const key = identifier

    // Clean up old entries periodically
    cleanupExpiredEntries(now)

    // Get or create rate limit entry
    const entry = rateLimitStore[key]

    if (!entry || entry.resetTime < now) {
        // Create new window
        rateLimitStore[key] = {
            count: 1,
            resetTime: now + windowMs
        }
        return {
            success: true,
            remaining: maxRequests - 1,
            reset: now + windowMs
        }
    }

    // Check if limit exceeded
    if (entry.count >= maxRequests) {
        return {
            success: false,
            remaining: 0,
            reset: entry.resetTime
        }
    }

    // Increment counter
    entry.count++
    return {
        success: true,
        remaining: maxRequests - entry.count,
        reset: entry.resetTime
    }
}

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(now: number): void {
    // Only clean up every 100 calls to reduce overhead
    if (Math.random() > 0.01) return

    for (const key in rateLimitStore) {
        if (rateLimitStore[key].resetTime < now) {
            delete rateLimitStore[key]
        }
    }
}

/**
 * Get client identifier from request
 * Uses IP address as primary identifier
 */
export function getClientIdentifier(request: Request): string {
    // Try to get real IP from headers (for proxies/load balancers)
    const forwardedFor = request.headers.get("x-forwarded-for")
    if (forwardedFor) {
        // Take first IP from chain
        return forwardedFor.split(",")[0].trim()
    }

    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
        return realIp
    }

    // Fallback - in production this might not be the real IP
    return "unknown"
}

/**
 * Rate limiter middleware for API routes
 * Returns a Response if rate limited, or null if request should proceed
 */
export async function rateLimitMiddleware(
    request: Request,
    maxRequests: number = DEFAULT_MAX_REQUESTS,
    windowMs: number = DEFAULT_WINDOW_MS
): Promise<Response | null> {
    const identifier = getClientIdentifier(request)
    const result = await rateLimit(identifier, maxRequests, windowMs)

    if (!result.success) {
        return new Response(
            JSON.stringify({
                error: "Too many requests",
                message: "Limite de requisições excedido. Tente novamente em alguns segundos.",
                retryAfter: Math.ceil((result.reset - Date.now()) / 1000)
            }),
            {
                status: 429,
                headers: {
                    "Content-Type": "application/json",
                    "Retry-After": Math.ceil((result.reset - Date.now()) / 1000).toString(),
                    "X-RateLimit-Remaining": result.remaining.toString(),
                    "X-RateLimit-Reset": result.reset.toString()
                }
            }
        )
    }

    return null
}

/**
 * Stricter rate limit for authentication endpoints
 */
export async function authRateLimit(request: Request): Promise<Response | null> {
    // 10 attempts per 15 minutes for auth endpoints
    return rateLimitMiddleware(request, 10, 15 * 60 * 1000)
}

/**
 * Rate limit for write operations (POST, PUT, DELETE)
 */
export async function writeRateLimit(request: Request): Promise<Response | null> {
    // 30 write operations per minute
    return rateLimitMiddleware(request, 30, 60 * 1000)
}

// ==============================
// PRODUCTION RATE LIMITER (UPSTASH REDIS)
// ==============================
// Uncomment and configure for production with Redis:
//
// import { Ratelimit } from "@upstash/ratelimit"
// import { Redis } from "@upstash/redis"
//
// const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL!,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// })
//
// export const productionRateLimiter = new Ratelimit({
//     redis,
//     limiter: Ratelimit.slidingWindow(100, "1m"),
//     analytics: true,
//     prefix: "estoque-pro",
// })
//
// export async function productionRateLimit(identifier: string) {
//     const { success, remaining, reset } = await productionRateLimiter.limit(identifier)
//     return { success, remaining, reset }
// }
