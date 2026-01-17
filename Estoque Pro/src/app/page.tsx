"use client"

import { useState, useEffect } from "react"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  ChefHat,
  TrendingUp,
  FileText,
  Shield,
  CheckCircle,
  ArrowRight,
  Star,
  AlertTriangle,
  BarChart3,
  Smartphone,
  Lock,
  Clock,
  HelpCircle,
  CreditCard,
  Bell
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { StructuredData } from "@/components/structured-data"
import { SalesVideoPlayer } from "@/components/sales-video"

export default function LandingPage() {
  // Countdown timer - 10 minutes from when user enters
  const [timeLeft, setTimeLeft] = useState(10 * 60) // 10 minutes in seconds

  useEffect(() => {
    if (timeLeft <= 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans selection:bg-orange-500/30">
      <StructuredData />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-orange-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="ChefControl" width={160} height={50} className="h-10 md:h-12 w-auto object-contain" />
            </div>



            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 font-medium">
                  Entrar
                </Button>
              </Link>
            </div>
          </div>


        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl opacity-50" />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-orange-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Star className="w-4 h-4 fill-orange-400" />
            Sistema de gestão para alta performance gastronômica
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-[1.1] tracking-tight animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-100">
            Assuma o Controle da Sua Cozinha, <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-600">
              Elimine o Desperdício
            </span> e Garanta o Lucro.
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            O sistema 100% online que organiza seu estoque, automatiza suas fichas técnicas e acaba com o "achismo" na hora de cobrar. Tudo o que você precisa, do celular ou computador.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-300">
            <Button
              size="lg"
              onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-lg font-bold h-14 px-8 rounded-full shadow-xl shadow-orange-500/20 hover:shadow-orange-500/40 transition-all hover:scale-105 cursor-pointer"
            >
              Começar Agora
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* No Setup Fee - Below CTA */}
          <p className="text-center text-slate-500 text-sm mt-6 animate-in fade-in duration-1000 delay-400">
            Sem taxas de setup. Cancele quando quiser.
          </p>

          <div className="mt-10 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-500">
            <div className="aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/80 shadow-2xl">
              <SalesVideoPlayer />
            </div>
            <p className="text-center text-slate-500 text-sm mt-4">Assista à apresentação do sistema</p>
          </div>
        </div>
      </section>



      {/* Social Proof Section (Trusted By) */}
      <section className="py-8 border-y border-slate-800/50 bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
            A escolha de milhares de restaurantes inteligentes
          </p>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Logos Placeholders - Using Text for now */}
            {["Bistrô 55", "Pizzaria Napoli", "O Paulistinha Lanches", "Sushi House", "Café Colonial"].map((brand) => (
              <span key={brand} className="text-xl font-bold text-slate-400">{brand}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section: The Excel Villain */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold uppercase tracking-wide mb-6">
                <AlertTriangle className="w-3 h-3" />
                Cuidado
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                A Planilha de Excel é a maior <span className="text-red-500">"Ladra Invisível"</span> do seu estabelecimento.
              </h2>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Você sente que trabalha muito, mas o dinheiro parece "escorrer" pelas mãos? O desperdício e a falta de controle são inimigos silenciosos. Dirigir seu negócio sem dados claros é um acidente esperando para acontecer.
              </p>

              <div className="space-y-4">
                {[
                  "Fórmulas que quebram e você nem percebe.",
                  "Dados descentralizados (ninguém sabe qual é a versão final).",
                  "Horas perdidas preenchendo células em vez de treinar equipe.",
                  "Zero alertas: Você só descobre que acabou quando o cliente pede."
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-red-500/30 transition-colors">
                    <div className="mt-1 w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                    </div>
                    <p className="text-slate-300 font-medium">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-3xl blur-3xl opacity-30" />
              <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 overflow-hidden shadow-2xl">
                {/* Devices Mockup Image */}
                <Image
                  src="/devices-mockup.png"
                  alt="ChefControl em laptop, tablet e celular"
                  width={800}
                  height={500}
                  className="w-full h-auto rounded-lg"
                />
                <div className="text-center relative z-10 mt-6">
                  <h3 className="text-2xl font-bold text-white mb-2">Troque o caos pelo ChefControl</h3>
                  <p className="text-slate-400 mb-6">Uma interface visual e intuitiva que trabalha por você.</p>
                  <div className="inline-flex items-center gap-2 text-green-400 font-semibold bg-green-500/10 px-4 py-2 rounded-lg border border-green-500/20">
                    <Smartphone className="w-5 h-5" />
                    Se você usa WhatsApp, sabe usar nosso sistema.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-slate-900/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Tudo que você precisa em um só sistema</h2>
            <p className="text-lg text-slate-400">Funcionalidades pensadas para profissionalizar sua cozinha sem complicar sua vida.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                color: "text-blue-500",
                bg: "bg-blue-500/10",
                title: "Dashboard Completo e Funcional",
                desc: "Tenha a visão total do negócio. Saiba quanto tem de estoque e onde está o dinheiro agora."
              },
              {
                icon: ClipboardList,
                color: "text-orange-500",
                bg: "bg-orange-500/10",
                title: "Estoque Inteligente",
                desc: "Dê adeus ao papel. Controle entradas, saídas e validades com poucos cliques."
              },
              {
                icon: FileText,
                color: "text-green-500",
                bg: "bg-green-500/10",
                title: "Fichas Técnicas",
                desc: "Padronize seus pratos e saiba o custo exato de cada centavo no prato do cliente."
              },
              {
                icon: Shield,
                color: "text-purple-500",
                bg: "bg-purple-500/10",
                title: "Segurança Total",
                desc: "Seus dados criptografados e salvos na nuvem. Acesse de qualquer lugar com segurança."
              },
              {
                icon: Clock,
                color: "text-amber-500",
                bg: "bg-amber-500/10",
                title: "Economia de Tempo",
                desc: "Automatize cálculos e processos manuais para focar no que importa: cozinhar e vender."
              },
              {
                icon: Smartphone,
                color: "text-pink-500",
                bg: "bg-pink-500/10",
                title: "100% Mobile",
                desc: "Funciona no seu celular, tablet ou computador. A gestão do seu restaurante no seu bolso."
              }
            ].map((feature, idx) => (
              <div key={idx} className="group p-8 rounded-2xl bg-slate-950 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-900 transition-all duration-300">
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Simplicity Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/50 to-slate-950 pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Main Message */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Tenha a <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">visão ampla</span> do seu estoque.
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
              Saiba quanto você tem investido em estoque agora e quais produtos estão drenando seu caixa.
            </p>
          </div>

          {/* Security + Simplicity Badge */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-slate-900/80 border border-slate-700 backdrop-blur-sm">
              <Lock className="w-6 h-6 text-green-400" />
              <span className="text-lg text-slate-300 font-medium">
                A segurança de um sistema robusto com a facilidade de um aplicativo de mensagens.
              </span>
            </div>
          </div>

          {/* Mini FAQ Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: "É difícil de usar?",
                a: "Se você sabe usar o WhatsApp, sabe usar nosso sistema. É intuitivo e direto ao ponto.",
                icon: Smartphone
              },
              {
                q: "Tenho que instalar algo?",
                a: "Não. É 100% online. Você acessa do escritório, da cozinha ou de casa.",
                icon: Shield
              },
              {
                q: "E se eu não gostar?",
                a: "Não temos fidelidade. Você pode cancelar quando quiser, sem taxas de saída.",
                icon: CheckCircle
              },
              {
                q: "Serve para o meu negócio pequeno?",
                a: "Sim! Atendemos desde microempreendedores até redes com múltiplas lojas.",
                icon: TrendingUp
              }
            ].map((item, idx) => (
              <div key={idx} className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-orange-500/30 hover:bg-slate-900 transition-all duration-300">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <item.icon className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{item.q}</h4>
                    <p className="text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Benefits Table */}
          <div className="mt-12">
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
              {/* Table Header */}
              <div className="grid grid-cols-3 bg-slate-800/50 border-b border-slate-700">
                <div className="p-4 text-sm font-semibold text-slate-300">Funcionalidade</div>
                <div className="p-4 text-sm font-semibold text-slate-300">O que o sistema faz</div>
                <div className="p-4 text-sm font-semibold text-orange-400">O que você ganha (Benefício)</div>
              </div>

              {/* Table Rows */}
              {[
                {
                  feature: "Estoque Inteligente",
                  does: "Alertas automáticos de estoque baixo e validade.",
                  benefit: "Você nunca mais perde uma venda por falta de produto e nunca mais joga dinheiro fora com itens vencidos."
                },
                {
                  feature: "Fichas Técnicas Pro",
                  does: "Cálculo automático de custos e padronização.",
                  benefit: "Seus pratos saem sempre perfeitos e você sabe exatamente quanto está lucrando em cada porção."
                },
                {
                  feature: "Precificação Lucrativa",
                  does: "Sugestão de preço baseada na margem desejada.",
                  benefit: "Pare de copiar o vizinho. Cobre o valor justo e garanta a saúde financeira da sua empresa."
                },
                {
                  feature: "Requisições de Compra",
                  does: "Listas automáticas enviadas para fornecedores.",
                  benefit: "Economize horas de planilhas e telefonemas. Profissionalize suas compras em 3 cliques."
                }
              ].map((row, idx) => (
                <div key={idx} className={`grid grid-cols-3 ${idx !== 3 ? 'border-b border-slate-800' : ''} hover:bg-slate-800/30 transition-colors`}>
                  <div className="p-4 text-white font-medium">{row.feature}</div>
                  <div className="p-4 text-slate-400 text-sm">{row.does}</div>
                  <div className="p-4 text-slate-300 text-sm">{row.benefit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative" id="pricing">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-4xl bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">

          {/* Testimonials Carousel */}
          <div className="max-w-md mx-auto mb-12">
            <div className="text-center mb-6">
              <p className="text-orange-400 font-semibold uppercase tracking-wide text-sm mb-2">Depoimentos Reais</p>
              <h3 className="text-2xl font-bold text-white">O que nossos clientes dizem</h3>
            </div>
            <TestimonialsCarousel />
          </div>

          {/* Countdown Timer */}
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
                <Bell className="w-5 h-5 animate-bounce" />
                <span className="text-lg font-bold uppercase tracking-wide">Encerra Hoje!</span>
              </div>
              <p className="text-slate-400 mb-3">A promoção encerra em breve</p>
              <div className="text-3xl sm:text-4xl font-bold text-white">
                Termina em: <span className="text-orange-400">{formatTime(timeLeft)}</span>
              </div>
              <p className="text-slate-500 text-sm mt-3">Condição válida para novos usuários GestorChef</p>
            </div>
          </div>

          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <CreditCard className="w-8 h-8 text-blue-400" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white">Escolha Seu Plano</h2>
            </div>
            <p className="text-lg text-slate-400">⚡ Todos os planos estão com desconto nesse momento</p>
          </div>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-3 gap-4 md:gap-0 max-w-5xl mx-auto mt-10">

            {/* Mensal Plan */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-l-2xl md:rounded-r-none flex flex-col">
              <div className="text-center mb-6">
                <p className="text-xs text-slate-500 mb-1">Ideal para testar</p>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Mensal</h3>
                <p className="text-slate-500 line-through text-sm">De R$ 197</p>
                <div className="flex items-end justify-center gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-300">R$ 67</span>
                  <span className="text-slate-500 mb-1">/mês</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-6 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Tudo Incluído:</p>
                <ul className="space-y-3 text-sm">
                  {[
                    { bold: "Gestão de Estoque Completa", text: "com alertas automáticos" },
                    { bold: "Histórico de Estoque", text: "com rastreabilidade total" },
                    { bold: "Requisição de Compras", text: "organizada e prática" },
                    { bold: "Precificação Inteligente", text: "com análise de custos" },
                    { bold: "Fichas Técnicas Profissionais", text: "em PDF" },
                    { bold: "Gestão de Equipe", text: "com permissões personalizadas" },
                    { bold: "Usuários Ilimitados", text: "- cadastre toda sua equipe" },
                    { bold: "Produtos Ilimitados", text: "- sem limite de cadastros" },
                    { bold: "Acesso Mobile e Desktop", text: "- use de qualquer lugar" },
                    { bold: "Suporte Prioritário WhatsApp", text: "- tire suas dúvidas" },
                    { bold: "Minicurso Completo Incluído", text: "- aprenda em minutos" },
                    { bold: "Atualizações Gratuitas", text: "- sempre a última versão" }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-400">
                      <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong className="text-slate-300">{item.bold}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link href="/api/stripe/public-checkout?plan=monthly">
                  <Button variant="outline" className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Assinar Agora
                  </Button>
                </Link>
                <p className="text-center text-xs text-slate-500 mt-3">Cancele quando quiser</p>
              </div>
            </div>

            {/* Annual Plan - Highlighted */}
            <div className="p-6 bg-white border-2 border-orange-500 rounded-2xl flex flex-col shadow-2xl shadow-orange-500/20 md:scale-105 z-10 relative mt-8 md:mt-0">
              {/* Badge positioned completely above the card */}
              <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white text-sm font-bold px-6 py-2.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-2 uppercase tracking-wide">
                  <Star className="w-4 h-4 fill-white" />
                  Mais Popular
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Anual</h3>
                <div className="inline-block bg-orange-100 text-orange-600 text-xs font-bold px-3 py-1 rounded-full mb-2">
                  ⭐ Melhor custo-benefício
                </div>
                <div className="inline-block bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-2 ml-1">
                  Economize mais de 70%
                </div>
                <p className="text-slate-400 line-through text-sm">De R$ 997</p>
                <div className="flex items-end justify-center gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-orange-500">39,90</span>
                  <span className="text-slate-500 mb-1">12x</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Acesso por 1 ano completo</p>
              </div>

              <div className="border-t border-slate-200 pt-6 flex-1">
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-4 flex items-center gap-1">
                  <Star className="w-3 h-3 text-orange-500 fill-orange-500" />
                  Tudo Incluído:
                </p>
                <ul className="space-y-3 text-sm">
                  {[
                    { bold: "Gestão de Estoque Completa", text: "com alertas automáticos" },
                    { bold: "Histórico de Estoque", text: "com rastreabilidade total" },
                    { bold: "Requisição de Compras", text: "organizada e prática" },
                    { bold: "Precificação Inteligente", text: "com análise de custos" },
                    { bold: "Fichas Técnicas Profissionais", text: "em PDF" },
                    { bold: "Gestão de Equipe", text: "com permissões personalizadas" },
                    { bold: "Usuários Ilimitados", text: "- cadastre toda sua equipe" },
                    { bold: "Produtos Ilimitados", text: "- sem limite de cadastros" },
                    { bold: "Acesso Mobile e Desktop", text: "- use de qualquer lugar" },
                    { bold: "Suporte Prioritário WhatsApp", text: "- tire suas dúvidas" },
                    { bold: "Minicurso Completo Incluído", text: "- aprenda em minutos" },
                    { bold: "Atualizações Gratuitas", text: "- sempre a última versão" }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600">
                      <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong className="text-slate-800">{item.bold}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link href="/api/stripe/public-checkout?plan=yearly">
                  <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold text-base">
                    Começar Agora
                  </Button>
                </Link>
                <p className="text-center text-xs text-slate-500 mt-3">Cancele quando quiser</p>
              </div>
            </div>

            {/* Semestral Plan */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl md:rounded-r-2xl md:rounded-l-none flex flex-col">
              <div className="text-center mb-6">
                <p className="text-xs text-orange-400 mb-1">Ótimo desconto</p>
                <h3 className="text-xl font-bold text-slate-300 mb-2">Semestral</h3>
                <p className="text-slate-500 line-through text-sm">De R$ 699</p>
                <div className="flex items-end justify-center gap-1 mt-2">
                  <span className="text-4xl font-extrabold text-slate-300">59,90</span>
                  <span className="text-slate-500 mb-1">6x</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Acesso por 6 meses</p>
              </div>

              <div className="border-t border-slate-800 pt-6 flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">Tudo Incluído:</p>
                <ul className="space-y-3 text-sm">
                  {[
                    { bold: "Gestão de Estoque Completa", text: "com alertas automáticos" },
                    { bold: "Histórico de Estoque", text: "com rastreabilidade total" },
                    { bold: "Requisição de Compras", text: "organizada e prática" },
                    { bold: "Precificação Inteligente", text: "com análise de custos" },
                    { bold: "Fichas Técnicas Profissionais", text: "em PDF" },
                    { bold: "Gestão de Equipe", text: "com permissões personalizadas" },
                    { bold: "Usuários Ilimitados", text: "- cadastre toda sua equipe" },
                    { bold: "Produtos Ilimitados", text: "- sem limite de cadastros" },
                    { bold: "Acesso Mobile e Desktop", text: "- use de qualquer lugar" },
                    { bold: "Suporte Prioritário WhatsApp", text: "- tire suas dúvidas" },
                    { bold: "Minicurso Completo Incluído", text: "- aprenda em minutos" },
                    { bold: "Atualizações Gratuitas", text: "- sempre a última versão" }
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-400">
                      <CheckCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                      <span><strong className="text-slate-300">{item.bold}</strong> {item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-6">
                <Link href="/api/stripe/public-checkout?plan=semestral">
                  <Button variant="outline" className="w-full h-11 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                    Assinar Agora
                  </Button>
                </Link>
                <p className="text-center text-xs text-slate-500 mt-3">Cancele quando quiser</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/30 border-t border-slate-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wide mb-4">
              <HelpCircle className="w-3 h-3" />
              FAQ
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Perguntas Frequentes</h2>
            <p className="text-lg text-slate-400">Tire todas as suas dúvidas sobre o GestorChef. Se precisar de mais informações, nossa equipe está disponível para ajudar.</p>
          </div>

          <Accordion type="single" collapsible className="space-y-3">
            {[
              {
                q: "Não entendo de tecnologia. Vou conseguir usar?",
                a: "Sim! O GestorChef foi criado para ser extremamente simples e intuitivo. Além disso, você recebe um minicurso completo que ensina tudo em poucos minutos. Sua equipe aprende rapidamente e pode usar direto do celular sem complicação."
              },
              {
                q: "Não tenho tempo para cadastrar tudo. Como faço?",
                a: "Você não precisa fazer tudo sozinho! Seus colaboradores podem cadastrar e atualizar o estoque direto do celular. Você só acompanha os resultados e toma decisões. Além disso, o tempo investido no início é mínimo comparado ao tempo (e dinheiro) que você economiza todo mês."
              },
              {
                q: "Funciona em qualquer dispositivo?",
                a: "Sim! O GestorChef é 100% online e responsivo. Funciona perfeitamente em computador, tablet ou celular (Android e iOS). Você e sua equipe podem acessar de qualquer lugar, a qualquer hora."
              },
              {
                q: "É seguro? Meus dados ficam protegidos?",
                a: "Totalmente seguro! Todos os dados são armazenados em servidores protegidos com criptografia de ponta a ponta. Fazemos backups automáticos diários e seguimos os mais altos padrões de segurança da informação."
              },
              {
                q: "Quanto tempo leva para começar a usar?",
                a: "Você pode começar a usar imediatamente após a assinatura. Com o minicurso incluso, em menos de 30 minutos você já estará usando o sistema. A maioria dos clientes vê resultados já no primeiro mês."
              },
              {
                q: "Preciso de internet o tempo todo?",
                a: "Sim, o GestorChef é uma plataforma online. Mas isso traz vantagens: você acessa de qualquer lugar, nunca perde dados, não precisa instalar nada e recebe atualizações automáticas sem custo extra."
              },
              {
                q: "Posso cancelar quando quiser?",
                a: "Sim! Você pode cancelar a qualquer momento, sem burocracia e sem taxa de cancelamento. Não há multa, período de carência ou pegadinhas. Acreditamos que você vai ficar pela qualidade do sistema, não por contrato."
              },
              {
                q: "Tem limite de usuários ou produtos?",
                a: "Não! Todos os planos incluem usuários ilimitados e produtos ilimitados. Você pode cadastrar toda sua equipe e todo seu estoque sem pagar nada a mais por isso."
              },
              {
                q: "Vocês oferecem suporte? Como funciona?",
                a: "Sim! Todos os planos incluem suporte prioritário via WhatsApp. Nossa equipe responde rapidamente e te ajuda com qualquer dúvida ou dificuldade. Você nunca fica sozinho."
              },
              {
                q: "Qual a diferença entre os planos?",
                a: "Todos os planos têm as mesmas funcionalidades, usuários ilimitados e suporte prioritário. A diferença está apenas no período de pagamento e no desconto: o plano anual tem o melhor preço mensal, seguido do semestral."
              },
              {
                q: "E se eu não souber usar ou não me adaptar?",
                a: "O sistema é muito intuitivo e vem com minicurso completo. Mas caso você não se adapte, pode cancelar quando quiser sem multa. Nossa taxa de satisfação é altíssima justamente porque o sistema é fácil e resolve problemas reais."
              },
              {
                q: "Meu restaurante é pequeno. O sistema serve pra mim?",
                a: "Sim! O GestorChef foi feito para negócios de todos os tamanhos. Se você compra, produz ou vende alimentos, o sistema é para você. Quanto menor o negócio, maior o impacto de evitar desperdícios e controlar melhor o estoque."
              },
              {
                q: "Preciso de contador ou pessoa técnica pra ajudar?",
                a: "Não! O sistema é feito para donos de negócios de comida, não para técnicos. Tudo é visual, intuitivo e em português claro. Se você sabe usar WhatsApp, vai saber usar o GestorChef."
              },
              {
                q: "Como vocês calculam a precificação?",
                a: "Você insere o custo dos insumos, custos fixos e margem desejada. O sistema calcula automaticamente o preço ideal, mostra gráficos detalhados dos custos e compara sua margem real com a desejada. Tudo de forma visual e fácil de entender."
              },
              {
                q: "Posso testar antes de assinar?",
                a: "O sistema é tão intuitivo e a proposta é tão clara que milhares de clientes assinaram sem testar e ficaram extremamente satisfeitos. Além disso, você pode cancelar quando quiser, então não há risco. Garantimos que você vai economizar e lucrar mais já no primeiro mês."
              }
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border border-slate-800 rounded-lg px-4 bg-slate-900/50">
                <AccordionTrigger className="text-white hover:text-orange-400 hover:no-underline text-left py-4">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-slate-400 pb-4">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>



      {/* Footer */}
      <footer className="py-12 px-4 border-t border-slate-800 bg-slate-950">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-white">ChefControl</span>
          </div>
          <p className="text-slate-600 text-sm">© 2025 ChefControl. Todos os direitos reservados.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/politica-de-privacidade" className="hover:text-white transition-colors">Política de Privacidade</Link>
            <Link href="/termos-de-uso" className="hover:text-white transition-colors">Termos de Uso</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

// Testimonials Carousel Component
function TestimonialsCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const testimonials = [
    { src: "/testimonial-1.jpg", alt: "Depoimento Pedro - ChefControl" },
    { src: "/testimonial-2.jpg", alt: "Depoimento Ana Lúcia - ChefControl" },
    { src: "/testimonial-3.jpg", alt: "Depoimento Carlos Augusto - ChefControl" },
  ]

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  return (
    <div className="relative">
      {/* Carousel Container */}
      <div className="relative overflow-hidden rounded-2xl shadow-2xl shadow-orange-500/10">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {testimonials.map((testimonial, idx) => (
            <div key={idx} className="w-full flex-shrink-0">
              <Image
                src={testimonial.src}
                alt={testimonial.alt}
                width={400}
                height={700}
                className="w-full h-auto"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Dots */}
      <div className="flex justify-center gap-2 mt-4">
        {testimonials.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-3 h-3 rounded-full transition-all ${currentSlide === idx
              ? "bg-orange-500 w-6"
              : "bg-slate-600 hover:bg-slate-500"
              }`}
            aria-label={`Ver depoimento ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}

function ClipboardList(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M9 14h6" />
      <path d="M9 18h6" />
      <path d="M9 10h6" />
    </svg>
  )
}
