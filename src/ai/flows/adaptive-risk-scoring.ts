'use server';

/**
 * @fileOverview Implements adaptive risk scoring based on rule-based severity, anomaly scores, and behavioral deviations.
 *
 * Exports:
 * - `calculateAdaptiveRiskScore` - Function to calculate the risk score.
 * - `AdaptiveRiskScoreInput` - Input type for the risk scoring function.
 * - `AdaptiveRiskScoreOutput` - Output type for the risk scoring function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define schemas for input and output
const AdaptiveRiskScoreInputSchema = z.object({
  ruleBasedSeverity: z
    .number()
    .describe('Severity score based on predefined rules (e.g., 1-10)'),
  contextualAnomalyScore: z
    .number()
    .describe('Anomaly score derived from contextual analysis (e.g., 0-1)'),
  behavioralDeviationScore: z
    .number()
    .describe(
      'Score indicating deviation from established behavioral patterns (e.g., 0-1)'
    ),
  feedbackScoreAdjustment: z
    .number()
    .optional()
    .describe(
      'Adjustment to the risk score based on feedback; positive for confirmed alerts, negative for ignored alerts (e.g., -0.1 to 0.1)'
    ),
});

export type AdaptiveRiskScoreInput = z.infer<typeof AdaptiveRiskScoreInputSchema>;

const AdaptiveRiskScoreOutputSchema = z.object({
  riskScore: z
    .number()
    .describe(
      'The calculated risk score (0-100), combining severity, anomaly scores, and feedback adjustments'
    ),
  explanation: z
    .string()
    .describe(
      'Human-readable explanation of the risk score, detailing contributing factors'
    ),
});

export type AdaptiveRiskScoreOutput = z.infer<typeof AdaptiveRiskScoreOutputSchema>;

// Exported function to calculate adaptive risk score
export async function calculateAdaptiveRiskScore(
  input: AdaptiveRiskScoreInput
): Promise<AdaptiveRiskScoreOutput> {
  return adaptiveRiskScoringFlow(input);
}

const adaptiveRiskScoringPrompt = ai.definePrompt({
  name: 'adaptiveRiskScoringPrompt',
  input: {schema: AdaptiveRiskScoreInputSchema},
  output: {schema: AdaptiveRiskScoreOutputSchema},
  prompt: `You are an AI Threat Analyst, and calculate the risk score of a security event and explain the risk.

  Combine the rule-based severity, contextual anomaly scores, and behavioral deviation scores to calculate a risk score (0-100).
  Also take into consideration feedback adjustments from confirmed/ignored alerts.

  Rule-Based Severity: {{{ruleBasedSeverity}}}
  Contextual Anomaly Score: {{{contextualAnomalyScore}}}
  Behavioral Deviation Score: {{{behavioralDeviationScore}}}
  Feedback Score Adjustment: {{{feedbackScoreAdjustment}}}

  Output the risk score (0-100) and a clear, human-readable explanation for each flagged event, detailing the causal and contextual factors contributing to the risk score.
  `,
});

// Define the Genkit flow
export const adaptiveRiskScoringFlow = ai.defineFlow(
  {
    name: 'adaptiveRiskScoringFlow',
    inputSchema: AdaptiveRiskScoreInputSchema,
    outputSchema: AdaptiveRiskScoreOutputSchema,
  },
  async input => {
    // Call the prompt and return the output
    const {output} = await adaptiveRiskScoringPrompt(input);
    return output!;
  }
);
