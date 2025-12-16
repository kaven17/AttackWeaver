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
          // In a real app, you would fetch behavioral analysis.
          // Here we simulate it based on mock data.
          const behavioralResult = {
            anomalyScore: event.behavioralAnomalyScore,
            explanation: `Behavioral analysis shows a deviation of ${event.behavioralAnomalyScore.toFixed(2)} from baseline.`,
          };

          const riskResult = await calculateAdaptiveRiskScore({
            ruleBasedSeverity: event.ruleBasedSeverity,
            contextualAnomalyScore: event.contextualAnomalyScore,
            behavioralDeviationScore: behavioralResult.anomalyScore,
          });

          // Simulate explanation to reduce AI calls in this demo
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
            riskBreakdown: {
              ruleBased: event.ruleBasedSeverity * 10,
              contextual: event.contextualAnomalyScore * 100,
              behavioral: event.behavioralAnomalyScore * 100,
            }
          };
        } catch (error) {
            console.error(`Failed to process event ${event.id}:`, error);
            const fallbackRiskScore = (event.ruleBasedSeverity * 5) + (event.contextualAnomalyScore * 50) + (event.behavioralAnomalyScore * 50);
            return {
                ...event,
                riskScore: fallbackRiskScore > 100 ? 100 : fallbackRiskScore,
                riskExplanation: `AI analysis failed. Fallback score based on rule severity (${event.ruleBasedSeverity}), contextual anomaly (${event.contextualAnomalyScore.toFixed(2)}), and behavioral anomaly (${event.behavioralAnomalyScore.toFixed(2)}).`,
                detailedExplanation: `Could not connect to ThreatLens AI™ for detailed analysis. The event was a "${event.event.type}" by user "${event.user.name}" from ${event.location.country}.`,
                behavioralExplanation: `Could not connect to CyberDNA™ for behavioral analysis. Initial anomaly score is ${event.behavioralAnomalyScore.toFixed(2)}. The user was operating from a ${event.location.isNovel ? 'novel' : 'known'} location and a ${event.device.isNovel ? 'novel' : 'known'} device.`,
                riskBreakdown: {
                    ruleBased: event.ruleBasedSeverity * 10,
                    contextual: event.contextualAnomalyScore * 100,
                    behavioral: event.behavioralAnomalyScore * 100,
                }
            };
        }
      }
    )
  );
  
  // Sort threats by risk score descending
  processedThreats.sort((a, b) => b.riskScore - a.riskScore);

  return <DashboardPage threats={processedThreats} />;
}
