"use client"

import { useUser, useStackApp } from "@stackframe/stack"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, Suspense } from "react"
import { Package, Mail, ArrowRight, Eye, EyeOff } from "lucide-react"

type AuthMode = "email" | "password"

function LoginContent() {
  const user = useUser()
  const stackApp = useStackApp()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>("email")
  const [isSignUp, setIsSignUp] = useState(false)

  const searchParams = useSearchParams()
  const plan = searchParams.get("plan")
  const emailParam = searchParams.get("email")

  useEffect(() => {
    if (emailParam) {
      setEmail(emailParam)
      // If email provided, assume they might want to sign up or log in, default to sign up if coming from webhook
      const flow = searchParams.get("flow")
      if (flow === "signup") {
        setIsSignUp(true)
      }
    }
  }, [emailParam, searchParams])

  useEffect(() => {
    if (user) {
      // Force hard navigation to ensure cookies are sent to server
      // Preserve plan param if exists
      const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"
      window.location.href = redirectUrl
    }
  }, [user, plan])

  const handleGoogleSignIn = async () => {
    await stackApp.signInWithOAuth("google")
  }

  const handleEmailMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsLoading(true)
    setError("")
    try {
      await stackApp.sendMagicLinkEmail(email)
      setEmailSent(true)
    } catch (error) {
      console.error("Error sending magic link:", error)
      setError("Erro ao enviar o link. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError("")
    try {
      const redirectUrl = plan ? `/dashboard?plan=${plan}` : "/dashboard"

      if (isSignUp) {
        await stackApp.signUpWithCredential({ email, password })
        window.location.href = redirectUrl
      } else {
        await stackApp.signInWithCredential({ email, password })
        window.location.href = redirectUrl
      }
    } catch (error: any) {
      console.error("Auth error:", error)
      if (isSignUp) {
        if (error.message?.includes("already exists") || error.code?.includes("already_exists")) {
          setError("Esta conta já existe. Por favor, faça login.")
          setIsSignUp(false)
        } else {
          setError("Erro ao criar conta. Verifique os dados e tente novamente.")
        }
      } else {
        setError("Email ou senha incorretos.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Verifique seu email
          </h2>
          <p className="text-slate-400 mb-6">
            Enviamos um link de acesso para <span className="text-white font-medium">{email}</span>
          </p>
          <button
            onClick={() => setEmailSent(false)}
            className="text-orange-500 hover:text-orange-400 text-sm font-medium"
          >
            Usar outro email
          </button>

          <div className="mt-8 pt-6 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm mb-2">Não recebeu o email?</p>
            <ul className="text-sm text-slate-500 space-y-2">
              <li>• Verifique sua caixa de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong></li>
              <li>• Se usa Gmail, tente a opção <button onClick={() => { setEmailSent(false); handleGoogleSignIn(); }} className="text-orange-500 hover:underline inline-flex items-center gap-1">Continuar com Google <ArrowRight className="w-3 h-3" /></button></li>
            </ul>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="w-full max-w-md p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            ChefControl
          </h1>
          <p className="text-slate-400">
            Sistema de Controle de Estoque
          </p>
          <p className="text-slate-500 text-sm mt-4 italic max-w-sm mx-auto">
            &ldquo;Controle seu estoque com precisão e evite desperdícios. O sistema ideal para chefs e gestores.&rdquo;
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {isSignUp ? "Criar sua conta" : "Entrar na sua conta"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {isSignUp ? (
                <>Já tem conta? <button onClick={() => setIsSignUp(false)} className="text-orange-600 hover:underline">Faça login</button></>
              ) : (
                <>Não tem conta? <button onClick={() => setIsSignUp(true)} className="text-orange-600 hover:underline">Cadastre-se</button></>
              )}
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="text-gray-700 font-medium">Continuar com Google</span>
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-400">ou continue com</span>
            </div>
          </div>

          {/* Auth Mode Toggle */}
          <div className="flex rounded-lg border border-gray-200 p-1">
            <button
              type="button"
              onClick={() => setAuthMode("email")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${authMode === "email"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("password")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${authMode === "password"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:text-gray-900"
                }`}
            >
              Email & Password
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Email Magic Link Form */}
          {authMode === "email" && (
            <form onSubmit={handleEmailMagicLink} className="space-y-4">
              <div>
                <label htmlFor="email-magic" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="email-magic"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Enviar link de acesso</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          )}

          {/* Email + Password Form */}
          {authMode === "password" && (
            <form onSubmit={handleEmailPassword} className="space-y-4">
              {showForgotPassword ? (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Recuperar Senha</h3>
                    <p className="text-sm text-gray-500">
                      Digite seu email para receber um link de redefinição.
                    </p>
                  </div>

                  {resetSent ? (
                    <div className="bg-green-50 p-4 rounded-lg text-green-700 text-sm text-center">
                      <p className="font-medium">Email enviado!</p>
                      <p className="mt-1">Verifique sua caixa de entrada para criar uma nova senha.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setResetSent(false)
                          setShowForgotPassword(false)
                        }}
                        className="mt-3 text-green-800 underline hover:text-green-900"
                      >
                        Voltar ao login
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label htmlFor="email-reset" className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          id="email-reset"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!email) return
                          setIsLoading(true)
                          setError(null)
                          try {
                            await stackApp.sendForgotPasswordEmail(email)
                            setResetSent(true)
                          } catch (err: any) {
                            setError(err.message || "Erro ao enviar email. Verifique se o endereço está correto.")
                          } finally {
                            setIsLoading(false)
                          }
                        }}
                        disabled={isLoading || !email}
                        className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50"
                      >
                        {isLoading ? "Enviando..." : "Enviar Email de Recuperação"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="email-pass" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="email-pass"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder:text-gray-400"
                      required
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Senha
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-orange-600 hover:text-orange-700 hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all pr-12 text-gray-900 placeholder:text-gray-400"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading || !email || !password}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <span>{isSignUp ? "Criando..." : "Entrando..."}</span>
                    ) : (
                      <>
                        <span>{isSignUp ? "Criar conta" : "Entrar"}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </>
              )}
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Ao entrar, você concorda com nossos Termos de Serviço
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
