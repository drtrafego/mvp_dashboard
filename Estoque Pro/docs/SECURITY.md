# 🔐 Guia de Segurança - Gestor de Estoque para Restaurantes

Este documento descreve as práticas de segurança implementadas e as configurações necessárias para deploy seguro.

---

## Variáveis de Ambiente Obrigatórias

### Autenticação

```env
# OBRIGATÓRIO - Chave secreta para JWT
# Gerar com: openssl rand -base64 32
AUTH_SECRET=sua_chave_secreta_muito_longa_aqui

# Super Admin - email com acesso total ao sistema
SUPER_ADMIN_EMAIL=seu@email.com
```

### Stack Auth

```env
NEXT_PUBLIC_STACK_PROJECT_ID=seu_project_id
STACK_SECRET_SERVER_KEY=sua_server_key
```

### Banco de Dados

```env
# Use conexão SSL em produção
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
```

### Rate Limiting (Produção)

```env
# Upstash Redis para rate limiting distribuído
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

---

## Práticas de Segurança Implementadas

### 1. Autenticação & Autorização

| Prática | Status | Detalhes |
|---------|--------|----------|
| Autenticação via Stack Auth | ✅ | OAuth e magic links |
| Sessões JWT | ✅ | Tokens seguros com expiração |
| RBAC (Role-Based Access) | ✅ | 3 níveis: SUPER_ADMIN, ADMIN, STAFF |
| Sem credenciais hardcoded | ✅ | Removidas do código |
| AUTH_SECRET obrigatório | ✅ | Falha se não configurado |

### 2. Proteção de APIs

| Prática | Status | Detalhes |
|---------|--------|----------|
| Rate Limiting | ✅ | 100 req/min geral, 30 req/min escritas |
| Validação de entrada | ✅ | Zod schemas em todas as APIs |
| Autenticação em todos endpoints | ✅ | getTenantContext() obrigatório |
| Isolamento multi-tenant | ✅ | organizationId em todas as queries |
| Verificação de propriedade | ✅ | Recursos verificados antes de modificar |

### 3. Headers de Segurança

| Header | Valor | Proteção |
|--------|-------|----------|
| Content-Security-Policy | Configurado | XSS, injeção |
| X-Frame-Options | DENY | Clickjacking |
| X-Content-Type-Options | nosniff | MIME sniffing |
| Referrer-Policy | strict-origin-when-cross-origin | Vazamento de dados |
| Permissions-Policy | Restritivo | APIs perigosas |
| X-Powered-By | Removido | Fingerprinting |

### 4. Validação de Dados

- Todos os inputs validados com Zod
- Limites de tamanho em strings
- Validação de tipos numéricos
- Sanitização de emails
- IDs validados no formato CUID

### 5. Logging & Auditoria

- Sistema de audit log implementado
- Detecção de atividades suspeitas
- Logging de falhas de autenticação
- Rastreamento de ações críticas

---

## Checklist de Deploy Seguro

### Antes do Deploy

- [ ] **AUTH_SECRET** configurado com valor forte (32+ bytes)
- [ ] **SUPER_ADMIN_EMAIL** definido
- [ ] **DATABASE_URL** usando SSL (`?sslmode=require`)
- [ ] Variáveis do Stack Auth configuradas
- [ ] Domínio configurado no Stack Auth dashboard

### Configuração do Servidor

- [ ] HTTPS habilitado (obrigatório)
- [ ] Certificado SSL válido
- [ ] Firewall configurado (permitir apenas 80, 443)
- [ ] Backups automáticos do banco de dados
- [ ] Logs de acesso habilitados

### Após o Deploy

- [ ] Testar login/logout
- [ ] Verificar headers de segurança no browser
- [ ] Testar rate limiting
- [ ] Verificar isolamento entre organizações
- [ ] Monitorar logs de erro

---

## Configurações de Produção Recomendadas

### Vercel

```json
// vercel.json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=31536000; includeSubDomains"
        }
      ]
    }
  ]
}
```

### Redis para Rate Limiting

Para ambientes com múltiplas instâncias, descomentar o código em `src/lib/rate-limit.ts` e configurar:

```env
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxx
```

### Logging Externo

Para logging avançado em produção, configurar em `src/lib/audit-log.ts`:

```env
# Logtail
LOGTAIL_TOKEN=your_token

# Ou Datadog
DD_API_KEY=your_api_key

# Ou Sentry
SENTRY_DSN=https://...
```

---

## Resposta a Incidentes

### Se detectar atividade suspeita

1. **Imediato**: Verificar logs de auditoria
2. **Avaliar**: Identificar IPs e usuários envolvidos
3. **Bloquear**: Usar `blockIP()` se necessário
4. **Investigar**: Revisar ações realizadas
5. **Remediar**: Resetar credenciais se comprometidas
6. **Documentar**: Registrar o incidente

### Contatos de Emergência

- **Admin do Sistema**: [seu email]
- **Suporte Host**: [contato do host]
- **Banco de Dados**: [suporte do DB]

---

## Atualizações de Segurança

### Verificar Dependências

```bash
# Verificar vulnerabilidades conhecidas
npm audit

# Atualizar dependências com correções
npm audit fix

# Atualizar todas as dependências
npm update
```

### Manter Atualizado

- [ ] Verificar npm audit semanalmente
- [ ] Atualizar Next.js quando novas versões saírem
- [ ] Monitorar CVEs relacionados às dependências
- [ ] Revisar logs de auditoria regularmente

---

## Recursos Adicionais

- [OWASP Top 10](https://owasp.org/Top10/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/security)
- [Stack Auth Docs](https://docs.stack-auth.com/)
