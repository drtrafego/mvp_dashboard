import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "./stack";

const stackHandler = StackHandler({ app: stackServerApp, fullPage: true });

export default function middleware(request: any) {
    return stackHandler(request);
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
