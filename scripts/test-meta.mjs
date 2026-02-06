// Simple test script - no imports needed
// Run with: node scripts/test-meta.mjs

const META_ACCESS_TOKEN = "EAANCYW8PaTQBQWzye2CR2hLTZBJ68EZCDMyOPCu22JGE03XM34yg34NlckIlrit3AGAbO8Yw4JsbiucnOLdoKjLaeP8DZCQ0thJOWIiq37MLXLZAEHYHlGbmbwfF0duYzT7rKbjYGfNNsp3jdtpqvHt2ZCk7YnUxXF9P9ZCdsF0Uo2ALL0Y2cjl4iUw9OzF1U21AZDZD";

console.log("\n===========================================");
console.log("🔍 TESTE META ADS");
console.log("===========================================\n");

async function testMeta() {
    // 1. Validate Token
    console.log("1️⃣ Validando Token...\n");

    const tokenDebugUrl = `https://graph.facebook.com/v18.0/debug_token?input_token=${META_ACCESS_TOKEN}&access_token=${META_ACCESS_TOKEN}`;
    const tokenResp = await fetch(tokenDebugUrl);
    const tokenData = await tokenResp.json();

    if (tokenData.data) {
        console.log("✅ Token válido!");
        console.log(`   App ID: ${tokenData.data.app_id}`);
        console.log(`   Tipo: ${tokenData.data.type}`);
        console.log(`   Expira: ${tokenData.data.expires_at === 0 ? 'Nunca (permanente)' : new Date(tokenData.data.expires_at * 1000).toLocaleDateString()}`);
        console.log(`   Scopes: ${tokenData.data.scopes?.join(', ') || 'N/A'}`);

        if (!tokenData.data.scopes?.includes('ads_read')) {
            console.log("\n⚠️  IMPORTANTE: Permissão 'ads_read' NÃO encontrada!");
            console.log("   Isso explica por que não retorna dados de anúncios.");
        }
    } else if (tokenData.error) {
        console.log(`❌ Token inválido: ${tokenData.error.message}`);
        return;
    }

    // 2. Get Ad Accounts
    console.log("\n\n2️⃣ Buscando contas de anúncios...\n");

    const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${META_ACCESS_TOKEN}&fields=name,account_id,account_status`;
    const accountsResp = await fetch(adAccountsUrl);
    const accountsData = await accountsResp.json();

    if (accountsData.data && accountsData.data.length > 0) {
        console.log(`✅ Encontradas ${accountsData.data.length} contas de anúncios:\n`);

        for (const acc of accountsData.data) {
            const status = acc.account_status === 1 ? "✅ Ativa" : "⚠️ Inativa";
            console.log(`   📊 ${acc.name}`);
            console.log(`      ID: ${acc.id}`);
            console.log(`      Status: ${status}\n`);

            // 3. Try to get campaigns for this account
            console.log(`   🔄 Buscando campanhas desta conta...`);

            const campaignsUrl = `https://graph.facebook.com/v18.0/${acc.id}/campaigns?access_token=${META_ACCESS_TOKEN}&fields=name,status,objective&limit=5`;
            const campaignsResp = await fetch(campaignsUrl);
            const campaignsData = await campaignsResp.json();

            if (campaignsData.data && campaignsData.data.length > 0) {
                console.log(`   ✅ Encontradas ${campaignsData.data.length} campanhas:\n`);
                campaignsData.data.forEach(c => {
                    console.log(`      - ${c.name} (${c.status})`);
                });
            } else if (campaignsData.error) {
                console.log(`   ❌ Erro: ${campaignsData.error.message}`);
            } else {
                console.log(`   ⚠️ Nenhuma campanha encontrada`);
            }
            console.log("");
        }
    } else if (accountsData.error) {
        console.log(`❌ Erro ao buscar contas: ${accountsData.error.message}`);
    } else {
        console.log("⚠️ Nenhuma conta de anúncios encontrada");
    }

    console.log("\n===========================================");
    console.log("✅ TESTE CONCLUÍDO");
    console.log("===========================================\n");
}

testMeta();
