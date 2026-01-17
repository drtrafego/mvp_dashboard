# Documentação Frontend - Estoque Restaurante

Esta documentação detalha a arquitetura frontend do sistema "Estoque Restaurante". O projeto utiliza **Next.js 14+ (App Router)** com foco em performance, modularidade e experiência do usuário (UX).

---

## 1. Stack e Tecnologias

*   **Framework Principal**: Next.js 14.2 (App Router)
*   **Linguagem**: TypeScript
*   **Biblioteca UI**: React 18+
*   **Estilização**: Tailwind CSS (Utilitários)
*   **Componentes Base**: Shadcn/ui (Radix UI headless + Tailwind)
*   **Ícones**: Lucide React
*   **Gerenciamento de Estado**: React Context API (`StockContext`) + React Hooks

---

## 2. Estrutura de Diretórios (`src/`)

### `/app` (Roteamento)
O roteamento é baseado em arquivos (File-system based routing).

*   **(Auth)**
    *   `/login`: Página de entrada e seleção de fluxo.
    *   `/register`: Cadastro de novos tenants.
    *   `/handler`: Callbacks de autenticação (Stack Auth).
*   **(Dashboard)** - Layout protegido para tenants.
    *   `/dashboard`: Visão geral (métricas).
    *   `/dashboard/stock-entry`: Entrada/Saída de estoque.
    *   `/dashboard/history`: Histórico de Logs.
    *   `/dashboard/purchase-request`: Gestão de pedidos de compra.
    *   `/dashboard/technical-sheets`: Fichas técnicas e receitas.
    *   `/dashboard/pricing`: Precificação de pratos.
    *   `/dashboard/settings`: Configurações da empresa e equipe.
*   **(Super Admin)** - Área restrita administrativa.
    *   `/super-admin/organizations`: Gestão de tenants.
    *   `/super-admin/users`: Gestão global de usuários.

### `/components` (Biblioteca de Componentes)

#### `/ui` (Design System)
Componentes primitivos reutilizáveis baseados em Shadcn/ui:
*   `button.tsx`, `input.tsx`, `card.tsx`: Blocos básicos.
*   `dialog.tsx`, `sheet.tsx`: Modais e painéis laterais.
*   `table.tsx`: Estruturas de dados tabulares.
*   `tabs.tsx`: Navegação interna em páginas.

#### Feature Components (Lógica de Negócio)
Componentes "inteligentes" que carregam lógica específica:

*   **Estoque**:
    *   `inventory-manager-new.tsx`: Tabela principal de estoque com filtros e colunas dinâmicas.
    *   `stock-entry-form.tsx`: Formulário complexo para movimentação (Entrada/Saída/Perda).
*   **Financeiro/Receitas**:
    *   `pricing-content.tsx`: Calculadora de precificação e margem.
    *   `technical-sheets-content.tsx`: Editor de receitas e ingredientes.
*   **Gestão**:
    *   `settings-content.tsx`: Gerenciamento de perfil e usuários da empresa.
    *   `edit-user-dialog.tsx`: Modal reutilizável para edição de usuários.
    *   `create-product-dialog.tsx`: Cadastro de produtos com upload de imagem.

### `/context` (Estado Global)

*   **`StockContext`**: Contexto principal da aplicação.
    *   **Responsabilidade**: Armazenar e distribuir dados de Produtos, Categorias e Logs para evitar prop-drilling.
    *   **Métodos**: `fetchProducts()`, `addProduct()`, `updateProduct()`.
    *   **Uso**: Envolve toda a aplicação em `providers.tsx`.

---

## 3. Padrões de Desenvolvimento

### 3.1 Client vs Server Components
*   **Server Components (Padrão)**: Usados para buscar dados iniciais (Data Fetching) nas páginas (`page.tsx`) e passar para os componentes filhos.
*   **Client Components (`"use client"`)**: Usados em componentes que requerem:
    *   Interatividade (onClick, onChange).
    *   Estado (useState, useEffect).
    *   Hooks do navegador.
    *   Exemplos: Tabelas interativas, Formulários, Modais.

### 3.2 Fetching de Dados
A aplicação utiliza uma combinação de:
1.  **Server-side**: `prisma.findMany` em `page.tsx` para SEO e performance inicial.
2.  **Client-side**: `fetch('/api/...')` dentro de `useEffect` ou `Context` para atualizações em tempo real sem recarregar a página (ex: ao adicionar um produto).

### 3.3 Estilização e Temas
*   **Tailwind CSS**: Usado para 100% da estilização.
*   **Variáveis CSS**: Cores principais definidas em `globals.css` (`--primary`, `--secondary`, etc) permitindo fácil alteração de temas (Dark/Light mode suportado nativamente).

---

## 4. UI/UX Highlights

*   **Feedback Visual**: Toasts (notificações flutuantes) para sucesso/erro em todas as operações CRUD.
*   **Loading States**: Skeletons e spinners durante carregamento de dados.
*   **Responsividade**: Layout adaptável (Mobile First) utilizando classes `md:`, `lg:` do Tailwind.
*   **Acessibilidade**: Componentes do Radix UI garantem navegação via teclado e suporte a leitores de tela.

---

> Documentação gerada especificamente para a camada de apresentação (Frontend) em 04/01/2026.
