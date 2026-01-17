"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Cookie } from "lucide-react"

export function CookieBanner() {
    const [showBanner, setShowBanner] = React.useState(false)

    React.useEffect(() => {
        const consent = localStorage.getItem("cookieConsent")
        if (!consent) {
            setShowBanner(true)
        }
    }, [])

    const handleAccept = async () => {
        localStorage.setItem("cookieConsent", "accepted")
        localStorage.setItem("cookieConsentDate", new Date().toISOString())
        setShowBanner(false)

        // Log consent to server
        try {
            await fetch("/api/user/consent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type: "cookies", accepted: true })
            })
        } catch (e) {
            // Silent fail - consent already stored locally
        }
    }

    const handleReject = () => {
        localStorage.setItem("cookieConsent", "rejected")
        localStorage.setItem("cookieConsentDate", new Date().toISOString())
        setShowBanner(false)
    }

    if (!showBanner) return null

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-900 border-t border-slate-700 shadow-lg">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Cookie className="w-6 h-6 text-orange-500 flex-shrink-0" />
                    <p className="text-sm text-slate-300">
                        Utilizamos cookies para melhorar sua experiência. Ao continuar navegando, você concorda com nossa{" "}
                        <a href="/politica-de-privacidade" className="text-orange-400 hover:underline">
                            Política de Privacidade
                        </a>.
                    </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReject}
                        className="border-slate-600 text-slate-300 hover:bg-slate-800"
                    >
                        Recusar
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleAccept}
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                        Aceitar
                    </Button>
                </div>
            </div>
        </div>
    )
}
