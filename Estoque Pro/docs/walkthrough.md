# Walkthrough do Sistema - Estoque Restaurante

Este documento serve como um guia de verificação e demonstração das funcionalidades implementadas, focando nas recentes melhorias de infraestrutura, segurança (RBAC) e administração.

---

## 1. Visão Geral (Super Admin)

O painel do Super Admin (`/super-admin`) é o centro de controle do SaaS.

### Gestão de Organizações
**Localização**: `/super-admin/organizations`

*   **Listagem**: Visualização de todas as empresas com métricas chave (Total de Usuários, Produtos, Status).
*   **Edição Unificada**: Ao clicar no ícone de editar (✏️) em uma empresa, abre-se um modal com duas abas:
    1.  **Dados da Empresa**:
        *   Alterar Nome, Slug e Email do Administrador.
        *   Definir Plano (Free, Pro, Enterprise).
        *   Ajustar Limites (`maxUsers`, `maxProducts`).
        *   Ativar/Desativar a empresa (bloqueio imediato de acesso).
    2.  **Membros**:
        *   Visualizar toda a equipe daquela empresa específica.
        *   **Adicionar Usuário**: Criar novos membros diretamente para a empresa.
        *   **Edição Completa**: Alterar **Nome**, **Email**, **Função** (Admin/Staff) e **Status** (Ativo/Inativo) de qualquer usuário.
        *   **Remover**: Excluir usuários da empresa.

### Gestão Global de Usuários
**Localização**: `/super-admin/users`

*   **Visão Geral**: Tabela pesquisável com *todos* os usuários do sistema, de todas as organizações.
*   **Filtros**: Busca por nome ou email.
*   **Ações**:
    *   Criar usuário avulso e atribuir a uma organização existente.
    *   Editar permissões e dados de acesso globalmente.
    *   Desativar usuários suspeitos ou inadimplentes.

---

## 2. Visão do Tenant (Admin e Staff)

O painel de controle do cliente (`/dashboard`).

### Controle de Acesso (RBAC)
O sistema adapta a interface dinamicamente baseada na role do usuário:

*   **ADMIN**:
    *   Acesso total a "Minha Equipe" (Convidar e gerenciar staff da própria empresa).
    *   Acesso a Configurações da Empresa.
    *   Pode ver e editar Preços e Fichas Técnicas.
*   **STAFF**:
    *   Não vê a aba "Minha Equipe" ou "Configurações".
    *   Pode visualizar Estoque e criar Requisições de Compra.
    *   Restrição de edição em áreas sensíveis (Preços).

### Funcionalidades Chave
1.  **Estoque**:
    *   Listagem com filtros por categoria.
    *   Colunas personalizáveis (controle do que é exibido).
    *   Histórico de movimentação (`/dashboard/history`).
2.  **Compras**:
    *   Fluxo de Requisições (`Draft` -> `Sent`).
    *   Modal de criação rápida de pedidos.
3.  **Fichas Técnicas**:
    *   Criação de receitas associando produtos do estoque.
    *   Cálculo automático de custo.

---

## 3. Validação Técnica

### Testes Realizados
*   ✅ **Fluxo de Login**: Redirecionamento correto para `/dashboard`.
*   ✅ **Proteção de Rotas**: Usuário `STAFF` tentando acessar `/api/settings` recebe 403 Forbidden.
*   ✅ **Isolamento de Dados**: Usuário da "Empresa A" não vê produtos da "Empresa B".
*   ✅ **Super Admin**:
    *   Criação de empresa: Sucesso.
    *   Edição de limites: Refletido imediatamente no tenant.
    *   Edição de Email de usuário: Persistido no banco de dados.
    *   Remoção de usuário: Acesso revogado imediatamente.

### Comandos de Manutenção
Para desenvolvedores mantendo o sistema:
*   **Sync DB**: `npx prisma db push` (Atualizar schema).
*   **Studio**: `npx prisma studio` (Ver dados brutos).
*   **Build**: `npm run build` (Verificar integridade de tipos).

---

> Documentação atualizada em: 04/01/2026
