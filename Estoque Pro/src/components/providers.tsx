"use client"

import { Suspense } from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { StockProvider } from "@/context/stock-context"
import { StackProvider, StackTheme } from "@stackframe/stack"
import { stackClientApp } from "@/lib/stack-client"
import { CookieBanner } from "@/components/cookie-banner"

function LoadingFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    )
}

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <StackProvider app={stackClientApp}>
                <StackTheme>
                    <NextThemesProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <StockProvider>
                            {children}
                            <CookieBanner />
                        </StockProvider>
                    </NextThemesProvider>
                </StackTheme>
            </StackProvider>
        </Suspense>
    )
}
