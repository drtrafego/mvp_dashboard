import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "./stack";

// Use named export 'middleware' and cast as any to bypass TS inference error during build
export const middleware = (StackHandler as any)({ app: stackServerApp, fullPage: true });

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
