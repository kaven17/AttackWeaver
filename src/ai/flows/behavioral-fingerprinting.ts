'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EnrichedEvent } from '@/lib/types';

// -----------------------------
// Input and Output Schemas
// -----------------------------
export const BehavioralFingerprintingInputSchema = z.custom<EnrichedEvent>();
export type BehavioralFingerprintingInput = z.infer<typeof BehavioralFingerprintingInputSchema>;

export const BehavioralFingerprintingOutputSchema = z.object({
  behavioralAnomalyScore: z
    .number()
    .describe('A probabilistic anomaly score (0-1) indicating deviation from the baseline.'),
  behavioralExplanation: z
    .string()
    .describe('A human-readable explanation of the behavioral anomaly.'),
});
export type BehavioralFingerprintingOutput = z.infer<typeof BehavioralFingerprintingOutputSchema>;

// -----------------------------
// Define AI Prompt
// -----------------------------
const behavioralFingerprintingPrompt = ai.definePrompt({
  name: 'behavioralFingerprintingPrompt',
  input: { schema: BehavioralFingerprintingInputSchema },
  output: { schema: BehavioralFingerprintingOutputSchema },
  prompt: `
You are a security analyst AI tasked with detecting unusual activity.

Task:
1. Identify deviations from the user's established behavioral baseline.
2. Calculate a probabilistic behavioral anomaly score (0.0-1.0)
3. Generate a human-readable explanation detailing why the event is anomalous.

Event Data:
- User ID: {{{user.id}}}
- Device ID: {{{device.id}}}
- Event Type: {{{event.type}}}
- Timestamp: {{{timestamp}}}

Behavioral Baseline:
- Normal Login Hours: {{{behavioralBaseline.loginTime.normalRange.[0]}}}:00 - {{{behavioralBaseline.loginTime.normalRange.[1]}}}:00
- Typical Resource Access Order: {{{behavioralBaseline.resourceAccess.typicalOrder}}}
- API Calls per Hour: mean {{{behavioralBaseline.apiCallFrequency.mean}}}, std {{{behavioralBaseline.apiCallFrequency.stdDev}}}
`,
});

// -----------------------------
// Define the Flow
// -----------------------------
export const behavioralFingerprintingFlow = ai.defineFlow(
  {
    name: 'behavioralFingerprintingFlow',
    inputSchema: BehavioralFingerprintingInputSchema,
    outputSchema: BehavioralFingerprintingOutputSchema,
  },
  async (input: BehavioralFingerprintingInput) => {
    const { output } = await behavioralFingerprintingPrompt(input);
    return output!;
  }
);
