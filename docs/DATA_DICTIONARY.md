# HyperDash - Data Dictionary

## Métricas Universais (Todas as Plataformas)

| Métrica | Campo | Fórmula | Descrição |
|---------|-------|---------|-----------|
| Impressões | `impressions` | - | Número de vezes que o anúncio foi exibido |
| Cliques | `clicks` | - | Total de cliques no anúncio |
| CTR | `ctr` | `(clicks / impressions) * 100` | Taxa de cliques (Click-Through Rate) |
| CPC | `cpc` | `spend / clicks` | Custo por clique médio |
| CPM | `cpm` | `(spend / impressions) * 1000` | Custo por mil impressões |
| Spend | `spend` | - | Valor total gasto |
| Conversões | `conversions` | - | Total de conversões atribuídas |
| CVR | `cvr` | `(conversions / clicks) * 100` | Taxa de conversão |
| CPA | `cpa` | `spend / conversions` | Custo por aquisição/conversão |
| ROAS | `roas` | `conversion_value / spend` | Retorno sobre investimento em anúncios |

---

## Métricas Meta Ads (Facebook/Instagram)

| Métrica | Campo | Fórmula | Descrição |
|---------|-------|---------|-----------|
| **Hook Rate** | `hook_rate` | `(video_views_3s / impressions) * 100` | Taxa de "gancho" - % de usuários que assistiram pelo menos 3 segundos do vídeo |
| **Hold Rate** | `hold_rate` | `(video_views_75 / video_views_3s) * 100` | Taxa de retenção - % dos que assistiram 3s e continuaram até 75%+ |
| Frequência | `frequency` | `impressions / reach` | Média de vezes que cada pessoa viu o anúncio |
| Visualizações 3s | `video_views_3s` | - | Total de views de 3+ segundos (ThruPlay) |
| Visualizações 75% | `video_views_75` | - | Total de views até 75% do vídeo |
| Visualizações 100% | `video_completes` | - | Total de completions do vídeo |
| Taxa de Engajamento | `engagement_rate` | `(engagements / impressions) * 100` | Curtidas, comentários, compartilhamentos |

### API Meta - Campos Utilizados

```
impressions, clicks, spend, video_p25_watched_actions, 
video_p50_watched_actions, video_p75_watched_actions, 
video_p100_watched_actions, frequency, actions, action_values
```

---

## Métricas Google Ads

| Métrica | Campo | Fórmula | Descrição |
|---------|-------|---------|-----------|
| Impression Share | `impression_share` | - | Parcela de impressões recebidas vs possíveis |
| **IS Lost (Budget)** | `impression_share_lost_budget` | - | Parcela perdida por orçamento insuficiente |
| **IS Lost (Rank)** | `impression_share_lost_rank` | - | Parcela perdida por Ad Rank baixo |
| **Quality Score** | `quality_score` | - | Índice de qualidade 1-10 (relevância, CTR esperado, landing page) |

### API Google Ads - Campos Utilizados

```
metrics.impressions, metrics.clicks, metrics.cost_micros,
metrics.conversions, metrics.conversions_value,
metrics.search_impression_share, metrics.search_budget_lost_impression_share,
metrics.search_rank_lost_impression_share, segments.keyword.info.quality_score
```

---

## Métricas GA4 (Google Analytics 4)

| Métrica | Campo | Fórmula | Descrição |
|---------|-------|---------|-----------|
| Sessões | `sessions` | - | Total de sessões no período |
| **Sessões Engajadas** | `engaged_sessions` | - | Sessões com >10s, 2+ pageviews, ou conversão |
| **Tempo Médio Engajamento** | `avg_engagement_time` | - | Tempo médio de interação ativa |
| Usuários Ativos | `active_users` | - | Usuários únicos ativos |
| Taxa de Rejeição | `bounce_rate` | - | Sessões sem engajamento |
| **Taxa de Engajamento** | `engagement_rate_ga4` | `(engaged_sessions / sessions) * 100` | Sessões engajadas / total |

### API GA4 - Dimensões e Métricas

```
dimensions: date, sessionSource, sessionMedium, deviceCategory
metrics: sessions, engagedSessions, averageSessionDuration, 
         userEngagementDuration, activeUsers, bounceRate
```

---

## Correlações AI

### Hook Rate vs CPA

- **Alto Hook Rate + Baixo CPA** = Criativo de alta performance ✅
- **Alto Hook Rate + Alto CPA** = Problema de landing page ou oferta
- **Baixo Hook Rate + Baixo CPA** = Público qualificado, criativo precisa melhorar
- **Baixo Hook Rate + Alto CPA** = Criativo e conversão precisam revisão ❌

### Performance Prediction Levels

| Score | Nível | Descrição |
|-------|-------|-----------|
| 7-10 | HIGH | Alto potencial de conversão |
| 4-6 | MEDIUM | Performance moderada |
| 1-3 | LOW | Requer otimização urgente |

---

## Tabelas do Banco de Dados

### `campaign_metrics`

Armazena métricas unificadas de todas as plataformas, vinculadas por `organizationId` para isolamento multi-tenant.

### `ad_account_settings`

IDs de configuração por organização:

- `google_ads_customer_id` (000-000-0000)
- `facebook_ad_account_id` (act_xxxxxxxx)
- `ga4_property_id` (números)

### `ai_creative_insights`

Análises AI de criativos:

- Score de performance (1-10)
- Recomendações
- Correlações Hook Rate ↔ CPA
