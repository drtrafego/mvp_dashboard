/**
 * Seed script: Creates "Teste Video" organization with complete demo data
 * Run: npx tsx src/scripts/seed-demo.ts
 */

import 'dotenv/config';
import { biDb } from "../server/db";
import { organizations, adAccountSettings, integrations, campaignMetrics, leadAttribution } from "../server/db/schema";
import { eq } from "drizzle-orm";
import { subDays, format, addDays } from "date-fns";

const ORG_NAME = "Teste Video";
const ORG_SLUG = "teste-video";

// Realistic Brazilian campaign names
const META_CAMPAIGNS = [
    { id: "meta_camp_1", name: "🔥 Captação de Leads - São Paulo", adSet: "adset_sp_01" },
    { id: "meta_camp_2", name: "📈 Remarketing - Visitantes Site", adSet: "adset_rmkt_01" },
    { id: "meta_camp_3", name: "🎯 Lookalike 1% - Compradores", adSet: "adset_lk_01" },
    { id: "meta_camp_4", name: "📱 Stories - Oferta Black Friday", adSet: "adset_bf_01" },
    { id: "meta_camp_5", name: "💰 Conversão - Produto Premium", adSet: "adset_prem_01" },
];

const META_ADS = [
    { id: "ad_1", name: "Video Depoimento - João Silva" },
    { id: "ad_2", name: "Carrossel - 5 Benefícios" },
    { id: "ad_3", name: "Imagem Estática - Promoção 50%" },
    { id: "ad_4", name: "Reels - Antes e Depois" },
    { id: "ad_5", name: "Video UGC - Ana Reviews" },
];

const GOOGLE_CAMPAIGNS = [
    { id: "google_camp_1", name: "Busca - Palavras-chave Exatas" },
    { id: "google_camp_2", name: "Busca - Termos Amplos" },
    { id: "google_camp_3", name: "Display - Remarketing" },
    { id: "google_camp_4", name: "Performance Max - Conversões" },
    { id: "google_camp_5", name: "YouTube - Video Ads" },
];

// Random helpers
function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Growth trend: data improves slightly over time (for nice charts)
function trendMultiplier(dayIndex: number, totalDays: number) {
    const progress = dayIndex / totalDays;
    return 0.7 + progress * 0.6 + Math.random() * 0.2; // 0.7 to 1.5 with random noise
}

async function seed() {
    console.log("🌱 Starting seed for 'Teste Video'...\n");

    // 1. Check if org already exists
    const existing = await biDb.select().from(organizations).where(eq(organizations.slug, ORG_SLUG));
    if (existing.length) {
        console.log("⚠️  Organization already exists. Deleting old data...");
        const orgId = existing[0].id;
        // Clean up in order
        await biDb.delete(leadAttribution).where(eq(leadAttribution.organizationId, orgId));
        await biDb.delete(campaignMetrics).where(eq(campaignMetrics.organizationId, orgId));
        await biDb.delete(integrations).where(eq(integrations.organizationId, orgId));
        await biDb.delete(adAccountSettings).where(eq(adAccountSettings.organizationId, orgId));
        await biDb.delete(organizations).where(eq(organizations.id, orgId));
        console.log("✅ Old data deleted.\n");
    }

    // 2. Create Organization
    const [org] = await biDb.insert(organizations).values({
        name: ORG_NAME,
        slug: ORG_SLUG,
    }).returning();
    console.log(`✅ Organization created: ${org.name} (${org.id})\n`);

    // 3. Create Ad Account Settings
    await biDb.insert(adAccountSettings).values({
        organizationId: org.id,
        googleAdsCustomerId: "123-456-7890",
        facebookAdAccountId: "act_1234567890",
        ga4PropertyId: "987654321",
        metaDashboardType: "captacao",
    });
    console.log("✅ Ad Account Settings created\n");

    // 4. Create Integrations
    const [metaIntegration] = await biDb.insert(integrations).values({
        organizationId: org.id,
        provider: "meta",
        providerAccountId: "act_1234567890",
        accessToken: "DEMO_TOKEN",
        refreshToken: "DEMO_REFRESH",
    }).returning();
    console.log(`✅ Meta Integration created (${metaIntegration.id})`);

    const [googleIntegration] = await biDb.insert(integrations).values({
        organizationId: org.id,
        provider: "google_ads",
        providerAccountId: "1234567890",
        accessToken: "DEMO_TOKEN",
        refreshToken: "DEMO_REFRESH",
    }).returning();
    console.log(`✅ Google Ads Integration created (${googleIntegration.id})\n`);

    // 5. Generate Campaign Metrics - 30 days
    const DAYS = 30;
    const today = new Date();
    const metricValues: any[] = [];

    // Total budget ranges (daily)
    const META_DAILY_BUDGET = { min: 150, max: 350 }; // R$ per day total across campaigns
    const GOOGLE_DAILY_BUDGET = { min: 100, max: 250 };

    for (let dayIdx = 0; dayIdx < DAYS; dayIdx++) {
        const date = subDays(today, DAYS - dayIdx - 1);
        const trend = trendMultiplier(dayIdx, DAYS);

        // Weekend effect: lower spend
        const dayOfWeek = date.getDay();
        const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.6 : 1.0;

        // --- META ADS ---
        for (const camp of META_CAMPAIGNS) {
            const campWeight = camp.id === "meta_camp_1" ? 1.5 : camp.id === "meta_camp_2" ? 1.2 : 1.0;
            const dailySpend = randFloat(
                META_DAILY_BUDGET.min / META_CAMPAIGNS.length * campWeight * weekendFactor,
                META_DAILY_BUDGET.max / META_CAMPAIGNS.length * campWeight * weekendFactor
            ) * trend;

            const impressions = Math.round(dailySpend * rand(15, 25) * trend);
            const clicks = Math.round(impressions * randFloat(0.01, 0.04));
            const conversions = Math.round(clicks * randFloat(0.03, 0.12));
            const leads = Math.round(conversions * randFloat(0.5, 1.0));
            const videoViews3s = Math.round(impressions * randFloat(0.15, 0.35));
            const videoThruplays = Math.round(videoViews3s * randFloat(0.3, 0.6));
            const videoViews75 = Math.round(videoThruplays * randFloat(0.5, 0.8));
            const videoCompletes = Math.round(videoViews75 * randFloat(0.6, 0.9));
            const linkClicks = Math.round(clicks * randFloat(0.6, 0.9));
            const landingPageViews = Math.round(linkClicks * randFloat(0.7, 0.95));

            // Pick a random ad
            const ad = META_ADS[rand(0, META_ADS.length - 1)];

            metricValues.push({
                integrationId: metaIntegration.id,
                organizationId: org.id,
                date: date,
                campaignId: camp.id,
                campaignName: camp.name,
                adSetId: camp.adSet,
                adId: ad.id,
                adName: ad.name,
                impressions,
                clicks,
                spend: dailySpend.toFixed(2),
                conversions,
                leads,
                conversionValue: (conversions * randFloat(30, 80)).toFixed(2),
                ctr: clicks > 0 && impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0",
                cpc: clicks > 0 ? (dailySpend / clicks).toFixed(2) : "0",
                cpm: impressions > 0 ? ((dailySpend / impressions) * 1000).toFixed(2) : "0",
                cpa: conversions > 0 ? (dailySpend / conversions).toFixed(2) : "0",
                roas: conversions > 0 ? randFloat(1.5, 4.5).toFixed(2) : "0",
                cvr: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : "0",
                hookRate: impressions > 0 ? ((videoViews3s / impressions) * 100).toFixed(2) : "0",
                holdRate: videoViews3s > 0 ? ((videoViews75 / videoViews3s) * 100).toFixed(2) : "0",
                videoViews3s,
                videoThruplays,
                videoViews75,
                videoCompletes,
                linkClicks,
                landingPageViews,
                frequency: randFloat(1.1, 2.8).toFixed(2),
                engagementRate: randFloat(2.0, 8.5).toFixed(2),
            });
        }

        // --- GOOGLE ADS ---
        for (const camp of GOOGLE_CAMPAIGNS) {
            const campWeight = camp.id === "google_camp_1" ? 1.5 : camp.id === "google_camp_4" ? 1.3 : 1.0;
            const dailySpend = randFloat(
                GOOGLE_DAILY_BUDGET.min / GOOGLE_CAMPAIGNS.length * campWeight * weekendFactor,
                GOOGLE_DAILY_BUDGET.max / GOOGLE_CAMPAIGNS.length * campWeight * weekendFactor
            ) * trend;

            const impressions = Math.round(dailySpend * rand(10, 20) * trend);
            const clicks = Math.round(impressions * randFloat(0.02, 0.06));
            const conversions = Math.round(clicks * randFloat(0.04, 0.14));

            metricValues.push({
                integrationId: googleIntegration.id,
                organizationId: org.id,
                date: date,
                campaignId: camp.id,
                campaignName: camp.name,
                impressions,
                clicks,
                spend: dailySpend.toFixed(2),
                conversions,
                conversionValue: (conversions * randFloat(25, 65)).toFixed(2),
                ctr: clicks > 0 && impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0",
                cpc: clicks > 0 ? (dailySpend / clicks).toFixed(2) : "0",
                cpa: conversions > 0 ? (dailySpend / conversions).toFixed(2) : "0",
                qualityScore: rand(5, 10),
                impressionShare: randFloat(40, 85).toFixed(2),
                impressionShareLostBudget: randFloat(5, 25).toFixed(2),
                impressionShareLostRank: randFloat(5, 20).toFixed(2),
            });
        }
    }

    // Batch insert metrics
    const BATCH_SIZE = 100;
    let inserted = 0;
    for (let i = 0; i < metricValues.length; i += BATCH_SIZE) {
        const batch = metricValues.slice(i, i + BATCH_SIZE);
        await biDb.insert(campaignMetrics).values(batch);
        inserted += batch.length;
    }
    console.log(`✅ ${inserted} campaign metrics inserted (${DAYS} days x ${META_CAMPAIGNS.length + GOOGLE_CAMPAIGNS.length} campaigns)\n`);

    // 6. Generate Lead Attribution Data
    const leadNames = [
        "Ana Paula Silva", "Carlos Eduardo Santos", "Maria Fernanda Lima",
        "João Pedro Oliveira", "Beatriz Costa", "Rafael Almeida",
        "Isabela Rodrigues", "Lucas Mendes", "Juliana Nascimento",
        "Gustavo Carvalho", "Larissa Souza", "Thiago Pereira",
        "Camila Araújo", "Felipe Barbosa", "Mariana Gomes",
        "Bruno Ribeiro", "Amanda Martins", "Diego Ferreira",
        "Patrícia Castro", "Rodrigo Moreira", "Vanessa Dias",
        "André Correia", "Carolina Neves", "Eduardo Pinto",
        "Fernanda Teixeira", "Gabriel Rezende", "Helena Cardoso",
        "Igor Monteiro", "Julia Machado", "Leonardo Vieira",
    ];

    const leadValues: any[] = [];
    const sources = ["meta", "google", "organic"];

    for (let i = 0; i < 120; i++) {
        const dayOffset = rand(0, DAYS - 1);
        const date = subDays(today, dayOffset);
        const source = sources[rand(0, 2)];
        const campaign = source === "meta"
            ? META_CAMPAIGNS[rand(0, META_CAMPAIGNS.length - 1)]
            : source === "google"
                ? GOOGLE_CAMPAIGNS[rand(0, GOOGLE_CAMPAIGNS.length - 1)]
                : { id: "organic", name: "Orgânico" };

        leadValues.push({
            organizationId: org.id,
            leadId: crypto.randomUUID(),
            leadName: leadNames[rand(0, leadNames.length - 1)],
            campaignId: campaign.id,
            adId: source === "meta" ? META_ADS[rand(0, META_ADS.length - 1)].id : undefined,
            source,
            medium: source === "organic" ? "search" : "cpc",
            utmCampaign: campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            cpaAtConversion: randFloat(15, 85).toFixed(2),
            roas: randFloat(1.2, 5.5).toFixed(2),
            conversionDate: date,
            firstTouch: subDays(date, rand(1, 7)),
            lastTouch: date,
        });
    }

    for (let i = 0; i < leadValues.length; i += BATCH_SIZE) {
        const batch = leadValues.slice(i, i + BATCH_SIZE);
        await biDb.insert(leadAttribution).values(batch);
    }
    console.log(`✅ ${leadValues.length} lead attributions inserted\n`);

    // Summary
    const totalMetaSpend = metricValues
        .filter(m => m.integrationId === metaIntegration.id)
        .reduce((sum, m) => sum + parseFloat(m.spend), 0);
    const totalGoogleSpend = metricValues
        .filter(m => m.integrationId === googleIntegration.id)
        .reduce((sum, m) => sum + parseFloat(m.spend), 0);
    const totalLeads = metricValues.reduce((sum, m) => sum + (m.leads || 0), 0);
    const totalConversions = metricValues.reduce((sum, m) => sum + (m.conversions || 0), 0);

    console.log("📊 Summary:");
    console.log(`   Meta Ads Spend:   R$ ${totalMetaSpend.toFixed(2)}`);
    console.log(`   Google Ads Spend: R$ ${totalGoogleSpend.toFixed(2)}`);
    console.log(`   Total Spend:      R$ ${(totalMetaSpend + totalGoogleSpend).toFixed(2)}`);
    console.log(`   Total Leads:      ${totalLeads}`);
    console.log(`   Total Conversions: ${totalConversions}`);
    console.log(`\n✅ Seed complete! Switch to "Teste Video" in the admin panel.`);

    process.exit(0);
}

seed().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
