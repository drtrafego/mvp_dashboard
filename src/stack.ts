import { StackServerApp, StackClientApp } from "@stackframe/stack";

// Use a valid UUID format for build-time placeholder to pass validation
const BUILD_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";

export const stackApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || BUILD_PLACEHOLDER,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || BUILD_PLACEHOLDER,
} as any);

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || BUILD_PLACEHOLDER,
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || BUILD_PLACEHOLDER,
});
