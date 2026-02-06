// Check database for OAuth tokens
// Run with: node --env-file=.env scripts/check-db.mjs

import pg from 'pg';
const { Client } = pg;

async function checkDatabase() {
    console.log("\n===========================================");
    console.log("🗄️ VERIFICANDO TOKENS NO BANCO DE DADOS");
    console.log("===========================================\n");

    const client = new Client({
        connectionString: process.env.BI_DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("✅ Conectado ao banco!\n");

        // Check integrations table
        console.log("📋 TABELA: integrations\n");
        const intResult = await client.query(`
            SELECT 
                id,
                "organizationId",
                provider, 
                "providerAccountId",
                CASE WHEN "accessToken" IS NOT NULL AND "accessToken" != '' THEN 'SIM (' || LENGTH("accessToken") || ' chars)' ELSE 'NÃO' END as tem_access_token,
                CASE WHEN "refreshToken" IS NOT NULL AND "refreshToken" != '' THEN 'SIM' ELSE 'NÃO' END as tem_refresh_token,
                "expiresAt",
                "createdAt"
            FROM bi_integrations
            ORDER BY "createdAt" DESC
        `);

        if (intResult.rows.length > 0) {
            console.log(`   Encontrados ${intResult.rows.length} registros:\n`);
            for (const row of intResult.rows) {
                console.log(`   🔗 Provider: ${row.provider}`);
                console.log(`      Org ID: ${row.organizationId}`);
                console.log(`      Account: ${row.providerAccountId}`);
                console.log(`      Access Token: ${row.tem_access_token}`);
                console.log(`      Refresh Token: ${row.tem_refresh_token}`);
                console.log(`      Expires At: ${row.expiresAt}`);
                console.log("");
            }
        } else {
            console.log("   ⚠️ Nenhum registro encontrado!");
            console.log("   ℹ️ Os tokens são criados quando o usuário faz login.");
        }

        // Check accounts table (NextAuth stores tokens here too)
        console.log("\n📋 TABELA: bi_accounts (NextAuth)\n");
        const accResult = await client.query(`
            SELECT 
                "userId",
                provider,
                "providerAccountId",
                CASE WHEN access_token IS NOT NULL THEN 'SIM (' || LENGTH(access_token) || ' chars)' ELSE 'NÃO' END as tem_access_token,
                CASE WHEN refresh_token IS NOT NULL THEN 'SIM' ELSE 'NÃO' END as tem_refresh_token,
                expires_at
            FROM bi_accounts
            ORDER BY "userId"
        `);

        if (accResult.rows.length > 0) {
            console.log(`   Encontrados ${accResult.rows.length} registros:\n`);
            for (const row of accResult.rows) {
                console.log(`   👤 User ID: ${row.userId}`);
                console.log(`      Provider: ${row.provider}`);
                console.log(`      Account: ${row.providerAccountId}`);
                console.log(`      Access Token: ${row.tem_access_token}`);
                console.log(`      Refresh Token: ${row.tem_refresh_token}`);
                console.log(`      Expires At: ${row.expires_at ? new Date(row.expires_at * 1000).toISOString() : 'N/A'}`);
                console.log("");
            }
        } else {
            console.log("   ⚠️ Nenhuma conta encontrada!");
        }

        // Check users table
        console.log("\n📋 TABELA: bi_users\n");
        const userResult = await client.query(`
            SELECT id, name, email, "organizationId"
            FROM bi_users
        `);

        if (userResult.rows.length > 0) {
            console.log(`   Encontrados ${userResult.rows.length} usuários:\n`);
            for (const row of userResult.rows) {
                console.log(`   👤 ${row.name} (${row.email})`);
                console.log(`      ID: ${row.id}`);
                console.log(`      Org ID: ${row.organizationId || 'NÃO DEFINIDO'}`);
                console.log("");
            }
        }

    } catch (error) {
        console.log(`❌ Erro: ${error.message}`);
    } finally {
        await client.end();
    }

    console.log("===========================================\n");
}

checkDatabase();
