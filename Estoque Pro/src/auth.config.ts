import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
    pages: {
        signIn: "/login",
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
            if (isOnDashboard) {
                if (isLoggedIn) return true
                return false // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect logged-in users to dashboard
                // return Response.redirect(new URL("/dashboard", nextUrl))
            }
            return true
        },
    },
    providers: [
        Credentials({
            async authorize(credentials) {
                // This will be replaced by DB validation later
                if (credentials?.email === "dr.trafego@gmail.com" && credentials.password === "admin") {
                    return { id: "1", name: "Admin User", email: "dr.trafego@gmail.com", role: "ADMIN" }
                }
                if (credentials?.email === "staff@gmail.com" && credentials.password === "staff") {
                    return { id: "2", name: "Staff User", email: "staff@gmail.com", role: "STAFF" }
                }
                return null
            },
        }),
    ],
} satisfies NextAuthConfig
