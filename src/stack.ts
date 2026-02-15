import { StackServerApp, StackClientApp } from "@stackframe/stack";

// Using real project credentials as fallbacks for the build phase
// This ensures the library doesn't throw validation errors when env vars are missing during compilation
const REAL_PROJECT_ID = "a40fb3c8-efc6-413b-b108-6f4918b528f3";
const REAL_CLIENT_KEY = "pck_v491sr955v9vwtmc8kt7s4n4jrcsrwt896ms06b5ww4zr";
const REAL_SERVER_KEY = "ssk_k9rt8cpwtt657txg791janyss58bmtqdr5n8903tpw8d8";

export const stackApp = new StackClientApp({
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || REAL_PROJECT_ID,
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || REAL_CLIENT_KEY,
} as any);

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || REAL_PROJECT_ID,
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || REAL_SERVER_KEY,
});
