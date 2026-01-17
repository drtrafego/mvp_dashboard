"use client"

import Link from "next/link"
import { ChefHat, ArrowLeft } from "lucide-react"

export default function TermosDeUso() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-300">
            {/* Header */}
            <header className="border-b border-slate-800 py-4 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-orange-500">
                        <ChefHat className="w-6 h-6" />
                        <span className="font-bold text-white">ChefControl</span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Termos de Uso</h1>
                    <p className="text-slate-400 mb-8">Última atualização: Janeiro de 2025</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
                            <p>
                                Ao acessar ou utilizar o ChefControl, você concorda com estes Termos de Uso.
                                Se você não concorda com algum aspecto destes termos, não deve utilizar nossos serviços.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
                            <p className="mb-4">
                                O ChefControl é uma plataforma de gestão de estoque desenvolvida para restaurantes,
                                bares e estabelecimentos do setor alimentício. Nossos serviços incluem:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Controle de estoque com alertas automáticos</li>
                                <li>Fichas técnicas e precificação</li>
                                <li>Gestão de equipe e permissões</li>
                                <li>Requisições de compra</li>
                                <li>Relatórios e análises</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. Cadastro e Conta</h2>
                            <p className="mb-4">Para utilizar o ChefControl, você deve:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Ter pelo menos 18 anos ou capacidade legal para contratar</li>
                                <li>Fornecer informações verdadeiras, precisas e atualizadas</li>
                                <li>Manter a confidencialidade de suas credenciais de acesso</li>
                                <li>Ser responsável por todas as atividades em sua conta</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. Planos e Pagamentos</h2>
                            <p className="mb-4">
                                O ChefControl oferece planos de assinatura mensal, semestral e anual. Ao assinar:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Os pagamentos são processados de forma segura pelo Stripe</li>
                                <li>A cobrança é recorrente conforme o plano escolhido</li>
                                <li>Você pode cancelar a qualquer momento, sem taxas de rescisão</li>
                                <li>Após o cancelamento, o acesso permanece até o fim do período pago</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. Uso Aceitável</h2>
                            <p className="mb-4">Você concorda em não:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Violar leis ou regulamentos aplicáveis</li>
                                <li>Tentar acessar sistemas não autorizados</li>
                                <li>Transmitir vírus ou código malicioso</li>
                                <li>Compartilhar credenciais de acesso com terceiros não autorizados</li>
                                <li>Usar o serviço para fins ilegais ou não autorizados</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">6. Propriedade Intelectual</h2>
                            <p>
                                O ChefControl, incluindo sua marca, design, código e conteúdo, é protegido por
                                direitos autorais e outras leis de propriedade intelectual. Você recebe apenas
                                uma licença limitada para usar o serviço conforme estes termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">7. Limitação de Responsabilidade</h2>
                            <p>
                                O ChefControl é fornecido "como está". Não garantimos que o serviço será
                                ininterrupto ou livre de erros. Em nenhum caso seremos responsáveis por
                                danos indiretos, incidentais ou consequenciais decorrentes do uso do serviço.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">8. Modificações</h2>
                            <p>
                                Reservamos o direito de modificar estes termos a qualquer momento.
                                Alterações significativas serão comunicadas com antecedência. O uso
                                continuado após as modificações constitui aceitação dos novos termos.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">9. Rescisão</h2>
                            <p>
                                Podemos suspender ou encerrar seu acesso ao serviço se você violar estes termos
                                ou por outros motivos legítimos, com aviso prévio quando possível.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">10. Lei Aplicável</h2>
                            <p>
                                Estes termos são regidos pelas leis da República Federativa do Brasil.
                                Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer litígios.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">11. Contato</h2>
                            <p>
                                Para dúvidas sobre estes termos, entre em contato através do e-mail:
                                <a href="mailto:contato@chefcontrol.com.br" className="text-orange-400 hover:underline ml-1">contato@chefcontrol.com.br</a>
                            </p>
                        </section>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-800 py-8 px-4 sm:px-6 lg:px-8 mt-12">
                <div className="max-w-4xl mx-auto text-center text-sm text-slate-500">
                    © 2025 ChefControl. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    )
}
