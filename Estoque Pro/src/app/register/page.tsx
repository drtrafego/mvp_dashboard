import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"
// Reusing Auth Form for now, normally would be a RegisterForm
import { UserAuthForm } from "@/components/user-auth-form"
import { buttonVariants } from "@/components/ui/button"

export const metadata: Metadata = {
    title: "Cadastro - Mise en Place",
    description: "Crie sua conta no sistema.",
}

export default function RegisterPage() {
    return (
        <div className="container relative flex h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col bg-zinc-50 p-10 text-zinc-900 dark:border-r lg:flex">
                <div className="absolute inset-0 bg-zinc-100" />
                <div className="relative z-20 flex items-center text-lg font-medium">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-6 w-6"
                    >
                        <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
                    </svg>
                    Mise en Place Inc
                </div>
                <div className="relative z-20 mt-auto">
                    <blockquote className="space-y-2">
                        <p className="text-lg italic text-zinc-700">
                            &ldquo;A organização que faltava para o seu sucesso.&rdquo;
                        </p>
                    </blockquote>
                </div>
            </div>
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Criar uma conta
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Insira seu e-mail para começar
                        </p>
                    </div>
                    <UserAuthForm /> {/* In MVP we can reuse or create a specific one */}
                    <p className="px-8 text-center text-sm text-muted-foreground">
                        Já tem uma conta?{" "}
                        <Link
                            href="/login"
                            className="underline underline-offset-4 hover:text-primary"
                        >
                            Fazer Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
