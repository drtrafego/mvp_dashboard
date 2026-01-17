# Documentação Técnica - Estoque Restaurante

Esta documentação fornece uma visão técnica abrangente do sistema SaaS "Estoque Restaurante". Este software é uma plataforma multi-tenant projetada para gerenciamento de estoque, fichas técnicas e processos de compras para restaurantes.

---

## 1. Visão Geral da Arquitetura

O sistema é construído sobre uma arquitetura moderna baseada em **Next.js 14+ (App Router)** com renderização do lado do servidor (SSR) e componentes do cliente (Client Components) onde interatividade é necessária.

### Stack Tecnológica
*   **Framework**: Next.js 14 (React)
*   **Linguagem**: TypeScript
*   **Banco de Dados**: PostgreSQL
*   **ORM**: Prisma
*   **Estilização**: Tailwind CSS + Shadcn/ui
*   **Autenticação**: Stack Auth / Privy (Integrado via `src/lib/auth`)
*   **Gerenciamento de Estado**: React Hooks (useState, useEffect, Context API)

### Estrutura de Pastas Principal
*   `src/app`: Rotas da aplicação (App Router).
    *   `/api`: Endpoints de API (Route Handlers).
    *   `/super-admin`: Painel exclusivo do proprietário do SaaS.
    *   `/dashboard`: Painel principal do usuário (tenant).
*   `src/components`: Componentes reutilizáveis (UI) e específicos.
*   `src/lib`: Bibliotecas utilitárias (`db.ts` para Prisma, `utils.ts`, `tenant.ts` para contexto).
*   `prisma`: Schema do banco de dados e migrações.

---

## 2. Multi-tenancy e Controle de Acesso (RBAC)

O sistema utiliza uma abordagem de **Multi-tenancy Lógico**, onde todos os dados residem no mesmo banco de dados, mas são segregados por uma coluna `organizationId` (foreign key) nas tabelas relevantes.

### Níveis de Acesso (Roles)
O enum `Role` define os níveis de permissão:

1.  **SUPER_ADMIN**
    *   **Escopo**: Global (Todo o sistema).
    *   **Permissões**:
        *   Gerenciar todas as Organizações (Criar, Editar, Ativar/Desativar, Definir Limites).
        *   Gerenciar todos os Usuários Globalmente (Criar, Editar, Remover de qualquer empresa).
        *   Acesso a métricas globais do SaaS.
    *   **Contexto**: `organizationId` é opcional ou nulo.

2.  **ADMIN**
    *   **Escopo**: Organização Específica.
    *   **Permissões**:
        *   Gestão total da sua empresa (Produtos, Categorias, Estoque).
        *   Gerenciar Staff da sua própria empresa (Adicionar/Remover membros).
        *   Configurações da empresa.
    *   **Limitação**: Não pode acessar dados de outras empresas.

3.  **STAFF**
    *   **Escopo**: Organização Específica.
    *   **Permissões**:
        *   Operacional: Movimentar estoque, ver produtos, criar pedidos de compra.
        *   Visualização limitada (geralmente não vê configurações sensíveis ou gestão de usuários).

### Segurança (Middleware e Contexto)
A função utilitária `getTenantContext()` em `src/lib/tenant.ts` é fundamental para a segurança. Ela:
*   Verifica a sessão do usuário.
*   Retorna `organizationId`, `role`, `isSuperAdmin`, etc.
*   Garante que operações de banco de dados sejam sempre filtradas pelo `organizationId` do contexto (exceto para Super Admin).

---

## 3. Principais Funcionalidades

### Gestão de Organizações (Super Admin)
*   **Interface Unificada**: Edição de dados da empresa e gestão de membros em um único modal com abas ("Dados da Empresa" e "Membros").
*   **Gestão de Membros Integrada**: Listagem, adição, remoção e **edição completa** (Nome, Email, Função, Status) de usuários diretamente na tela de edição da empresa.
*   **Limites de Plano**: Controle granular de `maxUsers` e `maxProducts` por empresa.
*   **Status**: Ativação/Desativação de empresas (bloqueia acesso).
*   **Gestão de Admin**: Capacidade de alterar o e-mail do administrador principal.

### Gestão de Usuários
*   **Nível Empresa (Admin)**: Pode convidar staff para sua equipe.
*   **Nível Global (Super Admin)**: Interface unificada para buscar, editar e remover qualquer usuário do sistema, independente da empresa.

### Estoque e Produtos
*   **Produtos e Categorias**: Cadastro completo com suporte a imagens.
*   **Movimentação de Estoque**: Entradas e saídas registradas em `StockLog`.
*   **Fichas Técnicas**: Composição de pratos baseada em produtos/ingredientes.

### Compras
*   **Pedidos de Compra**: Fluxo de status (`DRAFT` -> `SENT` -> `RECEIVED`).

---

## 4. Modelo de Dados (Schema Simplificado)

Os principais modelos do `prisma.schema` são:

*   `Organization`: Entidade central do tenant.
    *   Campos: `name`, `slug`, `plan`, `maxUsers`, `maxProducts`, `isActive`.
*   `User`: Usuários do sistema.
    *   Campos: `email`, `role`, `organizationId` (Link para a empresa).
*   `Product`, `Category`, `StockLog`: Dados de negócio pertencentes a uma `Organization`.

---

## 5. Manutenção e Comandos Úteis

### Banco de Dados
*   Atualizar schema: `npx prisma db push`
*   Ver dados (GUI): `npx prisma studio`

### Desenvolvimento
*   Rodar localmente: `npm run dev`
*   Build de produção: `npm run build`
*   Linting: `npm run lint`

---

> **Nota**: Documentação gerada em 03/01/2026, refletindo a versão mais recente com funcionalidades completas de Super Admin.
