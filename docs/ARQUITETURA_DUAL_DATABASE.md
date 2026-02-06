# Arquitetura Dual-Database - HyperDash + CRM

## Visão Geral

O HyperDash utiliza uma arquitetura de **dois bancos de dados Neon separados** para otimizar performance, custos e escalabilidade.

```
┌──────────────────────────────────────────────────────┐
│            HYPERDASH - Aplicação Unificada           │
│              (Next.js 15 + TypeScript)               │
└──────────────────────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
┌───────▼──────────┐           ┌─────────▼──────────┐
│   NEON 1: CRM    │           │   NEON 2: BI       │
│  (Transacional)  │           │  (Analytics)       │
├──────────────────┤           ├────────────────────┤
│ OLTP - Fast      │           │ OLAP - Complex     │
│ Writes           │           │ Queries            │
├──────────────────┤           ├────────────────────┤
│ • leads          │           │ • organizations    │
│ • contacts       │           │ • users            │
│ • deals          │           │ • integrations     │
│ • tasks          │           │ • campaignMetrics  │
│ • notes          │           │ • aiCreativeInsights│
│ • activities     │           │ • sessions         │
└──────────────────┘           └────────────────────┘
        │                                 │
        └────────────┬────────────────────┘
                     │
        ┌────────────▼─────────────┐
        │  CORRELATION SERVICE     │
        │  (Lead Attribution)      │
        │                          │
        │  Joins:                  │
        │  • Lead → Campaign       │
        │  • CPA → Lead Value      │
        │  • Hook Rate → Conv Rate │
        └──────────────────────────┘
```

---

## Por Que 2 Bancos?

### 1. Performance Isolada

**CRM Database (OLTP):**

- Milhares de escritas por dia (novos leads, updates)
- Queries simples e rápidas (`SELECT * FROM leads WHERE id = ?`)
- Necessita baixa latência constante

**BI Database (OLAP):**

- Leitura intensiva, escritas em batch
- Queries complexas com agregações e joins
- Pode ter latência maior, mas processa grandes volumes

**Benefício:** Queries de analytics não impactam a velocidade do CRM.

### 2. Custos Otimizados (Neon Pricing)

Neon cobra por **compute time**:

- CRM precisa estar **always-on** (usuários interagindo o tempo todo)
- BI pode usar **autoscaling/auto-suspend** (ativa só quando gera relatórios)

**Economia estimada:** 40-60% em compute costs do BI.

### 3. Escalabilidade Independente

- CRM cresce com número de leads (linear)
- BI cresce com **histórico** de métricas (exponencial - dados retidos por anos)

**BI pode ter 50GB+ de métricas** enquanto CRM tem apenas 5GB de leads ativos.

### 4. Estratégias de Backup Diferentes

- **CRM:** Backup a cada 1 hora (dados críticos)
- **BI:** Backup diário (dados podem ser recalculados via API)

---

## Schema de Correlação

### Tabela de Ligação (lead_attribution)

Armazenada no **BI Neon** para manter analytics centralizados:

```typescript
export const leadAttribution = pgTable("lead_attribution", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  
  // Referências
  leadId: uuid("lead_id").notNull(), // ID do lead no CRM Neon
  campaignId: text("campaign_id").notNull(),
  adId: text("ad_id"),
  adSetId: text("ad_set_id"),
  
  // Dados de Atribuição
  source: text("source"), // 'meta', 'google', 'organic'
  medium: text("medium"),
  utmCampaign: text("utm_campaign"),
  utmContent: text("utm_content"),
  utmTerm: text("utm_term"),
  
  // Métricas no Momento da Conversão
  cpaAtConversion: numeric("cpa_at_conversion", { precision: 10, scale: 2 }),
  roas: numeric("roas", { precision: 10, scale: 2 }),
  
  // Touchpoints (Jornada)
  touchpoints: jsonb("touchpoints"), // Array de interações antes da conversão
  
  // Timestamps
  firstTouch: timestamp("first_touch"),
  lastTouch: timestamp("last_touch"),
  conversionDate: timestamp("conversion_date").notNull(),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

---

## Configuração de Ambiente

### .env Structure

```env
# ===== CRM DATABASE (Neon 1) =====
# Banco transacional - Leads, Contacts, Deals
CRM_DATABASE_URL="postgresql://user:pass@crm-project.neon.tech/crm"

# ===== BI DATABASE (Neon 2) =====
# Banco analítico - Campaigns, Metrics, AI Insights
BI_DATABASE_URL="postgresql://user:pass@bi-project.neon.tech/hyperdash"

# ===== SHARED CONFIGS =====
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
META_APP_ID="..."
META_APP_SECRET="..."
META_ACCESS_TOKEN="..."
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"
ENCRYPTION_KEY="..."
```

### Drizzle Instances

```typescript
// src/server/db/crm.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const crmSql = neon(process.env.CRM_DATABASE_URL!);
export const crmDb = drizzle(crmSql);

// src/server/db/bi.ts (já existe como db/index.ts)
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const biSql = neon(process.env.BI_DATABASE_URL!);
export const biDb = drizzle(biSql);
```

---

## Serviço de Correlação

### Lead Attribution Service

Conecta dados de ambos os bancos para análise unificada:

```typescript
// src/server/services/lead-correlation.ts
import { crmDb } from "@/server/db/crm";
import { biDb } from "@/server/db/bi";
import { campaignMetrics, leadAttribution } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export class LeadCorrelationService {
  /**
   * Analisa qualidade de campanha baseado em conversão de leads
   */
  async getCampaignLeadQuality(organizationId: string, campaignId: string) {
    // 1. Buscar métricas da campanha (BI)
    const campaign = await biDb
      .select()
      .from(campaignMetrics)
      .where(eq(campaignMetrics.campaignId, campaignId))
      .limit(1);

    // 2. Buscar leads atribuídos (BI -> Lead Attribution)
    const attributedLeads = await biDb
      .select()
      .from(leadAttribution)
      .where(eq(leadAttribution.campaignId, campaignId));

    // 3. Buscar status dos leads (CRM) - assume tabela leads existe
    // const leadStatuses = await crmDb.select().from(leads)
    //   .where(inArray(leads.id, attributedLeads.map(a => a.leadId)));

    return {
      campaignName: campaign[0]?.campaignName,
      totalLeads: attributedLeads.length,
      cpa: parseFloat(campaign[0]?.cpa || '0'),
      // leadConversionRate: calculado após buscar CRM
      // averageLeadValue: calculado após buscar CRM
    };
  }

  /**
   * Atribui lead a uma campanha (webhook integration)
   */
  async attributeLead(data: {
    organizationId: string;
    leadId: string;
    campaignId: string;
    source: string;
    utmParams: Record<string, string>;
  }) {
    await biDb.insert(leadAttribution).values({
      organizationId: data.organizationId,
      leadId: data.leadId,
      campaignId: data.campaignId,
      source: data.source,
      utmCampaign: data.utmParams.utm_campaign,
      utmContent: data.utmParams.utm_content,
      conversionDate: new Date(),
    });
  }
}

export const leadCorrelationService = new LeadCorrelationService();
```

---

## Fluxo de Dados

### 1. Captura de Lead (Webhook)

```
Landing Page Form Submit
         │
         ▼
┌─────────────────────┐
│  Webhook Handler    │
│  (Next.js API)      │
└─────────────────────┘
         │
         ├──────────────────────┐
         │                      │
         ▼                      ▼
   ┌─────────┐          ┌──────────────┐
   │ CRM DB  │          │   BI DB      │
   │ (Lead)  │          │ (Attribution)│
   └─────────┘          └──────────────┘
```

### 2. Análise de Performance

```
Dashboard Request
         │
         ▼
┌─────────────────────────────┐
│  Analytics Service          │
└─────────────────────────────┘
         │
         ├──────────────┬─────────────┐
         ▼              ▼             ▼
    ┌────────┐    ┌─────────┐   ┌────────┐
    │ CRM DB │    │  BI DB  │   │AI Svc  │
    │ Leads  │    │Campaigns│   │Insights│
    └────────┘    └─────────┘   └────────┘
         │              │             │
         └──────────────┴─────────────┘
                    │
                    ▼
            ┌──────────────┐
            │ Unified JSON │
            │  Response    │
            └──────────────┘
```

---

## Migração Futura (CRM Existente → Novo Esquema)

Se você já tem um CRM, a migração é simples:

```sql
-- No CRM Neon existente, adicionar campos:
ALTER TABLE leads 
ADD COLUMN campaign_id TEXT,
ADD COLUMN ad_id TEXT,
ADD COLUMN utm_source TEXT,
ADD COLUMN utm_campaign TEXT,
ADD COLUMN attribution_synced BOOLEAN DEFAULT FALSE;

-- Criar job que sincroniza para BI Neon:
INSERT INTO bi.lead_attribution (lead_id, campaign_id, source, conversion_date)
SELECT id, campaign_id, utm_source, created_at 
FROM crm.leads 
WHERE attribution_synced = FALSE;

UPDATE crm.leads SET attribution_synced = TRUE;
```

---

## Vantagens de Negócio

### Para Gestores de Tráfego

1. **Visão Completa do Funil:**
   - "Esta campanha tem CPA de $50, mas 80% dos leads não convertem"
   - "Esta campanha tem CPA de $80, mas 60% dos leads se tornam clientes"

2. **ROI Real vs Projetado:**
   - Meta mostra ROAS 3.5x (baseado em pixel)
   - HyperDash mostra ROAS real 2.1x (baseado em vendas fechadas no CRM)

3. **Otimização Inteligente:**
   - "Pause criativo X: Hook Rate alto, mas leads de baixa qualidade"
   - "Escale criativo Y: CPA médio, mas leads convertem 3x mais"

---

## Custos Aproximados (Neon)

| Banco | Tamanho Estimado | Compute | Custo/Mês |
|-------|------------------|---------|-----------|
| CRM   | 5-10 GB         | Always-on | $19-29   |
| BI    | 20-50 GB        | Auto-suspend | $10-15 |
| **Total** |             |         | **$29-44** |

**vs Banco Único:** $50-70/mês (sempre at full capacity)

**Economia:** ~30-40%

---

## Próximos Passos de Implementação

1. ✅ **Criar schema de `lead_attribution`** (já incluído)
2. ✅ **Configurar 2 instâncias Drizzle** (CRM + BI)
3. ✅ **Criar Lead Correlation Service**
4. ⚠️ **Configurar .env com 2 DATABASE_URLs**
5. ⚠️ **Criar webhook endpoint para captura de leads**
6. ⚠️ **Dashboard unificado mostrando correlação**

---

## Referências

- [Neon Autoscaling](https://neon.tech/docs/introduction/autoscaling)
- [Drizzle Multi-Schema](https://orm.drizzle.team/docs/schemas)
- [Lead Attribution Models](https://en.wikipedia.org/wiki/Attribution_(marketing))
