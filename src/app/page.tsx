import { behavioralFingerprinting } from '@/ai/flows/behavioral-fingerprinting';
import { calculateAdaptiveRiskScore } from '@/ai/flows/adaptive-risk-scoring';
import { generateExplanation } from '@/ai/flows/explainable-intelligence';
import { DashboardPage } from '@/components/dashboard/dashboard-page';
import { generateMockEvents } from '@/lib/mock-data';
import type { ProcessedThreat, RawEvent } from '@/lib/types';

// Helper to simulate network delay and loading states
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default async function Home() {
  const rawEvents = generateMockEvents(15);
  // Add a small delay to simulate real-world data fetching
  await sleep(500);

  const processedThreats = await Promise.all(
    rawEvents.map(
      async (event: RawEvent): Promise<ProcessedThreat> => {
        const behavioralResult = await behavioralFingerprinting({
          userId: event.user.id,
          deviceId: event.device.id,
          // These would be based on historical data, we'll simulate them
          loginTimeDistribution: [Math.random(), Math.random(), Math.random()],
          resourceAccessOrder: ['/dashboard', '/api/users', '/settings'],
          apiCallFrequency: [Math.random() * 100, Math.random() * 50],
        });

        const riskResult = await calculateAdaptiveRiskScore({
          ruleBasedSeverity: event.ruleBasedSeverity,
          contextualAnomalyScore: event.contextualAnomalyScore,
          behavioralDeviationScore: behavioralResult.anomalyScore,
        });

        const explanationResult = await generateExplanation({
          eventDescription: event.event.details,
          riskScore: riskResult.riskScore,
          severity: riskResult.riskScore > 70 ? 'High' : riskResult.riskScore > 40 ? 'Medium' : 'Low',
          contextualAnomalies: `Novel device: ${event.device.isNovel}, Novel location: ${event.location.isNovel}`,
          behavioralDeviations: behavioralResult.explanation,
        });

        return {
          ...event,
          riskScore: riskResult.riskScore,
          riskExplanation: riskResult.explanation,
          detailedExplanation: explanationResult.explanation,
          behavioralAnomalyScore: behavioralResult.anomalyScore,
          behavioralExplanation: behavioralResult.explanation,
        };
      }
    )
  );
  
  // Sort threats by risk score descending
  processedThreats.sort((a, b) => b.riskScore - a.riskScore);

  return <DashboardPage threats={processedThreats} />;
}
