'use client';

export function StructuredData() {
    const jsonLd = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "@id": "https://chefcontrol.online/#software",
                "name": "ChefControl",
                "applicationCategory": "BusinessApplication",
                "operatingSystem": "Web",
                "description": "Sistema completo de controle de estoque para restaurantes, bares e lanchonetes. Gerencie fichas técnicas, CMV, custos de alimentos e inventário em tempo real.",
                "url": "https://chefcontrol.online",
                "image": "https://chefcontrol.online/og-image.png",
                "offers": {
                    "@type": "Offer",
                    "price": "97.00",
                    "priceCurrency": "BRL",
                    "priceValidUntil": "2026-12-31",
                    "availability": "https://schema.org/InStock"
                },
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "127",
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "featureList": [
                    "Controle de estoque em tempo real",
                    "Fichas técnicas com cálculo de CMV",
                    "Gestão de custos de alimentos",
                    "Alertas de estoque mínimo",
                    "Relatórios de compras",
                    "Acesso multi-usuário"
                ]
            },
            {
                "@type": "Organization",
                "@id": "https://chefcontrol.online/#organization",
                "name": "ChefControl",
                "url": "https://chefcontrol.online",
                "logo": "https://chefcontrol.online/favicon.png",
                "description": "Software de gestão de estoque para restaurantes no Brasil",
                "sameAs": [],
                "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer service",
                    "availableLanguage": "Portuguese"
                }
            },
            {
                "@type": "WebSite",
                "@id": "https://chefcontrol.online/#website",
                "url": "https://chefcontrol.online",
                "name": "ChefControl",
                "description": "Sistema de Controle de Estoque para Restaurantes",
                "publisher": {
                    "@id": "https://chefcontrol.online/#organization"
                },
                "inLanguage": "pt-BR"
            },
            {
                "@type": "FAQPage",
                "@id": "https://chefcontrol.online/#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "O ChefControl funciona para qualquer tipo de restaurante?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Sim! O ChefControl é ideal para restaurantes, bares, lanchonetes, pizzarias, hamburguerias e qualquer estabelecimento que trabalhe com alimentos e bebidas."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Preciso instalar algum programa?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Não! O ChefControl funciona 100% online. Basta acessar pelo navegador do computador, tablet ou celular."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Quantas pessoas podem usar o sistema?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Você pode cadastrar quantos usuários precisar: gerentes, cozinheiros, auxiliares. Cada um com seu próprio login e permissões."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "O que são fichas técnicas?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Fichas técnicas são documentos que detalham cada receita do seu cardápio: ingredientes, quantidades, modo de preparo e custo. Essencial para padronizar a produção e calcular o CMV."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Como funciona o pagamento?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Pagamento único via cartão de crédito ou PIX. Acesso vitalício sem mensalidades."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
    );
}
