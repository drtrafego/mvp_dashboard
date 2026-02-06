// Test script for all integrations
// Run with: npx tsx scripts/test-integrations.ts

import { config } from "dotenv";
config();

console.log("\n===========================================");
console.log("🔍 TESTE DE INTEGRAÇÕES - HyperDash");
console.log("===========================================\n");

// 1. Check Environment Variables
console.log("📋 1. VERIFICANDO VARIÁVEIS DE AMBIENTE\n");

const envVars = {
    "GOOGLE_CLIENT_ID": process.env.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": process.env.GOOGLE_CLIENT_SECRET,
    "GOOGLE_ADS_DEVELOPER_TOKEN": process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    "META_ACCESS_TOKEN": process.env.META_ACCESS_TOKEN,
    "META_APP_ID": process.env.META_APP_ID,
};

for (const [key, value] of Object.entries(envVars)) {
    if (value) {
        console.log(`  ✅ ${key}: ${value.substring(0, 20)}...`);
    } else {
        console.log(`  ❌ ${key}: NÃO CONFIGURADO`);
    }
}

// 2. Test Meta Ads Connection
console.log("\n\n📘 2. TESTANDO META ADS\n");

async function testMetaAds() {
    const token = process.env.META_ACCESS_TOKEN;
    if (!token) {
        console.log("  ❌ META_ACCESS_TOKEN não configurado");
        return;
    }

    try {
        // Test token validity
        const tokenDebugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${token}&access_token=${token}`;
        const tokenResp = await fetch(tokenDebugUrl);
        const tokenData = await tokenResp.json();

        if (tokenData.data) {
            console.log("  ✅ Token válido!");
            console.log(`     - App ID: ${tokenData.data.app_id}`);
            console.log(`     - Tipo: ${tokenData.data.type}`);
            console.log(`     - Expira: ${tokenData.data.expires_at === 0 ? 'Nunca (permanente)' : new Date(tokenData.data.expires_at * 1000).toLocaleDateString()}`);
            console.log(`     - Scopes: ${tokenData.data.scopes?.join(', ') || 'N/A'}`);

            // Check if ads_read permission exists
            if (tokenData.data.scopes?.includes('ads_read')) {
                console.log("  ✅ Permissão ads_read: OK");
            } else {
                console.log("  ⚠️ Permissão ads_read: NÃO ENCONTRADA");
                console.log("     Isso pode causar erro ao buscar dados de anúncios!");
            }
        } else if (tokenData.error) {
            console.log(`  ❌ Token inválido: ${tokenData.error.message}`);
        }

        // Test Ad Account access
        console.log("\n  🔄 Buscando contas de anúncios...");
        const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${token}&fields=name,account_id,account_status`;
        const accountsResp = await fetch(adAccountsUrl);
        const accountsData = await accountsResp.json();

        if (accountsData.data && accountsData.data.length > 0) {
            console.log(`  ✅ Encontradas ${accountsData.data.length} contas de anúncios:`);
            accountsData.data.forEach((acc: any) => {
                const status = acc.account_status === 1 ? "Ativa" : "Inativa";
                console.log(`     - ${acc.name} (${acc.id}) - ${status}`);
            });
        } else if (accountsData.error) {
            console.log(`  ❌ Erro ao buscar contas: ${accountsData.error.message}`);
        } else {
            console.log("  ⚠️ Nenhuma conta de anúncios encontrada");
        }

    } catch (error: any) {
        console.log(`  ❌ Erro: ${error.message}`);
    }
}

// 3. Test Google APIs
console.log("\n\n📊 3. TESTANDO GOOGLE ANALYTICS API\n");

async function testGA4() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        console.log("  ❌ GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurado");
        return;
    }

    console.log("  ✅ Credenciais OAuth configuradas");
    console.log("  ℹ️  GA4 requer OAuth do usuário - não é possível testar sem login");
    console.log("  ℹ️  Teste via UI: faça login e clique em 'Testar' nas Configurações");
}

// 4. Test Google Ads
console.log("\n📈 4. TESTANDO GOOGLE ADS API\n");

async function testGoogleAds() {
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!devToken) {
        console.log("  ❌ GOOGLE_ADS_DEVELOPER_TOKEN não configurado");
        return;
    }

    if (!clientId) {
        console.log("  ❌ GOOGLE_CLIENT_ID não configurado");
        return;
    }

    console.log("  ✅ Developer Token configurado");
    console.log("  ✅ OAuth Client ID configurado");
    console.log("  ℹ️  Google Ads requer OAuth do usuário - não é possível testar sem login");
    console.log("  ℹ️  Teste via UI: faça login e clique em 'Testar' nas Configurações");
}

// Run all tests
async function runTests() {
    await testMetaAds();
    await testGA4();
    await testGoogleAds();

    console.log("\n===========================================");
    console.log("✅ TESTE CONCLUÍDO");
    console.log("===========================================\n");
}

runTests();
