"use client"

import Link from "next/link"
import { ChefHat, ArrowLeft } from "lucide-react"

export default function PoliticaDePrivacidade() {
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
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-8">Política de Privacidade</h1>
                    <p className="text-slate-400 mb-8">Última atualização: Janeiro de 2025</p>

                    <div className="space-y-8 text-slate-300 leading-relaxed">
                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">1. Informações que Coletamos</h2>
                            <p className="mb-4">
                                O ChefControl coleta informações que você nos fornece diretamente ao usar nossos serviços, incluindo:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Informações de cadastro (nome, e-mail, telefone)</li>
                                <li>Dados da empresa (nome do estabelecimento, CNPJ)</li>
                                <li>Informações de pagamento processadas pelo Stripe</li>
                                <li>Dados de estoque e produtos cadastrados</li>
                                <li>Registros de acesso e uso da plataforma</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">2. Como Usamos Suas Informações</h2>
                            <p className="mb-4">Utilizamos as informações coletadas para:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Fornecer, manter e melhorar nossos serviços</li>
                                <li>Processar transações e enviar notificações relacionadas</li>
                                <li>Enviar comunicações sobre atualizações e novidades</li>
                                <li>Prevenir fraudes e garantir a segurança da plataforma</li>
                                <li>Cumprir obrigações legais</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">3. Compartilhamento de Dados</h2>
                            <p className="mb-4">
                                Não vendemos suas informações pessoais. Podemos compartilhar dados apenas:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Com provedores de serviços (Stripe para pagamentos, hospedagem em nuvem)</li>
                                <li>Quando exigido por lei ou ordem judicial</li>
                                <li>Para proteger direitos, propriedade ou segurança</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">4. Segurança dos Dados</h2>
                            <p>
                                Implementamos medidas de segurança técnicas e organizacionais para proteger suas informações,
                                incluindo criptografia de dados em trânsito e em repouso, controles de acesso rigorosos
                                e monitoramento contínuo de nossos sistemas.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">5. Seus Direitos</h2>
                            <p className="mb-4">De acordo com a LGPD, você tem direito a:</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Acessar seus dados pessoais</li>
                                <li>Corrigir dados incompletos ou inexatos</li>
                                <li>Solicitar a exclusão de seus dados</li>
                                <li>Revogar o consentimento a qualquer momento</li>
                                <li>Solicitar a portabilidade dos dados</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">6. Cookies</h2>
                            <p>
                                Utilizamos cookies e tecnologias similares para melhorar sua experiência,
                                analisar o uso da plataforma e personalizar conteúdos. Você pode gerenciar
                                suas preferências de cookies nas configurações do seu navegador.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">7. Encarregado de Dados (DPO)</h2>
                            <p>
                                Conforme exigido pela LGPD, designamos um Encarregado de Proteção de Dados (DPO)
                                para atender às suas solicitações relacionadas aos seus dados pessoais.
                            </p>
                            <p className="mt-2">
                                <strong className="text-white">Encarregado:</strong> Equipe de Privacidade ChefControl<br />
                                <strong className="text-white">E-mail:</strong>{" "}
                                <a href="mailto:privacidade@chefcontrol.online" className="text-orange-400 hover:underline">
                                    privacidade@chefcontrol.online
                                </a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">8. Retenção de Dados</h2>
                            <p className="mb-4">
                                Mantemos seus dados pessoais pelos seguintes períodos:
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Dados de conta e perfil: enquanto a conta estiver ativa</li>
                                <li>Dados de estoque e produtos: enquanto a conta estiver ativa</li>
                                <li>Logs de atividade: 2 anos a partir do registro</li>
                                <li>Dados de pagamento: conforme exigências legais (5 anos)</li>
                            </ul>
                            <p className="mt-4">
                                Após a exclusão da conta, seus dados são removidos em até 30 dias,
                                exceto quando houver obrigação legal de retenção.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">9. Contato</h2>
                            <p>
                                Para dúvidas sobre esta política ou exercer seus direitos, entre em contato conosco
                                através do e-mail: <a href="mailto:contato@chefcontrol.online" className="text-orange-400 hover:underline">contato@chefcontrol.online</a>
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-white mb-4">10. Alterações nesta Política</h2>
                            <p>
                                Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas
                                por e-mail ou através de aviso em destaque na plataforma.
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
