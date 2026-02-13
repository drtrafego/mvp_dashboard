import { stackServerApp } from "@/stack";
import { biDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export async function getAuthenticatedUser() {
    const stackUser = await stackServerApp.getUser();
    if (!stackUser) return null;

    const email = stackUser.primaryEmail;
    if (!email) return null;

    // Find user in BI DB
    let dbUser = await biDb.query.users.findFirst({
        where: eq(users.email, email),
    });

    // Auto-Sync User
    if (!dbUser) {
        try {
            const [newUser] = await biDb.insert(users).values({
                id: stackUser.id,
                email,
                name: stackUser.displayName || email.split('@')[0],
                image: stackUser.profileImageUrl,
            }).returning();
            dbUser = newUser;
        } catch (error) {
            console.error("Failed to sync user to BI DB:", error);
            return null;
        }
    }

    return { ...dbUser, stackId: stackUser.id };
}
