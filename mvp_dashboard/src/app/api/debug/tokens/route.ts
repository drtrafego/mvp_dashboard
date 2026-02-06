import { biDb } from "@/server/db";
import { integrations, accounts, users } from "@/server/db/schema";

export async function GET() {
    try {
        const ints = await biDb.select().from(integrations);
        const accs = await biDb.select().from(accounts);
        const usrs = await biDb.select().from(users);

        const result = {
            integrations: ints.map(i => ({
                provider: i.provider,
                organizationId: i.organizationId,
                providerAccountId: i.providerAccountId,
                hasAccessToken: !!i.accessToken,
                accessTokenLength: i.accessToken?.length || 0,
                hasRefreshToken: !!i.refreshToken,
                expiresAt: i.expiresAt,
            })),
            accounts: accs.map(a => ({
                userId: a.userId,
                provider: a.provider,
                providerAccountId: a.providerAccountId,
                hasAccessToken: !!a.access_token,
                accessTokenLength: a.access_token?.length || 0,
                hasRefreshToken: !!a.refresh_token,
                expiresAt: a.expires_at ? new Date(a.expires_at * 1000).toISOString() : null,
            })),
            users: usrs.map(u => ({
                id: u.id,
                name: u.name,
                email: u.email,
                organizationId: u.organizationId,
            })),
        };

        return Response.json(result);
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
