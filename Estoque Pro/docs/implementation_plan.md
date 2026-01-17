# Plano de Implementação: Controle de Acesso por Roles (RBAC)

## Objetivo
Implementar sistema de permissões baseado em 3 roles: **SUPER_ADMIN**, **ADMIN** e **STAFF**.

---

## Matriz de Permissões

| Funcionalidade | SUPER_ADMIN | ADMIN | STAFF |
|----------------|:-----------:|:-----:|:-----:|
| **Dashboard** | ✅ | ✅ | ✅ |
| **Estoque (CRUD)** | ✅ | ✅ | ✅ |
| **Fichas Técnicas - Criar/Editar** | ✅ | ✅ | ❌ |
| **Fichas Técnicas - Ver/PDF** | ✅ | ✅ | ✅ |
| **Precificação** | ✅ | ✅ | ❌ |
| **Requisição de Compra** | ✅ | ✅ | ✅ |
| **Histórico** | ✅ | ✅ | ✅ |
| **Ver Todas as Empresas** | ✅ | ❌ | ❌ |
| **Adicionar Staff às Empresas** | ✅ | ✅ (só sua) | ❌ |
| **Editar Empresa** | ✅ | ✅ (só sua) | ❌ |

---

## Proposed Changes

### 1. Lib de Permissões
#### [NEW] `src/lib/permissions.ts`
Criar helper functions para verificar permissões:
- `canCreateTechnicalSheet(role)`
- `canEditTechnicalSheet(role)`
- `canAccessPricing(role)`
- `canManageOrganization(role)`
- `canViewAllOrganizations(role)`
- `canAddStaff(role)`

---

### 2. Componentes de UI

#### [MODIFY] `src/components/technical-sheets-content.tsx`
- Passar `userRole` como prop
- Esconder botões "Nova Ficha" e "Editar" para STAFF
- Manter "Ver Detalhes" e "PDF" para todos

#### [MODIFY] `src/components/pricing-content.tsx`
- Passar `userRole` como prop
- Esconder toda a funcionalidade para STAFF (mostrar mensagem "Acesso restrito")

#### [MODIFY] `src/components/sidebar.tsx`
- Esconder link "Precificação" para STAFF
- Mostrar link "Empresas" apenas para SUPER_ADMIN

---

### 3. Páginas

#### [MODIFY] `src/app/super-admin/organizations/page.tsx`
- Adicionar funcionalidade para:
  - Listar todas as empresas
  - Abrir/editar cada empresa
  - Listar todas as empresas
  - Abrir/editar cada empresa
  - Adicionar staff às empresas
  - **Editar Limites do Plano**: `maxUsers`, `maxProducts`
  - **Editar Status**: `isActive` (toggle) no modal

#### [MODIFY] `src/app/super-admin/users/page.tsx`
- Implementar **CRUD de Usuários Global**:
  - Listar todos os usuários (com paginação/filtro por organização)
  - Criar usuário (para qualquer organização)
  - Editar usuário (Name, Email, Role, Organization, Status)
  - Excluir usuário

#### [MODIFY] `src/app/dashboard/page.tsx`
- Passar `userRole` para componentes filhos

#### [MODIFY] `src/app/technical-sheets/page.tsx`
- Passar `userRole` para TechnicalSheetsContent

#### [MODIFY] `src/app/pricing/page.tsx`
- Verificar role e bloquear acesso para STAFF

---

### 4. APIs

#### [MODIFY] `src/lib/tenant.ts`
- Retornar o `role` do usuário no contexto do tenant

#### [MODIFY] APIs existentes
- Adicionar verificação de role onde necessário

---

## Verification Plan

### Teste Manual
1. Login como SUPER_ADMIN (dr.trafego@gmail.com)
   - Verificar acesso a todas as funcionalidades
   - Verificar acesso à página de Empresas

2. Login como ADMIN (criar usuário de teste)
   - Verificar acesso a tudo exceto Empresas globais

3. Login como STAFF (criar usuário de teste)
   - Verificar que NÃO pode criar/editar fichas técnicas
   - Verificar que NÃO pode acessar precificação
   - Verificar que PODE ver fichas técnicas e baixar PDF

---

## Prioridade de Implementação

1. ✅ Criar `src/lib/permissions.ts`
2. ✅ Modificar `tenant.ts` para retornar role
3. ✅ Aplicar permissões em `technical-sheets-content.tsx`
4. ✅ Aplicar permissões em `pricing-content.tsx`
5. ✅ Modificar sidebar para esconder links por role
6. ✅ Melhorar página de Empresas para SUPER_ADMIN
