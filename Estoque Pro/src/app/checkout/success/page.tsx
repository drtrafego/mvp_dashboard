"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle, Mail, ArrowRight, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams()
    const sessionId = searchParams.get("session_id")
    const [loading, setLoading] = useState(true)
    const [email, setEmail] = useState<string | null>(null)

    useEffect(() => {
        // Give webhook time to process
        const timer = setTimeout(() => {
            setLoading(false)
        }, 3000)
        return () => clearTimeout(timer)
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
            <Card className="max-w-lg w-full shadow-2xl">
                <CardHeader className="text-center space-y-4">
                    <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-3xl text-green-700 dark:text-green-400">
                        Pagamento Confirmado! 🎉
                    </CardTitle>
                    <CardDescription className="text-lg">
                        Sua assinatura do ChefControl foi ativada com sucesso.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                            <span className="ml-3 text-muted-foreground">Configurando sua conta...</span>
                        </div>
                    ) : (
                        <>
                            {/* Alerta Geral: Falta 1 Passo */}
                            <div className="bg-blue-600 p-4 rounded-lg shadow-md text-white">
                                <h3 className="flex items-center gap-2 text-lg font-bold mb-2">
                                    <Mail className="w-6 h-6" />
                                    Falta apenas 1 passo!
                                </h3>
                                <p className="text-blue-50">
                                    Para sua segurança, precisamos validar seu acesso. Escolha abaixo como você deseja entrar:
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {/* Opção 1: Google */}
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col">
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                            Usou um Gmail?
                                        </h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Se você preencheu um email do Google (@gmail.com) na compra, pode entrar direto.
                                        </p>
                                    </div>
                                    <div className="mt-auto">
                                        <Link href="/login" className="w-full">
                                            <Button variant="outline" className="w-full gap-2 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                Entrar com Google
                                            </Button>
                                        </Link>
                                    </div>
                                </div>

                                {/* Opção 2: Outros Emails */}
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 flex flex-col">
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                                            Usou outro Email?
                                        </h4>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Enviamos um link seguro para você definir sua senha.
                                        </p>
                                    </div>
                                    <div className="mt-auto bg-white dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-900 text-center">
                                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                                            📧 Abra seu email e clique em <br /><strong>"Ativar Minha Conta"</strong>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                                <p className="text-sm text-gray-500 text-center mb-4">
                                    Não encontrou o email? Verifique sua caixa de SPAM ou <a href="mailto:suporte@chefcontrol.online" className="text-green-600 hover:underline">fale conosco</a>.
                                </p>
                                <Link href="/" className="w-full block text-center">
                                    <Button variant="ghost" className="text-muted-foreground w-full">
                                        Voltar para o site
                                    </Button>
                                </Link>
                            </div>

                            {/* Suporte */}
                            <p className="text-center text-sm text-muted-foreground pt-4">
                                Problemas? Entre em contato: <br />
                                <a href="mailto:suporte@chefcontrol.online" className="text-green-600 hover:underline">
                                    suporte@chefcontrol.online
                                </a>
                            </p>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
