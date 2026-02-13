import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID,
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY,
});
