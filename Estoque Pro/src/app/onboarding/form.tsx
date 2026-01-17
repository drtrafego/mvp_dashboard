"use client"

import { useUser } from "@stackframe/stack"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, ArrowRight } from "lucide-react"

export function OnboardingForm() {
    const user = useUser()
    const router = useRouter()
    const [companyName, setCompanyName] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!user) {
            router.push("/login")
        }
    }, [user, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Call API to create organization
            const response = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: companyName,
                    userEmail: user?.primaryEmail,
                    userId: user?.id
                })
            })

            if (response.ok) {
                router.push("/dashboard")
                router.refresh()
            } else {
                console.error("Failed to create organization")
            }
        } catch (error) {
            console.error("Error creating organization:", error)
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <CardTitle className="text-2xl">Configure sua Empresa</CardTitle>
                    <CardDescription>
                        Olá, {user.displayName || user.primaryEmail}! Vamos configurar seu espaço de trabalho.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <Input
                                id="companyName"
                                placeholder="Ex: Restaurante Sabor & Arte"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                required
                                className="h-12"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 gap-2"
                            disabled={isLoading || !companyName.trim()}
                        >
                            {isLoading ? "Criando..." : "Continuar"}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
