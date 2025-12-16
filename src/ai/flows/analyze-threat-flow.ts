'use server';
/**
 * @fileOverview A comprehensive flow to analyze a security event.
 * It performs behavioral analysis, calculates a risk score, and generates a detailed explanation.
 */

import { ai } from '@/ai/genkit';
import {
  AnalyzeThreatInput,
  AnalyzeThreatInputSchema,
  AnalyzeThreatOutput,
  AnalyzeThreatOutputSchema,
  EnrichedEvent,
} from '@/lib/types';

export async function analyzeThreat(
  input: AnalyzeThreatInput
): Promise<AnalyzeThreatOutput> {
  // Defensive check if the input is already an AnalyzeThreatOutput
  if ('riskScore' in input && input.riskScore !== null) {
    return input as ProcessedThreat;
  }
  
  const event = input as EnrichedEvent;

  const analysisResult = await analyzeThreatFlow(event);
  
  const updatedThreat: AnalyzeThreatOutput = {
    ...event,
    isAnalyzed: true,
    riskScore: analysisResult.riskScore,
    riskExplanation: analysisResult.explanation,
    detailedExplanation: analysisResult.detailedExplanation,
    behavioralAnomalyScore: analysisResult.behavioralAnomalyScore,
    behavioralExplanation: analysisResult.behavioralExplanation,
    riskBreakdown: analysisResult.riskBreakdown,
  };

  return updatedThreat;
}

const threatAnalysisPrompt = ai.definePrompt({
  name: 'threatAnalysisPrompt',
  input: { schema: AnalyzeThreatInputSchema },
  output: { schema: AnalyzeThreatOutputSchema },
  prompt: `You are ThreatLens AI, a sophisticated security analysis engine.
  Your task is to analyze a security event and provide a comprehensive threat assessment.

  Given the following enriched event data, you must:
  1.  Calculate a final 'riskScore' (0-100). This score should intelligently weigh the rule-based severity, contextual factors (novelty of device/location), and behavioral anomalies.
  2.  Create a concise, one-sentence 'explanation' for the risk score.
  3.  Generate a more 'detailedExplanation' (2-3 sentences) in markdown format, explaining the causal and contextual factors.
  4.  Determine a 'behavioralAnomalyScore' (0.0 to 1.0) based on deviations from the user's established baseline.
  5.  Write a 'behavioralExplanation' detailing why the behavior was considered anomalous.
  6.  Provide a 'riskBreakdown' object with scores (0-100) for 'ruleBased', 'contextual', and 'behavioral' factors.

  Event Data:
  - Timestamp: {{{timestamp}}}
  - User: {{{user.name}}} (Role: {{{user.role}}})
  - Location: {{{location.country}}} (Novelty: {{{location.isNovel}}})
  - Device: {{{device.id}}} (Novelty: {{{device.isNovel}}})
  - Event Type: {{{event.type}}}
  - Event Details: {{{event.details}}}
  - Rule-Based Severity (1-10): {{{ruleBasedSeverity}}}

  User's Behavioral Baseline:
  - Normal Login Hours: {{{behavioralBaseline.loginTime.normalRange.[0]}}}:00 - {{{behavioralBaseline.loginTime.normalRange.[1]}}}:00
  - Typical Resource Access Order: {{{behavioralBaseline.resourceAccess.typicalOrder}}}
  - Average API Calls per Hour: {{{behavioralBaseline.apiCallFrequency.mean}}} (std dev: {{{behavioralBaseline.apiCallFrequency.stdDev}}})
  `,
});

const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: AnalyzeThreatOutputSchema,
  },
  async (event) => {
    const { output } = await threatAnalysisPrompt(event);
    return output!;
  }
);
