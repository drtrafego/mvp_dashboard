import { db } from "../src/lib/db"

async function main() {
    const email = "gastaomatos@gmail.com"
    console.log(`🔍 Checking for residues of email: ${email}...`)

    const user = await db.user.findFirst({
        where: { email: { equals: email, mode: "insensitive" } },
        include: { organization: true }
    })

    if (!user) {
        console.log("✅ No user found with this email. System is clean.")
        return
    }

    console.log(`⚠️ User found: ${user.name} (ID: ${user.id})`)
    console.log(`   Organization: ${user.organization?.name} (ID: ${user.organizationId})`)

    // Delete User
    console.log("🗑️ Deleting user...")
    await db.user.delete({
        where: { id: user.id }
    })
    console.log("✅ User deleted.")

    // Delete Organization if it exists and was likely created by this test user
    // We assume if they have an org, we want to clean it for the test
    if (user.organizationId) {
        console.log(`🗑️ Deleting organization ${user.organizationId}...`)
        // We first need to delete related data if cascade isn't set up, but Prisma usually handles Cascade if configured
        // Or we might trip distinct constraints.
        // Let's try deleting organization.
        try {
            await db.organization.delete({
                where: { id: user.organizationId }
            })
            console.log("✅ Organization deleted.")
        } catch (e: any) {
            console.error("⚠️ Could not delete organization (might have other users or dependencies):", e.message)
        }
    }

    console.log("✨ Cleanup complete!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
