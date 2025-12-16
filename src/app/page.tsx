import { calculateAdaptiveRiskScore } from '@/ai/flows/adaptive-risk-scoring';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { generateMockEvents } from '@/lib/mock-data';
import type { ProcessedThreat, RawEvent } from '@/lib/types';

// Helper to simulate network delay and loading states
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function Home() {
  const rawEvents = generateMockEvents(5);
  // Add a small delay to simulate real-world data fetching
  await sleep(500);

  const processedThreats = await Promise.all(
    rawEvents.map(
      async (event: RawEvent): Promise<ProcessedThreat> => {
        try {
          const behavioralResult = {
            anomalyScore: Math.random(),
            explanation: 'Simulated behavioral analysis due to rate limits. No significant deviation detected.'
          };

          const riskResult = await calculateAdaptiveRiskScore({
            ruleBasedSeverity: event.ruleBasedSeverity,
            contextualAnomalyScore: event.contextualAnomalyScore,
            behavioralDeviationScore: behavioralResult.anomalyScore,
          });

          // Simulate explanation to reduce AI calls
          const explanationResult = {
             explanation: `Risk score of ${riskResult.riskScore.toFixed(0)} is based on rule severity (${event.ruleBasedSeverity}), contextual anomalies, and behavioral scores. ${riskResult.explanation}`
          };

          return {
            ...event,
            riskScore: riskResult.riskScore,
            riskExplanation: riskResult.explanation,
            detailedExplanation: explanationResult.explanation,
            behavioralAnomalyScore: behavioralResult.anomalyScore,
            behavioralExplanation: behavioralResult.explanation,
          };
        } catch (error) {
            console.error(`Failed to process event ${event.id}:`, error);
            const fallbackRiskScore = event.ruleBasedSeverity * 10;
            return {
                ...event,
                riskScore: fallbackRiskScore,
                riskExplanation: "AI analysis failed. Using rule-based severity for risk score.",
                detailedExplanation: "Could not connect to ThreatLens AI™ for detailed analysis. The service may be temporarily unavailable.",
                behavioralAnomalyScore: event.contextualAnomalyScore,
                behavioralExplanation: "Could not connect to CyberDNA™ for behavioral analysis.",
            };
        }
      }
    )
  );
  
  // Sort threats by risk score descending
  processedThreats.sort((a, b) => b.riskScore - a.riskScore);

  return <DashboardPage threats={processedThreats} />;
}
