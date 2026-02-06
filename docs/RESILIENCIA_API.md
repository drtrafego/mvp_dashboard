# Resiliência de API e Tratamento de Erros

## Overview

Este documento detalha como o HyperDash lida com falhas de API, rate limits e inconsistências de dados das plataformas de anúncios.

---

## 1. Meta Graph API - Desafios e Soluções

### Rate Limits

**Limite:** 200 chamadas/hora por App por User
**Estratégia Implementada:**

```typescript
// src/server/services/meta-ads.ts
class RateLimiter {
  private callCount = 0;
  private resetTime = Date.now() + 3600000; // 1 hour

  async checkLimit() {
    if (Date.now() > this.resetTime) {
      this.callCount = 0;
      this.resetTime = Date.now() + 3600000;
    }
    
    if (this.callCount >= 180) { // 20 calls buffer
      throw new Error("RATE_LIMIT_APPROACHING");
    }
    
    this.callCount++;
  }
}
```

**Tratamento de Erro:**

- Erro 400 (Rate Limit): Aguarda 5 minutos e retenta automaticamente
- Erro 190 (Token Expired): Tenta refresh automático do token
- Erro 100 (Invalid Parameter): Loga erro e notifica admin

### Dados Ausentes

**Problema:** Meta pode retornar `null` para `actions` se não houver conversões.
**Solução:**

```typescript
const conversions = metric.actions?.find(a => a.action_type === "purchase")?.value || "0";
```

### Delay de Dados

- **Insight Data:** ~15 minutos de delay
- **Creative Data:** Pode levar até 1 hora para estar disponível
- **Solução:** Cache de 1 hora + refresh em background

---

## 2. Google Ads API - Desafios e Soluções

### Autenticação OAuth

**Problema:** Access tokens expiram em 1 hora
**Solução:**

```typescript
async function refreshGoogleToken(refreshToken: string) {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: decrypt(refreshToken),
      grant_type: "refresh_token",
    }),
  });
  
  if (!response.ok) {
    throw new Error("TOKEN_REFRESH_FAILED");
  }
  
  const data = await response.json();
  return encrypt(data.access_token);
}
```

### Cost Micros Conversion

**Problema:** Google retorna custos em "micros" (1/1,000,000 da moeda)
**Solução:** Normalização automática

```typescript
const spend = (metrics.cost_micros / 1_000_000).toFixed(2);
```

### Impression Share Null

**Problema:** Impression Share só está disponível para campanhas de Search
**Tratamento:**

```typescript
impressionShare: metrics.search_impression_share || null
```

---

## 3. GA4 - Desafios e Soluções

### Delay de Dados

**Problema:** GA4 pode ter delay de até 48 horas
**Solução:**

- Mostrar aviso visual no dashboard: "Dados GA4: Última atualização há X horas"
- Não usar GA4 para decisões em tempo real

### Métricas Customizadas

**Problema:** Eventos customizados podem ter nomes diferentes por cliente
**Solução:**

```typescript
// Permitir mapeamento customizado em integrations.settings
{
  "ga4_conversion_event": "purchase", // ou "lead" ou custom
  "ga4_property_id": "GA4-XXXXX"
}
```

---

## 4. Normalização de Dados - Schema Unificado

### Mapeamento Spend/Cost

```typescript
// Meta Ads
const metaSpend = parseFloat(metric.spend);

// Google Ads
const googleSpend = metric.cost_micros / 1_000_000;

// Unified
await db.insert(campaignMetrics).values({
  spend: spend.toFixed(2), // Always 2 decimals
  organizationId, // MANDATORY isolation
});
```

### Tratamento de Valores Nulos

```typescript
// REGRA: Nunca armazenar null, sempre usar default
{
  impressions: metric.impressions || 0,
  clicks: metric.clicks || 0,
  conversions: metric.conversions || 0,
  ctr: metric.clicks > 0 ? (metric.clicks / metric.impressions) : 0,
}
```

---

## 5. Multi-Client Concurrency

### Problema: 50 clientes atualizando ao mesmo tempo

**Estratégia:**

1. **Job Queue:** Implementar fila com Bull/BullMQ
2. **Rate Limit por Org:** Máximo 10 requests/min por organização
3. **Prioridade:** Clientes pagos têm prioridade na fila

### Exemplo de Implementação (Futuro)

```typescript
import Queue from 'bull';

const fetchQueue = new Queue('meta-ads-fetch');

fetchQueue.process(async (job) => {
  const { organizationId, accountId } = job.data;
  
  try {
    const data = await metaAdsService.fetchCampaignInsights(
      token,
      accountId
    );
    await normalizeAndSave(data, organizationId);
  } catch (error) {
    if (error.code === 'RATE_LIMIT') {
      await job.retry({ delay: 300000 }); // Retry in 5 min
    }
  }
});
```

---

## 6. Error Logging Strategy

### Estrutura do Log

```typescript
interface APIError {
  timestamp: Date;
  organizationId: string;
  provider: 'meta' | 'google' | 'ga4';
  errorCode: string;
  errorMessage: string;
  endpoint: string;
  retryCount: number;
  resolved: boolean;
}
```

### Alertas Críticos

- Token expirado sem refresh token: Email admin imediatamente
- 3 falhas consecutivas: Desabilitar integração temporariamente
- Rate limit atingido: Log e tentar novamente em 1 hora

---

## 7. Consistência de Dados

### Validação Pré-Insert

```typescript
function validateMetrics(data: any): boolean {
  // CTR nunca pode ser > 100%
  if (data.ctr > 1.0) return false;
  
  // Spend nunca pode ser negativo
  if (data.spend < 0) return false;
  
  // Conversões nunca podem ser > clicks
  if (data.conversions > data.clicks) return false;
  
  return true;
}
```

### Reconciliação de Dados

- **Diário:** Comparar totais agregados com dashboard da plataforma
- **Se divergência > 5%:** Reprocessar últimos 7 dias

---

## 8. Monitoring & Observability

### Métricas a Monitorar

- API Success Rate (por provider)
- Average Response Time
- Token Refresh Success Rate
- Data Freshness (última atualização bem-sucedida)

### Ferramentas Recomendadas

- **Logs:** Vercel/Railway built-in logs
- **APM:** Sentry para error tracking
- **Uptime:** Uptime Robot para health checks

---

## Status Atual de Implementação

✅ **Implementado:**

- Normalização de dados (spend, conversions)
- Validação básica de métricas
- organizationId isolation

⚠️ **Parcialmente Implementado:**

- Token refresh (estrutura pronta, needs testing)
- Error handling (try/catch presente, needs retry logic)

❌ **Pendente:**

- Job Queue para background processing
- Rate limiting avançado
- Monitoring dashboard
