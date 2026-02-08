import { pgTable, text, timestamp, uuid, integer, numeric, jsonb } from "drizzle-orm/pg-core";

// Organizations Table
export const organizations = pgTable("organizations", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").unique().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ad Account Settings Table - Linked to Organizations
export const adAccountSettings = pgTable("ad_account_settings", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull().unique(),

    // Google Ads Configuration
    googleAdsCustomerId: text("google_ads_customer_id"), // Format: 000-000-0000

    // Meta/Facebook Ads Configuration
    facebookAdAccountId: text("facebook_ad_account_id"), // Format: act_xxxxxxxx

    // Google Analytics 4 Configuration
    ga4PropertyId: text("ga4_property_id"), // GA4 Property ID

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users Table
export const users = pgTable("users", {
    id: text("id").primaryKey(), // Matches NextAuth user ID
    name: text("name"),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    image: text("image"),
    organizationId: uuid("organization_id").references(() => organizations.id),
    role: text("role").default("member"), // 'owner', 'admin', 'member'
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Integrations Table (Stores OAuth Tokens)
export const integrations = pgTable("integrations", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    provider: text("provider").notNull(), // 'google_ads', 'google_analytics', 'meta'
    providerAccountId: text("provider_account_id").notNull(),
    accessToken: text("access_token").notNull(), // Encrypted with AES-256
    refreshToken: text("refresh_token"), // Encrypted with AES-256
    expiresAt: timestamp("expires_at"),
    settings: jsonb("settings"), // Ad account IDs, container IDs, etc
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Campaign Metrics Table - UNIFIED DATA from Meta, Google, GA4
export const campaignMetrics = pgTable("campaign_metrics", {
    id: uuid("id").primaryKey().defaultRandom(),
    integrationId: uuid("integration_id").references(() => integrations.id).notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(), // MANDATORY for multi-tenancy
    date: timestamp("date").notNull(),

    // Campaign Identification
    campaignId: text("campaign_id"),
    campaignName: text("campaign_name"),
    adSetId: text("ad_set_id"),
    adId: text("ad_id"),
    adName: text("ad_name"), // Added missing column

    // Universal Metrics (All Platforms)
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),
    spend: numeric("spend", { precision: 12, scale: 2 }).default("0"), // Unified: Meta "spend" + Google "cost"
    conversions: integer("conversions").default(0),
    conversionValue: numeric("conversion_value", { precision: 12, scale: 2 }),

    // Calculated Performance Metrics
    ctr: numeric("ctr", { precision: 5, scale: 2 }), // Click-Through Rate
    cpc: numeric("cpc", { precision: 10, scale: 2 }), // Cost Per Click
    cpm: numeric("cpm", { precision: 10, scale: 2 }), // Cost Per Mille
    cpa: numeric("cpa", { precision: 10, scale: 2 }), // Cost Per Acquisition
    roas: numeric("roas", { precision: 10, scale: 2 }), // Return on Ad Spend (Meta)
    cvr: numeric("cvr", { precision: 5, scale: 2 }), // Conversion Rate (conversions / clicks)

    // Meta Ads - Video Creative Performance
    hookRate: numeric("hook_rate", { precision: 5, scale: 2 }), // 3s video views / impressions
    holdRate: numeric("hold_rate", { precision: 5, scale: 2 }), // 75%+ video views / 3s views
    videoViews3s: integer("video_views_3s"), // ThruPlay actions (3 seconds)
    videoViews75: integer("video_views_75"), // 75% video completion
    videoCompletes: integer("video_completes"), // 100% completion
    frequency: numeric("frequency", { precision: 5, scale: 2 }), // Avg impressions per user
    engagementRate: numeric("engagement_rate", { precision: 5, scale: 2 }), // Post engagements / impressions

    // Google Ads - Specific Metrics
    impressionShare: numeric("impression_share", { precision: 5, scale: 2 }), // Search impression share
    impressionShareLostBudget: numeric("impression_share_lost_budget", { precision: 5, scale: 2 }), // Lost due to budget
    impressionShareLostRank: numeric("impression_share_lost_rank", { precision: 5, scale: 2 }), // Lost due to rank
    qualityScore: integer("quality_score"), // 1-10 quality score

    // GA4 - Engagement Metrics
    activeUsers: integer("active_users"),
    sessions: integer("sessions"),
    engagedSessions: integer("engaged_sessions"), // Sessions with engagement
    averageSessionDuration: numeric("avg_session_duration", { precision: 10, scale: 2 }),
    avgEngagementTime: numeric("avg_engagement_time", { precision: 10, scale: 2 }), // Time engaged per session
    bounceRate: numeric("bounce_rate", { precision: 5, scale: 2 }),
    engagementRate2: numeric("engagement_rate_ga4", { precision: 5, scale: 2 }), // Engaged sessions / sessions

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// NextAuth.js Tables
export const accounts = pgTable("account", {
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
});

export const sessions = pgTable("session", {
    sessionToken: text("sessionToken").primaryKey(),
    userId: text("userId")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable("verificationToken", {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
});

// AI Creative Insights Table
export const aiCreativeInsights = pgTable("ai_creative_insights", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    externalAdId: text("external_ad_id").notNull(), // ID from Meta/Google
    analysisDate: timestamp("analysis_date").defaultNow(),

    // Technical Metrics (Input)
    hookRate: numeric("hook_rate"), // 3-sec views / impressions
    holdRate: numeric("hold_rate"), // thruplays / impressions
    ctr: numeric("ctr"),
    cpa: numeric("cpa"), // Cost per acquisition
    roas: numeric("roas"), // Return on ad spend

    // AI Output
    performancePrediction: text("performance_prediction"), // 'High', 'Medium', 'Low'
    recommendation: text("recommendation").notNull(),
    creativeAnalysis: jsonb("creative_analysis"), // Tags: "UGC", "Static", correlation data
    confidenceScore: numeric("confidence_score"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// System Logs for Debugging Integrations
export const systemLogs = pgTable("system_logs", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id),
    level: text("level").notNull(), // 'INFO', 'ERROR', 'WARN'
    component: text("component").notNull(), // 'META_ADS', 'GOOGLE_ADS', 'SYSTEM'
    message: text("message").notNull(),
    details: jsonb("details"), // Error stack, API response, etc
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Lead Attribution Table - Correlates CRM leads with BI campaigns
export const leadAttribution = pgTable("lead_attribution", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),

    // References
    leadId: uuid("lead_id").notNull(), // ID from CRM database
    campaignId: text("campaign_id").notNull(),
    adId: text("ad_id"),
    adSetId: text("ad_set_id"),

    // Attribution Data
    source: text("source"), // 'meta', 'google', 'organic'
    medium: text("medium"),
    utmCampaign: text("utm_campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),

    // Metrics at Conversion Time
    cpaAtConversion: numeric("cpa_at_conversion", { precision: 10, scale: 2 }),
    roas: numeric("roas", { precision: 10, scale: 2 }),

    // Customer Journey (Touchpoints)
    touchpoints: jsonb("touchpoints"), // Array of interactions before conversion

    // Timestamps
    firstTouch: timestamp("first_touch"),
    lastTouch: timestamp("last_touch"),
    conversionDate: timestamp("conversion_date").notNull(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Invitations Table
export const invitations = pgTable("invitations", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    role: text("role").default("member"), // 'admin', 'member'
    status: text("status").default("pending"), // 'pending', 'accepted'
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

// GA4 Dimensions Table (City, OS, Device, Page)
export const analyticsDimensions = pgTable("analytics_dimensions", {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
    integrationId: uuid("integration_id").references(() => integrations.id).notNull(),
    date: timestamp("date").notNull(),

    dimensionType: text("dimension_type").notNull(), // 'CITY', 'REGION', 'DEVICE', 'OS', 'PAGE_PATH', 'SOURCE'
    dimensionValue: text("dimension_value").notNull(), // 'São Paulo', 'Mobile', '/home', 'google'

    sessions: integer("sessions").default(0),
    users: integer("users").default(0),
    conversions: integer("conversions").default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
});
