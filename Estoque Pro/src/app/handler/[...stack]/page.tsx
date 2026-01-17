"use client"

import { StackHandler } from "@stackframe/stack"
import { stackClientApp } from "@/lib/stack-client"
import { Suspense } from "react"

function HandlerContent(props: object) {
    return <StackHandler fullPage app={stackClientApp} {...props} />
}

export default function Handler(props: object) {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        }>
            <HandlerContent {...props} />
        </Suspense>
    )
}
