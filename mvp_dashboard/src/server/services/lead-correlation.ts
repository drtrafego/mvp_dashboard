import "server-only";
import { biDb } from "@/server/db";
import { crmDb } from "@/server/db/crm";
import { campaignMetrics, leadAttribution } from "@/server/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

interface LeadAttributionData {
    organizationId: string;
    leadId: string;
    campaignId: string;
    adId?: string;
    source: string;
    utmParams: {
        utm_campaign?: string;
        utm_content?: string;
        utm_term?: string;
        utm_medium?: string;
    };
}

interface CampaignLeadQuality {
    campaignId: string;
    campaignName: string;
    totalLeads: number;
    cpa: number;
    hookRate?: number;
    leadConversionRate?: number;
    averageLeadValue?: number;
    qualityScore: "High" | "Medium" | "Low";
    recommendation: string;
}

export class LeadCorrelationService {
    /**
     * Atribui um lead capturado a uma campanha específica
     * Chamado via webhook quando um lead é criado
     */
    async attributeLead(data: LeadAttributionData): Promise<void> {
        // Buscar métricas da campanha no momento da conversão
        const campaignData = await biDb
            .select()
            .from(campaignMetrics)
            .where(
                and(
                    eq(campaignMetrics.campaignId, data.campaignId),
                    eq(campaignMetrics.organizationId, data.organizationId)
                )
            )
            .orderBy(desc(campaignMetrics.date))
            .limit(1);

        await biDb.insert(leadAttribution).values({
            organizationId: data.organizationId,
            leadId: data.leadId,
            campaignId: data.campaignId,
            adId: data.adId,
            source: data.source,
            utmCampaign: data.utmParams.utm_campaign,
            utmContent: data.utmParams.utm_content,
            utmTerm: data.utmParams.utm_term,
            medium: data.utmParams.utm_medium,
            cpaAtConversion: campaignData[0]?.cpa,
            roas: campaignData[0]?.roas,
            conversionDate: new Date(),
            firstTouch: new Date(), // TODO: Track from cookies/session
            lastTouch: new Date(),
        });
    }

    /**
     * Analisa a qualidade de leads de uma campanha
     * Correlaciona métricas de ads com conversão real de leads
     */
    async getCampaignLeadQuality(
        organizationId: string,
        campaignId: string
    ): Promise<CampaignLeadQuality> {
        // 1. Buscar métricas da campanha (BI Database)
        const campaignData = await biDb
            .select()
            .from(campaignMetrics)
            .where(
                and(
                    eq(campaignMetrics.campaignId, campaignId),
                    eq(campaignMetrics.organizationId, organizationId)
                )
            )
            .orderBy(desc(campaignMetrics.date))
            .limit(1);

        if (!campaignData.length) {
            throw new Error(`Campaign ${campaignId} not found`);
        }

        const campaign = campaignData[0];

        // 2. Buscar leads atribuídos (BI Database)
        const attributedLeads = await biDb
            .select()
            .from(leadAttribution)
            .where(
                and(
                    eq(leadAttribution.campaignId, campaignId),
                    eq(leadAttribution.organizationId, organizationId)
                )
            );

        // 3. TODO: Buscar status dos leads do CRM Database
        // const leadStatuses = await crmDb.select()
        //   .from(leads)
        //   .where(inArray(leads.id, attributedLeads.map(a => a.leadId)));

        // 4. Calcular métricas de qualidade
        const totalLeads = attributedLeads.length;
        const cpa = parseFloat(campaign.cpa || "0");
        const hookRate = parseFloat(campaign.hookRate || "0");

        // TODO: Calcular após integração com CRM
        // const wonLeads = leadStatuses.filter(l => l.status === 'won').length;
        // const leadConversionRate = wonLeads / totalLeads;
        // const averageLeadValue = leadStatuses.reduce((sum, l) => sum + l.value, 0) / totalLeads;

        // 5. Determinar Quality Score
        let qualityScore: "High" | "Medium" | "Low" = "Medium";
        let recommendation = "";

        if (totalLeads === 0) {
            qualityScore = "Low";
            recommendation =
                "⚠️ Nenhum lead capturado ainda. Verifique se o tracking está configurado corretamente.";
        } else if (hookRate > 0.3 && cpa < 50) {
            qualityScore = "High";
            recommendation = `✅ Campanha de alta qualidade! Hook Rate ${(hookRate * 100).toFixed(1)}% e CPA $${cpa.toFixed(2)}. ${totalLeads} leads gerados.`;
        } else if (hookRate < 0.15 || cpa > 80) {
            qualityScore = "Low";
            recommendation = `⚠️ Campanha com performance baixa. ${totalLeads} leads com CPA alto ($${cpa.toFixed(2)}). Revise criativo e targeting.`;
        } else {
            recommendation = `📊 Performance moderada. ${totalLeads} leads gerados com CPA $${cpa.toFixed(2)}.`;
        }

        return {
            campaignId,
            campaignName: campaign.campaignName || "",
            totalLeads,
            cpa,
            hookRate,
            qualityScore,
            recommendation,
        };
    }

    /**
     * Retorna correlação global entre Hook Rate e Conversão de Leads
     * Para análise de tendências
     */
    async getHookRateVsConversionCorrelation(
        organizationId: string
    ): Promise<{
        campaigns: Array<{
            campaignName: string;
            hookRate: number;
            totalLeads: number;
            cpa: number;
        }>;
        insights: string;
    }> {
        // Buscar todas as campanhas com leads
        const campaigns = await biDb
            .select()
            .from(campaignMetrics)
            .where(eq(campaignMetrics.organizationId, organizationId))
            .orderBy(desc(campaignMetrics.date));

        const campaignsWithLeads = await Promise.all(
            campaigns.map(async (c) => {
                const leads = await biDb
                    .select()
                    .from(leadAttribution)
                    .where(
                        and(
                            eq(leadAttribution.campaignId, c.campaignId || ""),
                            eq(leadAttribution.organizationId, organizationId)
                        )
                    );

                return {
                    campaignName: c.campaignName || "",
                    hookRate: parseFloat(c.hookRate || "0"),
                    totalLeads: leads.length,
                    cpa: parseFloat(c.cpa || "0"),
                };
            })
        );

        // Filtrar apenas campanhas com dados válidos
        const validCampaigns = campaignsWithLeads.filter(
            (c) => c.hookRate > 0 && c.totalLeads > 0
        );

        // Análise de correlação
        const avgHookRate =
            validCampaigns.reduce((sum, c) => sum + c.hookRate, 0) /
            validCampaigns.length;
        const highHookCampaigns = validCampaigns.filter((c) => c.hookRate > 0.25);
        const avgLeadsHighHook =
            highHookCampaigns.reduce((sum, c) => sum + c.totalLeads, 0) /
            highHookCampaigns.length;

        const insights = `📊 **Análise de Correlação:**
    
- Hook Rate médio: ${(avgHookRate * 100).toFixed(1)}%
- Campanhas com Hook Rate > 25%: ${highHookCampaigns.length}
- Média de leads (Hook alto): ${avgLeadsHighHook.toFixed(0)} leads por campanha

**Conclusão:** ${avgLeadsHighHook > 50
                ? "✅ Há correlação forte entre Hook Rate alto e volume de leads."
                : "⚠️ Melhorar Hook Rate pode aumentar significativamente a captação de leads."
            }`;

        return {
            campaigns: validCampaigns,
            insights,
        };
    }

    /**
     * Atribui múltiplos touchpoints para um lead (jornada completa)
     */
    async updateLeadTouchpoints(
        leadId: string,
        touchpoint: {
            campaignId: string;
            adId: string;
            timestamp: Date;
            action: string;
        }
    ): Promise<void> {
        const existing = await biDb
            .select()
            .from(leadAttribution)
            .where(eq(leadAttribution.leadId, leadId))
            .limit(1);

        if (existing.length > 0) {
            const currentTouchpoints = (existing[0].touchpoints as any[]) || [];
            currentTouchpoints.push(touchpoint);

            // Update touchpoints
            await biDb
                .update(leadAttribution)
                .set({
                    touchpoints: currentTouchpoints as any,
                    lastTouch: touchpoint.timestamp,
                })
                .where(eq(leadAttribution.id, existing[0].id));
        }
    }
}

export const leadCorrelationService = new LeadCorrelationService();
