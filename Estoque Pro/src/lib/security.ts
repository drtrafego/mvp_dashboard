/**
 * Security Middleware Utilities
 * 
 * Additional security utilities for protecting the application
 */

import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// ==============================
// CSRF PROTECTION
// ==============================

const CSRF_TOKEN_HEADER = "x-csrf-token"
const CSRF_TOKEN_COOKIE = "__csrf"

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(32).toString("hex")
}

/**
 * Validate CSRF token from request
 * For state-changing operations (POST, PUT, DELETE)
 */
export function validateCsrfToken(request: NextRequest): boolean {
    // Skip for GET, HEAD, OPTIONS
    const method = request.method.toUpperCase()
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
        return true
    }

    const headerToken = request.headers.get(CSRF_TOKEN_HEADER)
    const cookieToken = request.cookies.get(CSRF_TOKEN_COOKIE)?.value

    if (!headerToken || !cookieToken) {
        return false
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(headerToken),
        Buffer.from(cookieToken)
    )
}

// ==============================
// INPUT SANITIZATION
// ==============================

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;")
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const trimmed = email.toLowerCase().trim()

    if (!emailRegex.test(trimmed)) {
        return null
    }

    // Max length check
    if (trimmed.length > 255) {
        return null
    }

    return trimmed
}

/**
 * Validate ID format (CUID or UUID)
 */
export function isValidId(id: string): boolean {
    // CUID format: starts with 'c', 25 characters
    const cuidRegex = /^c[a-z0-9]{24}$/
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    return cuidRegex.test(id) || uuidRegex.test(id)
}

// ==============================
// REQUEST VALIDATION
// ==============================

/**
 * Validate request body is not too large
 */
export async function validateRequestSize(
    request: NextRequest,
    maxSizeBytes: number = 1024 * 1024 // 1MB default
): Promise<boolean> {
    const contentLength = request.headers.get("content-length")

    if (contentLength && parseInt(contentLength) > maxSizeBytes) {
        return false
    }

    return true
}

/**
 * Validate Content-Type header
 */
export function validateContentType(
    request: NextRequest,
    allowedTypes: string[] = ["application/json"]
): boolean {
    const contentType = request.headers.get("content-type")

    if (!contentType) {
        return false
    }

    return allowedTypes.some(type => contentType.includes(type))
}

// ==============================
// RESPONSE SECURITY
// ==============================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set("X-Content-Type-Options", "nosniff")
    response.headers.set("X-Frame-Options", "DENY")
    response.headers.set("X-XSS-Protection", "1; mode=block")
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

    return response
}

/**
 * Create a secure JSON response
 */
export function secureJsonResponse(
    data: unknown,
    status: number = 200
): NextResponse {
    const response = NextResponse.json(data, { status })
    return addSecurityHeaders(response)
}

/**
 * Create an error response without exposing internal details
 */
export function secureErrorResponse(
    message: string,
    status: number = 500,
    internalError?: Error
): NextResponse {
    // Log internal error for debugging
    if (internalError && process.env.NODE_ENV === "development") {
        console.error("[INTERNAL ERROR]", internalError)
    }

    // Never expose internal error details to client
    const response = NextResponse.json(
        { error: message },
        { status }
    )

    return addSecurityHeaders(response)
}

// ==============================
// SESSION SECURITY
// ==============================

/**
 * Session expiration times (in seconds)
 */
export const SESSION_CONFIG = {
    // Default session duration (24 hours)
    defaultDuration: 24 * 60 * 60,

    // Remember me duration (30 days)
    rememberMeDuration: 30 * 24 * 60 * 60,

    // Session idle timeout (1 hour)
    idleTimeout: 60 * 60,

    // Refresh token before expiry (5 minutes)
    refreshThreshold: 5 * 60,
}

/**
 * Check if session is about to expire
 */
export function isSessionExpiringSoon(expiresAt: Date): boolean {
    const now = Date.now()
    const expiresTime = expiresAt.getTime()
    const threshold = SESSION_CONFIG.refreshThreshold * 1000

    return (expiresTime - now) < threshold
}

// ==============================
// IP BLOCKING
// ==============================

// Simple in-memory IP blocklist (use Redis in production)
const blockedIPs = new Set<string>()
const ipBlockExpiry = new Map<string, number>()

/**
 * Block an IP address temporarily
 */
export function blockIP(ip: string, durationMinutes: number = 15): void {
    blockedIPs.add(ip)
    ipBlockExpiry.set(ip, Date.now() + (durationMinutes * 60 * 1000))

    console.log(`[SECURITY] IP ${ip} blocked for ${durationMinutes} minutes`)
}

/**
 * Check if an IP is blocked
 */
export function isIPBlocked(ip: string): boolean {
    if (!blockedIPs.has(ip)) {
        return false
    }

    const expiry = ipBlockExpiry.get(ip)
    if (expiry && Date.now() > expiry) {
        // Block has expired
        blockedIPs.delete(ip)
        ipBlockExpiry.delete(ip)
        return false
    }

    return true
}

/**
 * Unblock an IP address
 */
export function unblockIP(ip: string): void {
    blockedIPs.delete(ip)
    ipBlockExpiry.delete(ip)
}

/**
 * Get list of blocked IPs (for admin)
 */
export function getBlockedIPs(): Array<{ ip: string; expiresAt: Date }> {
    const result: Array<{ ip: string; expiresAt: Date }> = []

    blockedIPs.forEach(ip => {
        const expiry = ipBlockExpiry.get(ip)
        if (expiry) {
            result.push({ ip, expiresAt: new Date(expiry) })
        }
    })

    return result
}
