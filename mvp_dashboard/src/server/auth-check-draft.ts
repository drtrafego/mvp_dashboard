
// Restricted Org ID
const RESTRICTED_ORG_ID = "58cc3a9f-fad1-47bb-b224-ee20019493d1";

// Inside signIn callback:
const dbUser = await biDb.query.users.findFirst({
    where: eq(users.id, user.id as string)
});

if (dbUser?.organizationId === RESTRICTED_ORG_ID) {
    const adminEmails = process.env.SUPERADMIN_EMAILS?.split(",") || [];
    if (!adminEmails.includes(dbUser.email)) {
        console.log("Access denied to Restricted Org for non-admin");
        return false; // Deny login
    }
}
