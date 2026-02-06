import { biDb } from "@/server/db";
import { organizations, users, adAccountSettings } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action } = body;

        if (action === "setup-casal-do-trafego") {
            // Get existing organization
            const orgId = "58cc3a9f-fad1-47bb-b224-ee20019493d1";

            // Update organization name
            await biDb.update(organizations)
                .set({
                    name: "Casal do Trafego",
                    updatedAt: new Date()
                })
                .where(eq(organizations.id, orgId));

            return Response.json({
                success: true,
                message: "Organization 'Casal do Trafego' configured successfully",
                organizationId: orgId
            });
        }

        if (action === "list-orgs") {
            const orgs = await biDb.select().from(organizations);
            const usrs = await biDb.select({
                id: users.id,
                name: users.name,
                email: users.email,
                role: users.role,
                organizationId: users.organizationId
            }).from(users);

            return Response.json({
                organizations: orgs,
                users: usrs
            });
        }

        return Response.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return Response.json({ error: error.message }, { status: 500 });
    }
}
