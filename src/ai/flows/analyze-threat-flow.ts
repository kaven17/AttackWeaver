import { runBertSemanticAnalysis } from '@/ai/bert';

export const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: UnifiedThreatAnalysisOutputSchema,
  },
  async (event: AnalyzeThreatInput) => {

    /* 1️⃣ Semantic enrichment (BERT — single call) */
    const bertSignals = await runBertSemanticAnalysis(
      event.event.details
    );

    /* 2️⃣ Deterministic ThreatX scoring */
    const behavioralAnomalyScore = computeBehavioralDeviation(
      event,
      bertSignals
    );

    const riskBreakdown = computeRiskBreakdown(
      event,
      bertSignals,
      behavioralAnomalyScore
    );

    const riskScore = aggregateRisk(riskBreakdown);

    /* 3️⃣ (Optional) Explanation rewriting — LLM-safe */
    const explanation = buildExplanation(
      event,
      bertSignals,
      riskScore
    );

    return {
      riskScore,
      behavioralAnomalyScore,
      behavioralExplanation: explanation.behavioral,
      detailedExplanation: explanation.detailed,
      riskBreakdown,
    };
  }
);
