/**
 * Audit Logging System
 * 
 * Logs critical actions for security monitoring and compliance.
 * In production, these logs should be sent to a centralized logging service
 * like Datadog, Logtail, or AWS CloudWatch.
 */

export interface AuditLogEntry {
    timestamp: string
    action: AuditAction
    userId: string
    userEmail: string
    organizationId: string | null
    resourceType: ResourceType
    resourceId: string | null
    details: Record<string, unknown>
    ipAddress: string
    userAgent: string
    success: boolean
    errorMessage?: string
}

export type AuditAction =
    | "LOGIN"
    | "LOGOUT"
    | "LOGIN_FAILED"
    | "USER_CREATED"
    | "USER_DELETED"
    | "USER_ROLE_CHANGED"
    | "PRODUCT_CREATED"
    | "PRODUCT_UPDATED"
    | "PRODUCT_DELETED"
    | "CATEGORY_CREATED"
    | "CATEGORY_DELETED"
    | "STOCK_UPDATED"
    | "SETTINGS_CHANGED"
    | "ORGANIZATION_CREATED"
    | "ORGANIZATION_UPDATED"
    | "TECHNICAL_SHEET_CREATED"
    | "TECHNICAL_SHEET_DELETED"
    | "PURCHASE_REQUEST_CREATED"
    | "PURCHASE_REQUEST_SENT"
    | "DATA_EXPORT"
    | "RATE_LIMIT_EXCEEDED"
    | "UNAUTHORIZED_ACCESS_ATTEMPT"
    | "SUSPICIOUS_ACTIVITY"

export type ResourceType =
    | "user"
    | "product"
    | "category"
    | "stock"
    | "settings"
    | "organization"
    | "technical_sheet"
    | "purchase_request"
    | "auth"

// In-memory log buffer (for development)
// In production, replace with proper logging service
const auditLogBuffer: AuditLogEntry[] = []
const MAX_BUFFER_SIZE = 1000

/**
 * Log an audit entry
 */
export function logAudit(entry: Omit<AuditLogEntry, "timestamp">): void {
    const fullEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString()
    }

    // Add to buffer (circular buffer)
    if (auditLogBuffer.length >= MAX_BUFFER_SIZE) {
        auditLogBuffer.shift()
    }
    auditLogBuffer.push(fullEntry)

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
        const icon = fullEntry.success ? "✓" : "✗"
        console.log(
            `[AUDIT ${icon}] ${fullEntry.action} by ${fullEntry.userEmail} on ${fullEntry.resourceType}${fullEntry.resourceId ? `/${fullEntry.resourceId}` : ""}`
        )
    }

    // In production, send to external logging service
    if (process.env.NODE_ENV === "production") {
        sendToLoggingService(fullEntry)
    }
}

/**
 * Log a security event (failed auth, rate limit, etc.)
 */
export function logSecurityEvent(
    action: "LOGIN_FAILED" | "RATE_LIMIT_EXCEEDED" | "UNAUTHORIZED_ACCESS_ATTEMPT" | "SUSPICIOUS_ACTIVITY",
    details: {
        ipAddress: string
        userAgent: string
        email?: string
        reason: string
        endpoint?: string
    }
): void {
    logAudit({
        action,
        userId: "unknown",
        userEmail: details.email || "unknown",
        organizationId: null,
        resourceType: "auth",
        resourceId: null,
        details: {
            reason: details.reason,
            endpoint: details.endpoint
        },
        ipAddress: details.ipAddress,
        userAgent: details.userAgent,
        success: false,
        errorMessage: details.reason
    })
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export function getRecentAuditLogs(limit: number = 100): AuditLogEntry[] {
    return auditLogBuffer.slice(-limit).reverse()
}

/**
 * Get security events (failed logins, rate limits, etc.)
 */
export function getSecurityEvents(hoursBack: number = 24): AuditLogEntry[] {
    const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000)
    const securityActions: AuditAction[] = [
        "LOGIN_FAILED",
        "RATE_LIMIT_EXCEEDED",
        "UNAUTHORIZED_ACCESS_ATTEMPT",
        "SUSPICIOUS_ACTIVITY"
    ]

    return auditLogBuffer
        .filter(entry => {
            const entryTime = new Date(entry.timestamp).getTime()
            return entryTime > cutoff && securityActions.includes(entry.action)
        })
        .reverse()
}

/**
 * Check for suspicious patterns
 */
export function detectSuspiciousActivity(ipAddress: string): {
    suspicious: boolean
    reason?: string
} {
    const recentLogs = auditLogBuffer.filter(entry => {
        const entryTime = new Date(entry.timestamp).getTime()
        const fiveMinutesAgo = Date.now() - (5 * 60 * 1000)
        return entry.ipAddress === ipAddress && entryTime > fiveMinutesAgo
    })

    // Check for multiple failed logins
    const failedLogins = recentLogs.filter(e => e.action === "LOGIN_FAILED").length
    if (failedLogins >= 5) {
        return { suspicious: true, reason: "Multiple failed login attempts" }
    }

    // Check for rate limit hits
    const rateLimits = recentLogs.filter(e => e.action === "RATE_LIMIT_EXCEEDED").length
    if (rateLimits >= 3) {
        return { suspicious: true, reason: "Multiple rate limit violations" }
    }

    // Check for unauthorized access attempts
    const unauthorized = recentLogs.filter(e => e.action === "UNAUTHORIZED_ACCESS_ATTEMPT").length
    if (unauthorized >= 3) {
        return { suspicious: true, reason: "Multiple unauthorized access attempts" }
    }

    return { suspicious: false }
}

/**
 * Placeholder for production logging service
 */
async function sendToLoggingService(entry: AuditLogEntry): Promise<void> {
    // Implement integration with your preferred logging service:
    // - Datadog: https://docs.datadoghq.com/logs/
    // - Logtail: https://betterstack.com/logtail
    // - AWS CloudWatch: https://aws.amazon.com/cloudwatch/
    // - Sentry: https://sentry.io

    // Example with Logtail:
    // await fetch("https://in.logtail.com", {
    //     method: "POST",
    //     headers: {
    //         "Content-Type": "application/json",
    //         "Authorization": `Bearer ${process.env.LOGTAIL_TOKEN}`
    //     },
    //     body: JSON.stringify(entry)
    // })

    // For now, just log to console in production too
    console.log("[AUDIT]", JSON.stringify(entry))
}

/**
 * Helper to extract request metadata
 */
export function getRequestMetadata(request: Request): {
    ipAddress: string
    userAgent: string
} {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const realIp = request.headers.get("x-real-ip")
    const ipAddress = forwardedFor?.split(",")[0].trim() || realIp || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    return { ipAddress, userAgent }
}
