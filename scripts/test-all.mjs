// Complete test for all integrations
// Run with: node scripts/test-all.mjs

const META_ACCESS_TOKEN = "EAANCYW8PaTQBQWzye2CR2hLTZBJ68EZCDMyOPCu22JGE03XM34yg34NlckIlrit3AGAbO8Yw4JsbiucnOLdoKjLaeP8DZCQ0thJOWIiq37MLXLZAEHYHlGbmbwfF0duYzT7rKbjYGfNNsp3jdtpqvHt2ZCk7YnUxXF9P9ZCdsF0Uo2ALL0Y2cjl4iUw9OzF1U21AZDZD";
const META_AD_ACCOUNT_ID = "act_663136558021878";

console.log("\n===========================================");
console.log("🔍 TESTE COMPLETO DE INTEGRAÇÕES");
console.log("===========================================\n");

// ========================================
// 1. META ADS - INSIGHTS TEST
// ========================================
async function testMetaInsights() {
    console.log("📘 1. META ADS - INSIGHTS (120 dias)\n");

    // Calculate date range (120 days)
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 120);

    const since = startDate.toISOString().split('T')[0];
    const until = endDate.toISOString().split('T')[0];

    console.log(`   📅 Período: ${since} até ${until}\n`);

    // First, get campaigns with basic stats
    const campaignsUrl = `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/campaigns?access_token=${META_ACCESS_TOKEN}&fields=name,status,effective_status,insights.date_preset(last_90d){spend,impressions,clicks}`;

    console.log("   🔄 Buscando campanhas com insights...\n");

    const campaignsResp = await fetch(campaignsUrl);
    const campaignsData = await campaignsResp.json();

    if (campaignsData.error) {
        console.log(`   ❌ Erro: ${campaignsData.error.message}`);
        console.log(`   Código: ${campaignsData.error.code}`);
        return;
    }

    if (campaignsData.data?.length > 0) {
        console.log(`   ✅ Encontradas ${campaignsData.data.length} campanhas:\n`);

        let totalSpend = 0;
        let totalImpressions = 0;
        let totalClicks = 0;

        for (const c of campaignsData.data) {
            const insights = c.insights?.data?.[0] || {};
            const spend = parseFloat(insights.spend) || 0;
            const impressions = parseInt(insights.impressions) || 0;
            const clicks = parseInt(insights.clicks) || 0;

            totalSpend += spend;
            totalImpressions += impressions;
            totalClicks += clicks;

            console.log(`   📊 ${c.name}`);
            console.log(`      Status: ${c.effective_status}`);
            console.log(`      Spend: R$ ${spend.toFixed(2)} | Impressions: ${impressions} | Clicks: ${clicks}`);
            console.log("");
        }

        console.log("   ─────────────────────────────────────");
        console.log(`   💰 TOTAL: R$ ${totalSpend.toFixed(2)} | ${totalImpressions} impressões | ${totalClicks} cliques`);
        console.log("   ─────────────────────────────────────\n");

        if (totalSpend === 0 && totalImpressions === 0) {
            console.log("   ⚠️ ATENÇÃO: Todas as campanhas estão PAUSED sem spend recente.");
            console.log("   ℹ️ A API retorna 0 registros porque não há métricas a reportar.\n");
        }
    } else {
        console.log("   ⚠️ Nenhuma campanha encontrada");
    }

    // Now try account-level insights
    console.log("\n   🔄 Buscando insights agregados da conta (últimos 90 dias)...\n");

    const insightsUrl = `https://graph.facebook.com/v18.0/${META_AD_ACCOUNT_ID}/insights?access_token=${META_ACCESS_TOKEN}&date_preset=last_90d&fields=spend,impressions,clicks,cpc,cpm,ctr&level=account`;
    const insightsResp = await fetch(insightsUrl);
    const insightsData = await insightsResp.json();

    if (insightsData.data?.length > 0) {
        const ins = insightsData.data[0];
        console.log(`   ✅ Insights da Conta:`);
        console.log(`      Spend: R$ ${ins.spend}`);
        console.log(`      Impressions: ${ins.impressions}`);
        console.log(`      Clicks: ${ins.clicks}`);
        console.log(`      CTR: ${ins.ctr}%`);
    } else {
        console.log("   ⚠️ Sem dados de insights (campanhas pausadas = sem métricas)");
    }
}

// ========================================
// 2. GOOGLE ADS TEST
// ========================================
async function testGoogleAds() {
    console.log("\n\n📈 2. GOOGLE ADS\n");

    const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

    if (!GOOGLE_ADS_DEVELOPER_TOKEN) {
        console.log("   ❌ GOOGLE_ADS_DEVELOPER_TOKEN não encontrado no .env");
        console.log("   ℹ️ Precisa rodar este script com as variáveis carregadas.");
        console.log("   ℹ️ O teste real precisa de OAuth (token do usuário logado).");
        return;
    }

    console.log(`   ✅ Developer Token: ${GOOGLE_ADS_DEVELOPER_TOKEN.substring(0, 10)}...`);
    console.log("   ℹ️ Google Ads API requer OAuth do usuário para acessar dados.");
    console.log("   ℹ️ Para testar: faça login no sistema e clique 'Testar' em Configurações.");
}

// ========================================
// 3. GOOGLE ANALYTICS 4 TEST
// ========================================
async function testGA4() {
    console.log("\n\n📊 3. GOOGLE ANALYTICS 4\n");

    console.log("   ℹ️ GA4 Data API requer OAuth do usuário.");
    console.log("   ℹ️ O token é capturado quando você faz login com Google no sistema.");
    console.log("   ℹ️ Para testar: faça login e clique 'Testar' em Configurações.");
    console.log("\n   📋 Checklist:");
    console.log("   ✅ API habilitada (você confirmou)");
    console.log("   ⚠️ Precisa fazer logout e login novamente para capturar novo token");
}

// Run all tests
async function runAll() {
    await testMetaInsights();
    await testGoogleAds();
    await testGA4();

    console.log("\n\n===========================================");
    console.log("✅ TESTES CONCLUÍDOS");
    console.log("===========================================\n");
}

runAll();
