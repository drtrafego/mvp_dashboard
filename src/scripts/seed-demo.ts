/**
 * Seed script: Creates "Teste Video" organization with COMPLETE demo data
 * Run: npx tsx src/scripts/seed-demo.ts
 * 
 * Populates: organizations, adAccountSettings, integrations,
 *            campaignMetrics (Meta + Google + GA4), 
 *            analyticsDimensions (OS/Device/Browser/Pages/Sources),
 *            leadAttribution (with utm_source p1/p2 for temperature, utmTerm, utmContent)
 */

import 'dotenv/config';
import { biDb } from "../server/db";
import { organizations, adAccountSettings, integrations, campaignMetrics, leadAttribution, analyticsDimensions, users } from "../server/db/schema";
import { eq } from "drizzle-orm";
import { subDays, format } from "date-fns";

const ORG_NAME = "Teste Video";
const ORG_SLUG = "teste-video";

// ============= CAMPAIGN DEFINITIONS =============

const META_CAMPAIGNS = [
    { id: "meta_camp_1", name: "🔥 Captação de Leads - São Paulo", adSet: "adset_sp_01", weight: 1.5 },
    { id: "meta_camp_2", name: "📈 Remarketing - Visitantes Site", adSet: "adset_rmkt_01", weight: 1.2 },
    { id: "meta_camp_3", name: "🎯 Lookalike 1% - Compradores", adSet: "adset_lk_01", weight: 1.0 },
    { id: "meta_camp_4", name: "📱 Stories - Oferta Black Friday", adSet: "adset_bf_01", weight: 0.8 },
    { id: "meta_camp_5", name: "💰 Conversão - Produto Premium", adSet: "adset_prem_01", weight: 1.0 },
];

const META_ADS = [
    { id: "ad_1", name: "Video Depoimento - João Silva" },
    { id: "ad_2", name: "Carrossel - 5 Benefícios" },
    { id: "ad_3", name: "Imagem Estática - Promoção 50%" },
    { id: "ad_4", name: "Reels - Antes e Depois" },
    { id: "ad_5", name: "Video UGC - Ana Reviews" },
];

const GOOGLE_CAMPAIGNS = [
    { id: "google_camp_1", name: "Busca - Palavras-chave Exatas", weight: 1.5 },
    { id: "google_camp_2", name: "Busca - Termos Amplos", weight: 1.0 },
    { id: "google_camp_3", name: "Display - Remarketing", weight: 0.8 },
    { id: "google_camp_4", name: "Performance Max - Conversões", weight: 1.3 },
    { id: "google_camp_5", name: "YouTube - Video Ads", weight: 0.9 },
];

const GA4_CAMPAIGNS = [
    { id: "ga4_organic", name: "Orgânico" },
    { id: "ga4_social", name: "Social / Referral" },
    { id: "ga4_direct", name: "Direto" },
    { id: "ga4_email", name: "Email Marketing" },
];

// ============= RANDOM HELPERS =============

function rand(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randFloat(min: number, max: number, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}
function trend(dayIdx: number, totalDays: number) {
    const progress = dayIdx / totalDays;
    return 0.7 + progress * 0.6 + Math.random() * 0.2;
}
function weekendFactor(date: Date) {
    const d = date.getDay();
    return (d === 0 || d === 6) ? 0.6 : 1.0;
}
function pick<T>(arr: T[]): T {
    return arr[rand(0, arr.length - 1)];
}

// ============= MAIN SEED =============

async function seed() {
    console.log("🌱 Starting seed for 'Teste Video'...\n");

    // 1. Clean existing data
    const existing = await biDb.select().from(organizations).where(eq(organizations.slug, ORG_SLUG));
    if (existing.length) {
        console.log("⚠️  Deleting old data...");
        const orgId = existing[0].id;
        await biDb.delete(analyticsDimensions).where(eq(analyticsDimensions.organizationId, orgId));
        await biDb.delete(leadAttribution).where(eq(leadAttribution.organizationId, orgId));
        await biDb.delete(campaignMetrics).where(eq(campaignMetrics.organizationId, orgId));
        await biDb.delete(integrations).where(eq(integrations.organizationId, orgId));
        await biDb.delete(adAccountSettings).where(eq(adAccountSettings.organizationId, orgId));
        // Unlink users from this org before deleting
        await biDb.update(users).set({ organizationId: null }).where(eq(users.organizationId, orgId));
        await biDb.delete(organizations).where(eq(organizations.id, orgId));
        console.log("✅ Old data deleted.\n");
    }

    // 2. Create Organization
    const [org] = await biDb.insert(organizations).values({
        name: ORG_NAME, slug: ORG_SLUG,
    }).returning();
    console.log(`✅ Organization: ${org.name} (${org.id})`);

    // 3. Ad Account Settings
    await biDb.insert(adAccountSettings).values({
        organizationId: org.id,
        googleAdsCustomerId: "123-456-7890",
        facebookAdAccountId: "act_1234567890",
        ga4PropertyId: "987654321",
        metaDashboardType: "lancamento",
    });
    console.log("✅ Ad Account Settings (lancamento)");

    // 4. Create Integrations (Meta + Google Ads + Google Analytics)
    const [metaInt] = await biDb.insert(integrations).values({
        organizationId: org.id, provider: "meta",
        providerAccountId: "act_1234567890", accessToken: "DEMO_TOKEN", refreshToken: "DEMO_REFRESH",
    }).returning();

    const [googleInt] = await biDb.insert(integrations).values({
        organizationId: org.id, provider: "google_ads",
        providerAccountId: "1234567890", accessToken: "DEMO_TOKEN", refreshToken: "DEMO_REFRESH",
    }).returning();

    const [ga4Int] = await biDb.insert(integrations).values({
        organizationId: org.id, provider: "google_analytics",
        providerAccountId: "987654321", accessToken: "DEMO_TOKEN", refreshToken: "DEMO_REFRESH",
    }).returning();

    console.log(`✅ Integrations: Meta(${metaInt.id}), Google(${googleInt.id}), GA4(${ga4Int.id})\n`);

    // ============= 5. CAMPAIGN METRICS =============
    const DAYS = 30;
    const today = new Date();
    const metricRows: any[] = [];

    for (let dayIdx = 0; dayIdx < DAYS; dayIdx++) {
        const date = subDays(today, DAYS - dayIdx - 1);
        const t = trend(dayIdx, DAYS);
        const wf = weekendFactor(date);

        // --- META ADS ---
        for (const camp of META_CAMPAIGNS) {
            const dailySpend = randFloat(25, 70) * camp.weight * wf * t;
            const impressions = Math.round(dailySpend * rand(15, 25) * t);
            const clicks = Math.round(impressions * randFloat(0.015, 0.04));
            const conversions = Math.round(clicks * randFloat(0.05, 0.15));
            const leads = Math.max(conversions, rand(1, Math.max(3, conversions + 2)));
            const videoViews3s = Math.round(impressions * randFloat(0.18, 0.35));
            const videoThruplays = Math.round(videoViews3s * randFloat(0.35, 0.6));
            const videoViews75 = Math.round(videoThruplays * randFloat(0.5, 0.8));
            const videoCompletes = Math.round(videoViews75 * randFloat(0.6, 0.9));
            const linkClicks = Math.round(clicks * randFloat(0.65, 0.9));
            const landingPageViews = Math.round(linkClicks * randFloat(0.75, 0.95));
            const ad = pick(META_ADS);

            metricRows.push({
                integrationId: metaInt.id, organizationId: org.id, date,
                campaignId: camp.id, campaignName: camp.name,
                adSetId: camp.adSet, adId: ad.id, adName: ad.name,
                impressions, clicks, spend: dailySpend.toFixed(2),
                conversions, leads,
                conversionValue: (conversions * randFloat(30, 80)).toFixed(2),
                ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0",
                cpc: clicks > 0 ? (dailySpend / clicks).toFixed(2) : "0",
                cpm: impressions > 0 ? ((dailySpend / impressions) * 1000).toFixed(2) : "0",
                cpa: conversions > 0 ? (dailySpend / conversions).toFixed(2) : "0",
                roas: randFloat(1.5, 4.5).toFixed(2),
                cvr: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : "0",
                hookRate: impressions > 0 ? ((videoViews3s / impressions) * 100).toFixed(2) : "0",
                holdRate: videoViews3s > 0 ? ((videoViews75 / videoViews3s) * 100).toFixed(2) : "0",
                videoViews3s, videoThruplays, videoViews75, videoCompletes,
                linkClicks, landingPageViews,
                frequency: randFloat(1.1, 2.8).toFixed(2),
                engagementRate: randFloat(2.0, 8.5).toFixed(2),
            });
        }

        // --- GOOGLE ADS ---
        for (const camp of GOOGLE_CAMPAIGNS) {
            const dailySpend = randFloat(18, 50) * camp.weight * wf * t;
            const impressions = Math.round(dailySpend * rand(10, 20) * t);
            const clicks = Math.round(impressions * randFloat(0.02, 0.06));
            const conversions = Math.round(clicks * randFloat(0.05, 0.14));

            metricRows.push({
                integrationId: googleInt.id, organizationId: org.id, date,
                campaignId: camp.id, campaignName: camp.name,
                impressions, clicks, spend: dailySpend.toFixed(2),
                conversions,
                conversionValue: (conversions * randFloat(25, 65)).toFixed(2),
                ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0",
                cpc: clicks > 0 ? (dailySpend / clicks).toFixed(2) : "0",
                cpa: conversions > 0 ? (dailySpend / conversions).toFixed(2) : "0",
                qualityScore: rand(5, 10),
                impressionShare: randFloat(40, 85).toFixed(2),
                impressionShareLostBudget: randFloat(5, 25).toFixed(2),
                impressionShareLostRank: randFloat(5, 20).toFixed(2),
            });
        }

        // --- GA4 (Google Analytics) ---
        for (const camp of GA4_CAMPAIGNS) {
            const sessions = Math.round(rand(40, 150) * t * wf);
            const activeUsers = Math.round(sessions * randFloat(0.65, 0.85));
            const newUsers = Math.round(activeUsers * randFloat(0.3, 0.55));
            const engagedSessions = Math.round(sessions * randFloat(0.45, 0.7));
            const conversions = Math.round(sessions * randFloat(0.02, 0.06));

            metricRows.push({
                integrationId: ga4Int.id, organizationId: org.id, date,
                campaignId: camp.id, campaignName: camp.name,
                sessions, activeUsers, newUsers, engagedSessions,
                conversions,
                averageSessionDuration: randFloat(60, 240).toFixed(2),
                avgEngagementTime: randFloat(30, 120).toFixed(2),
                bounceRate: randFloat(30, 60).toFixed(2),
                engagementRate2: engagedSessions > 0 ? ((engagedSessions / sessions) * 100).toFixed(2) : "0",
                impressions: 0, clicks: 0, spend: "0",
            });
        }
    }

    // Batch insert
    const BATCH = 100;
    let inserted = 0;
    for (let i = 0; i < metricRows.length; i += BATCH) {
        await biDb.insert(campaignMetrics).values(metricRows.slice(i, i + BATCH));
        inserted += Math.min(BATCH, metricRows.length - i);
    }
    console.log(`✅ ${inserted} campaign metrics (Meta + Google Ads + GA4)`);

    // ============= 6. ANALYTICS DIMENSIONS =============
    const dimRows: any[] = [];

    // OS
    const osSystems = [
        { name: "Android", pct: 0.42 }, { name: "iOS", pct: 0.33 },
        { name: "Windows", pct: 0.15 }, { name: "macOS", pct: 0.08 },
        { name: "Linux", pct: 0.02 },
    ];
    // Devices
    const devices = [
        { name: "mobile", pct: 0.65 }, { name: "desktop", pct: 0.28 }, { name: "tablet", pct: 0.07 },
    ];
    // Browsers
    const browsers = [
        { name: "Chrome", pct: 0.55 }, { name: "Safari", pct: 0.22 },
        { name: "Edge", pct: 0.10 }, { name: "Firefox", pct: 0.08 },
        { name: "Samsung Internet", pct: 0.05 },
    ];
    // Pages
    const pages = [
        { name: "/", pct: 0.30 }, { name: "/produto", pct: 0.20 },
        { name: "/checkout", pct: 0.12 }, { name: "/sobre", pct: 0.10 },
        { name: "/blog", pct: 0.08 }, { name: "/contato", pct: 0.07 },
        { name: "/faq", pct: 0.06 }, { name: "/termos", pct: 0.04 },
        { name: "/depoimentos", pct: 0.03 },
    ];
    // Sources
    const sources = [
        { name: "google", pct: 0.35 }, { name: "instagram", pct: 0.20 },
        { name: "facebook", pct: 0.15 }, { name: "(direct)", pct: 0.15 },
        { name: "youtube", pct: 0.08 }, { name: "email", pct: 0.05 },
        { name: "tiktok", pct: 0.02 },
    ];

    for (let dayIdx = 0; dayIdx < DAYS; dayIdx++) {
        const date = subDays(today, DAYS - dayIdx - 1);
        const t = trend(dayIdx, DAYS);
        const wf = weekendFactor(date);
        const baseSessions = Math.round(rand(300, 600) * t * wf);

        const makeDim = (type: string, items: { name: string; pct: number }[]) => {
            for (const item of items) {
                const sessions = Math.round(baseSessions * item.pct * randFloat(0.85, 1.15));
                const users = Math.round(sessions * randFloat(0.7, 0.9));
                const conversions = Math.round(sessions * randFloat(0.02, 0.05));
                dimRows.push({
                    organizationId: org.id, integrationId: ga4Int.id, date,
                    dimensionType: type, dimensionValue: item.name,
                    sessions, users, conversions,
                });
            }
        };

        makeDim("OS", osSystems);
        makeDim("DEVICE", devices);
        makeDim("BROWSER", browsers);
        makeDim("PAGE_PATH", pages);
        makeDim("SOURCE", sources);
    }

    for (let i = 0; i < dimRows.length; i += BATCH) {
        await biDb.insert(analyticsDimensions).values(dimRows.slice(i, i + BATCH));
    }
    console.log(`✅ ${dimRows.length} analytics dimensions (OS/Device/Browser/Pages/Sources)`);

    // ============= 7. LEAD ATTRIBUTION =============
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
        "Renata Campos", "Matheus Duarte", "Aline Freitas",
        "Pedro Henrique Barros", "Natália Lopes", "Victor Hugo Ramos",
    ];

    // UTM Sources with P1/P2 for temperature
    const utmSources = [
        { name: "p1_facebook", type: "p1" }, { name: "p1_instagram", type: "p1" },
        { name: "p1_google", type: "p1" }, { name: "p1_youtube", type: "p1" },
        { name: "p2_facebook", type: "p2" }, { name: "p2_instagram", type: "p2" },
        { name: "p2_whatsapp", type: "p2" }, { name: "p2_email", type: "p2" },
        { name: "google", type: "other" }, { name: "organic", type: "other" },
    ];

    // UTM Terms for keyword-level tracking
    const utmTerms = [
        "marketing digital", "trafego pago", "gestao de anuncios",
        "facebook ads", "google ads", "captação de leads",
        "meta ads", "retorno investimento", "roi marketing",
        "consultoria trafego", "agencia marketing", "anuncios online",
    ];

    // UTM Content (creative identifiers)
    const utmContents = [
        "video-depoimento-joao", "carrossel-beneficios-v2", "imagem-promo-50off",
        "reels-antes-depois", "ugc-ana-reviews", "story-oferta-flash",
        "video-tutorial-ads", "imagem-resultado-caso", "carrossel-perguntas",
        "video-bastidores", "banner-inscricao-curso", "imagem-urgencia-final",
    ];

    const utmMediums = ["cpc", "cpm", "social", "email", "referral"];
    const utmCampaigns = [
        "captacao-lancamento-jan", "remarketing-visitantes",
        "lookalike-compradores", "black-friday-2024",
        "produto-premium-v3", "webinar-fevereiro",
    ];

    const leadRows: any[] = [];
    const TOTAL_LEADS = 350; // Much more leads for better charts

    for (let i = 0; i < TOTAL_LEADS; i++) {
        const dayOffset = rand(0, DAYS - 1);
        const date = subDays(today, dayOffset);
        const utmSource = pick(utmSources);
        const source = utmSource.type === "other" ? utmSource.name : "meta";

        leadRows.push({
            organizationId: org.id,
            leadId: crypto.randomUUID(),
            leadName: pick(leadNames),
            campaignId: pick([...META_CAMPAIGNS, ...GOOGLE_CAMPAIGNS]).id,
            adId: pick(META_ADS).id,
            source: utmSource.name, // This is what launch-dashboard queries as utmSource
            medium: pick(utmMediums),
            utmCampaign: pick(utmCampaigns),
            utmTerm: pick(utmTerms),
            utmContent: pick(utmContents),
            cpaAtConversion: randFloat(15, 85).toFixed(2),
            roas: randFloat(1.2, 5.5).toFixed(2),
            conversionDate: date,
            firstTouch: subDays(date, rand(1, 7)),
            lastTouch: date,
        });
    }

    for (let i = 0; i < leadRows.length; i += BATCH) {
        await biDb.insert(leadAttribution).values(leadRows.slice(i, i + BATCH));
    }
    console.log(`✅ ${leadRows.length} lead attributions (with P1/P2 temperature, utmTerm, utmContent)\n`);

    // ============= SUMMARY =============
    const metaSpend = metricRows.filter(m => m.integrationId === metaInt.id).reduce((s, m) => s + parseFloat(m.spend), 0);
    const googleSpend = metricRows.filter(m => m.integrationId === googleInt.id).reduce((s, m) => s + parseFloat(m.spend), 0);
    const totalLeads = metricRows.filter(m => m.integrationId === metaInt.id).reduce((s, m) => s + (m.leads || 0), 0);
    const totalConversions = metricRows.reduce((s, m) => s + (m.conversions || 0), 0);
    const totalGA4Sessions = metricRows.filter(m => m.integrationId === ga4Int.id).reduce((s, m) => s + (m.sessions || 0), 0);

    // P1/P2 temperature breakdown
    const p1 = leadRows.filter(l => l.source.includes("p1")).length;
    const p2 = leadRows.filter(l => l.source.includes("p2")).length;
    const other = leadRows.filter(l => !l.source.includes("p1") && !l.source.includes("p2")).length;

    console.log("📊 Summary:");
    console.log(`   Meta Ads Spend:     R$ ${metaSpend.toFixed(2)}`);
    console.log(`   Google Ads Spend:   R$ ${googleSpend.toFixed(2)}`);
    console.log(`   Total Spend:        R$ ${(metaSpend + googleSpend).toFixed(2)}`);
    console.log(`   Total Leads (Meta): ${totalLeads}`);
    console.log(`   Total Conversions:  ${totalConversions}`);
    console.log(`   GA4 Sessions:       ${totalGA4Sessions}`);
    console.log(`   Leads Attribution:  ${leadRows.length}`);
    console.log(`   Temperature: P1(Frio)=${p1}, P2(Quente)=${p2}, Outros=${other}`);
    console.log(`   UTM Terms:          ${utmTerms.length} values`);
    console.log(`   UTM Content:        ${utmContents.length} creatives`);
    console.log(`\n✅ Seed complete! Switch to "Teste Video" in admin.`);

    process.exit(0);
}

seed().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
