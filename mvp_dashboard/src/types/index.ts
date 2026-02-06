export interface Organization {
    id: string;
    name: string;
    slug: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    name?: string;
    email: string;
    emailVerified?: Date;
    image?: string;
    organizationId?: string;
    role?: string;
    createdAt: Date;
}

export interface Integration {
    id: string;
    organizationId: string;
    provider: 'google_ads' | 'google_analytics' | 'meta';
    providerAccountId: string;
    accessToken: string; // Encrypted
    refreshToken?: string; // Encrypted
    expiresAt?: Date;
    settings?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}

export interface CampaignMetrics {
    id: string;
    integrationId: string;
    date: Date;
    impressions?: number;
    clicks?: number;
    spend?: string;
    conversions?: number;
    campaignName?: string;
    campaignId?: string;
    createdAt: Date;
}

export interface AICreativeInsight {
    id: string;
    organizationId: string;
    externalAdId: string;
    analysisDate?: Date;
    hookRate?: string;
    holdRate?: string;
    ctr?: string;
    performancePrediction?: 'High' | 'Medium' | 'Low';
    recommendation: string;
    creativeAnalysis?: Record<string, any>;
    confidenceScore?: string;
    createdAt: Date;
}
