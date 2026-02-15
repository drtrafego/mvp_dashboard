import { StackServerApp, StackClientApp } from "@stackframe/stack";

export const stackApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "build-time-placeholder",
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "build-time-placeholder",
} as any);

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "build-time-placeholder",
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "build-time-placeholder",
});
