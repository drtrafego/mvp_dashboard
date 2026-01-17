import { StackClientApp } from "@stackframe/stack"

export const stackClientApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
    tokenStore: "cookie",
    urls: {
        home: "/",
        signIn: "/login",
        signUp: "/login",
        afterSignIn: "/dashboard",
        afterSignUp: "/onboarding",
    },
})
