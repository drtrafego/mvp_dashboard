import { getTenantContext } from "@/lib/tenant"
import { AppLayout } from "@/components/app-layout"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const VIDEOS = [
    {
        id: "MoL5tJd3iik",
        title: "Aula 1: Introdução ao Sistema",
        description: "Bem-vindo ao curso introdutório. Nesta aula você aprenderá os conceitos básicos para começar.",
        explanation: "Visão geral da dashboard, navegação inicial e configurações básicas da sua conta."
    },
    {
        id: "ZqFs5RXdbIQ",
        title: "Aula 2: Gestão de Estoque e Compras",
        description: "Aprenda a gerenciar seu inventário de forma eficiente e evitar desperdícios.",
        explanation: "Como cadastrar produtos, realizar entradas de estoque e gerar requisições de compra."
    },
    {
        id: "G8TvI_sK6pM",
        title: "Aula 3: Fichas Técnicas e Precificação",
        description: "Domine a engenharia de cardápio criando fichas técnicas detalhadas e precificando corretamente.",
        explanation: "Criação passo a passo de fichas técnicas, cálculo de custos e definição de preço de venda."
    }
]

export default async function MiniCoursePage() {
    const context = await getTenantContext()

    if (!context) {
        redirect("/login")
    }

    const userName = context.userName || "Usuário"
    const displayRole = context.isSuperAdmin ? "Super Administrador"
        : context.isAdmin ? "Administrador"
            : "Operador"

    return (
        <AppLayout
            userName={userName}
            userRole={displayRole}
            isAdmin={context.isAdmin}
            isSuperAdmin={context.isSuperAdmin}
        >
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Mini Curso: Domine o Sistema</h1>
                    <p className="text-muted-foreground mt-2">
                        Aprenda a utilizar todas as funcionalidades do sistema com nossos especialistas.
                    </p>
                </div>

                {/* 
                   Desktop Adjustment: w-[90%] makes it occupy 90% of available space (10% smaller than full).
                   This should be closer to the "20% smaller" request than the previous max-w-6xl which was too small.
                */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 w-[90%] mx-auto">
                    {VIDEOS.map((video, index) => (
                        <Card key={index} className="flex flex-col overflow-hidden">
                            <CardHeader className="pb-3">
                                <div className="mb-2">
                                    <Badge variant="outline" className="w-fit">
                                        Aula {index + 1}
                                    </Badge>
                                </div>
                                {/* Descrição acima do vídeo conforme solicitado */}
                                <CardDescription className="text-base font-medium text-foreground">
                                    {video.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1 space-y-4">
                                {/* Vídeo no meio */}
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black/5 border border-border">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${video.id}`}
                                        title={video.title}
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="absolute inset-0"
                                    />
                                </div>

                                {/* Título/Explicação abaixo do vídeo */}
                                <div>
                                    <h3 className="font-semibold text-lg">{video.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {video.explanation}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </AppLayout>
    )
}
