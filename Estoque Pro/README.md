# ChefControl - Sistema de Gestão de Estoque para Restaurantes

Bem-vindo à documentação técnica do **ChefControl**. Este documento abrange a arquitetura, funcionalidades, instalação e detalhes operacionais do sistema.

> **Última Atualização:** 14/01/2026
> **Versão:** 1.0.0

---

## 🚀 Visão Geral
O **ChefControl** é um sistema SaaS (Multi-tenant) desenvolvido para gestão profissional de estoque em restaurantes, bares e lanchonetes. Ele automatiza o controle de custos (CMV), sugere compras baseadas em estoque mínimo e gerencia a validade de produtos para evitar desperdícios.

### Principais Objetivos
1.  **Controle Preciso:** Monitoramento em tempo real de "Qtd Atual" vs "Estoque Mínimo".
2.  **Prevenção de Perdas:** Alertas visuais e relatórios de produtos vencendo.
3.  **Compras Inteligentes:** Geração automatizada de requisições de compra baseadas na demanda real.

---

## 🛠 Stack Tecnológica

### Frontend
-   **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
-   **Linguagem:** TypeScript
-   **Estilização:** Tailwind CSS v4
-   **Componentes:** Shadcn UI (baseado em Radix UI)
-   **Ícones:** Lucide React

### Backend
-   **Server:** Next.js Server Actions & API Routes
-   **ORM:** Prisma
-   **Banco de Dados:** PostgreSQL (Hospedado via Vercel Postgres ou similar)

### Integrações & Serviços
-   **Autenticação:** Stack Auth / Privy Integration
-   **Pagamentos:** Stripe (Gestão de Assinaturas e Webhooks para criação automática de tenants)
-   **Emails:** Resend (Emails transacionais)

---

## 📦 Funcionalidades Detalhadas

### 1. Gestão de Estoque (`/inventory`)
Painel central onde o operador visualiza toda a lista de produtos.
-   **Status Coloridos:**
    -   🔴 **Sem Estoque:** Qtd = 0
    -   🟡 **Baixo Estoque:** Qtd < Mínimo
    -   🔵 **Vencendo:** Data de validade próxima (configurável, padrão 5-15 dias)
    -   🟢 **Ok:** Estoque saudável

### 2. Entrada de Estoque (`/stock-entry`)
Funcionalidade crítica para atualização diária ou semanal (Inventário Cego).
-   **Modo Individual:**
    -   Permite atualizar um único produto.
    -   **Flexibilidade:** Aceita atualização apenas da **Validade** sem alterar a quantidade (mantém o estoque atual).
    -   *Código:* `src/components/stock-entry-new.tsx`
-   **Modo em Lote (Grid):**
    -   Lista todos os produtos por categoria.
    -   **Detecção Inteligente:** O sistema detecta automaticamente se o usuário alterou Qtd, Validade ou ambos.
    -   *Segurança:* Bloqueia salvamento vazio; exige pelo menos um campo preenchido.

### 3. Requisição de Compra (`/purchase-request`)
Gera lista de compras para fornecedores.
-   **Algoritmo de Sugestão:** Calcula `(Estoque Mínimo - Atual) + Margem de Segurança (20%)`.
-   **Lógica de Prioridade:**
    -   Ao selecionar itens automaticamente, o sistema prioriza: `Sem Estoque > Vencendo > Baixo Estoque`.
    -   **Seleção Manual:** Botões de filtro (Cards no topo) aplicam a seleção desejada com prioridade absoluta ("último clique vence"), dando controle total ao gestor.
-   **Exportação:** Gera PDF formatado profissionalmente para envio via WhatsApp.

### 4. Categorias Padrão
O sistema opera com uma lista padronizada de categorias para manter a organização:
-   Proteínas, Hortifruti, Mercearia Seca, Laticínios e Frios, Molhos/Temperos, Bebidas, Padaria, Sobremesas.
-   *Automação:* Criadas automaticamente via Webhook do Stripe para novos usuários e via script de seed para legados.

### 5. Fichas Técnicas (`/recipes`)
Cadastro detalhado de pratos que consomem itens do estoque, permitindo cálculo automático de custo e baixa de estoque (futuro).

### 6. Suporte
-   **Botão Flutuante:** Ícone do WhatsApp fixo no canto inferior direito para contato direto com o suporte técnico (+5491164067625).

---

## 🔐 Autenticação e Segurança (Auth)

O sistema utiliza uma abordagem moderna de autenticação passwordless/mágica otimizada via **Stack Auth**.

### Fluxo de Login
1.  Usuário insere email.
2.  Recebe código OTP (One Time Password).
3.  Validação cria sessão segura nos cookies.

### Tenant Context (`src/lib/tenant.ts`)
Cada requisição é validada para garantir isolamento de dados entre restaurantes (Multi-tenancy). O `getTenantContext()` recupera:
-   `organizationId`: ID do restaurante.
-   `role`: ADMIN ou STAFF.
-   `subscriptionStatus`: Verifica se o pagamento está ativo no Stripe.

---

## 📡 API Reference

A API é interna e protegida via sessão.

### Endpoints Principais

#### `POST /api/stock`
Atualiza a quantidade e validade de um produto.
-   **Body:** `{ productId, quantity, expiresAt? }`
-   **Validação:** Verifica propriedade do produto pela OrganizationId. Lança erro legível se falhar.

#### `POST /api/webhooks/stripe`
Ponto crucial de entrada de novos clientes.
1.  Recebe evento `checkout.session.completed`.
2.  Cria `Organization` (Slug único).
3.  Cria `User` (Admin).
4.  Cria `Category` (Lista padrão).
5.  Envia email de boas-vindas.

---

## ⚙️ Configuração e Instalação

### Pré-requisitos
-   Node.js 18+
-   PostgreSQL
-   Conta Stripe (Dev/Live)

### Instalação Local

1.  Clone o repositório:
    ```bash
    git clone https://github.com/drtrafego/restaurante-estoque.git
    ```

2.  Instale dependências:
    ```bash
    npm install
    ```

3.  Configure `.env` (baseado em `.env.example`).

4.  Prepare o Banco de Dados:
    ```bash
    npx prisma generate
    npx prisma db push
    ```

5.  Rode o servidor de desenvolvimento:
    ```bash
    npm run dev
    ```

### Scripts Úteis
-   `npm run db:seed`: Popula banco com dados fictícios para teste.
-   `npx tsx prisma/seed-default-categories.ts`: Injeta categorias padrão em organizações existentes.

---

## 📞 Suporte e Manutenção

Para reportar bugs ou solicitar features críticas, utilize o canal oficial no WhatsApp integrado ao sistema.

---
*© 2026 ChefControl. Todos os direitos reservados.*
