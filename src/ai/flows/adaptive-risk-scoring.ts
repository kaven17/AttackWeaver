'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { EnrichedEvent } from '@/lib/types';

// -----------------------------
// Input schema for adaptive risk scoring
// -----------------------------
export const AdaptiveRiskScoreInputSchema = z.object({
  ruleBasedSeverity: z
    .number()
    .describe('Severity score based on predefined rules (1-10)'),
  contextualAnomalyScore: z
    .number()
    .describe('Anomaly score derived from contextual/contextual analysis (0-1)'),
  behavioralDeviationScore: z
    .number()
    .describe('Score indicating deviation from behavioral baseline (0-1)'),
  feedbackScoreAdjustment: z
    .number()
    .optional()
    .describe(
      'Adjustment from feedback: positive for confirmed alerts, negative for ignored alerts (-0.1 to 0.1)'
    ),
});

export type AdaptiveRiskScoreInput = z.infer<typeof AdaptiveRiskScoreInputSchema>;

// -----------------------------
// Output schema
// -----------------------------
export const AdaptiveRiskScoreOutputSchema = z.object({
  riskScore: z
    .number()
    .describe(
      'Final adaptive risk score (0-100) combining severity, anomaly, and feedback'
    ),
  explanation: z
    .string()
    .describe('Human-readable explanation of how the score was derived'),
});

export type AdaptiveRiskScoreOutput = z.infer<typeof AdaptiveRiskScoreOutputSchema>;

// -----------------------------
// Define the prompt
// -----------------------------
const adaptiveRiskScoringPrompt = ai.definePrompt({
  name: 'adaptiveRiskScoringPrompt',
  input: { schema: AdaptiveRiskScoreInputSchema },
  output: { schema: AdaptiveRiskScoreOutputSchema },
  prompt: `
You are a cybersecurity AI analyst. Your task is to calculate the adaptive risk score for a security event.

Combine the following:
- Rule-Based Severity: {{{ruleBasedSeverity}}}
- Contextual Anomaly Score: {{{contextualAnomalyScore}}}
- Behavioral Deviation Score: {{{behavioralDeviationScore}}}
- Feedback Score Adjustment: {{{feedbackScoreAdjustment}}}

Output:
1. riskScore (0-100)
2. A clear, human-readable explanation of why this score was given, detailing all contributing factors.
`,
});

// -----------------------------
// Define the flow
// -----------------------------
export const adaptiveRiskScoringFlow = ai.defineFlow(
  {
    name: 'adaptiveRiskScoringFlow',
    inputSchema: AdaptiveRiskScoreInputSchema,
    outputSchema: AdaptiveRiskScoreOutputSchema,
  },
  async (input: AdaptiveRiskScoreInput) => {
    const { output } = await adaptiveRiskScoringPrompt(input);
    return output!;
  }
);

// -----------------------------
// Convenience wrapper
// -----------------------------
export async function calculateAdaptiveRiskScore(
  input: AdaptiveRiskScoreInput
): Promise<AdaptiveRiskScoreOutput> {
  return adaptiveRiskScoringFlow(input);
}
