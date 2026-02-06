// Check database using project's drizzle setup
// Run with: npx tsx scripts/check-tokens.ts

import { biDb } from "../src/server/db";
import { integrations, accounts, users } from "../src/server/db/schema";

async function main() {
    console.log("\n===========================================");
    console.log("🗄️ VERIFICANDO TOKENS NO BANCO DE DADOS");
    console.log("===========================================\n");

    // Check integrations
    console.log("📋 TABELA: integrations\n");
    const ints = await biDb.select().from(integrations);

    if (ints.length > 0) {
        console.log(`   Encontrados ${ints.length} registros:\n`);
        for (const row of ints) {
            console.log(`   🔗 Provider: ${row.provider}`);
            console.log(`      Org ID: ${row.organizationId}`);
            console.log(`      Account: ${row.providerAccountId}`);
            console.log(`      Has Access Token: ${row.accessToken ? 'SIM (' + row.accessToken.length + ' chars)' : 'NÃO'}`);
            console.log(`      Has Refresh Token: ${row.refreshToken ? 'SIM' : 'NÃO'}`);
            console.log(`      Expires At: ${row.expiresAt}`);
            console.log("");
        }
    } else {
        console.log("   ⚠️ Nenhum registro na tabela integrations!");
        console.log("   ℹ️ Os tokens são criados quando o usuário faz login.");
    }

    // Check accounts (NextAuth)
    console.log("\n📋 TABELA: accounts (NextAuth)\n");
    const accs = await biDb.select().from(accounts);

    if (accs.length > 0) {
        console.log(`   Encontrados ${accs.length} registros:\n`);
        for (const row of accs) {
            console.log(`   👤 User ID: ${row.userId}`);
            console.log(`      Provider: ${row.provider}`);
            console.log(`      Account: ${row.providerAccountId}`);
            console.log(`      Has Access Token: ${row.access_token ? 'SIM (' + row.access_token.length + ' chars)' : 'NÃO'}`);
            console.log(`      Has Refresh Token: ${row.refresh_token ? 'SIM' : 'NÃO'}`);
            console.log(`      Expires At: ${row.expires_at ? new Date(row.expires_at * 1000).toISOString() : 'N/A'}`);
            console.log("");
        }
    } else {
        console.log("   ⚠️ Nenhuma conta encontrada!");
    }

    // Check users
    console.log("\n📋 TABELA: users\n");
    const usrs = await biDb.select().from(users);

    if (usrs.length > 0) {
        console.log(`   Encontrados ${usrs.length} usuários:\n`);
        for (const row of usrs) {
            console.log(`   👤 ${row.name} (${row.email})`);
            console.log(`      ID: ${row.id}`);
            console.log(`      Org ID: ${row.organizationId || '❌ NÃO DEFINIDO'}`);
            console.log("");
        }
    }

    console.log("===========================================\n");
    process.exit(0);
}

main().catch(console.error);
