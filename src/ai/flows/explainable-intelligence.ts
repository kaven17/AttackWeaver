'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { EnrichedEvent } from '@/lib/types';

// -----------------------------
// Input & Output Schemas
// -----------------------------
export const ExplanationInputSchema = z.object({
  event: z.custom<EnrichedEvent>(),
  riskScore: z.number(),
  behavioralAnomalyScore: z.number(),
  behavioralExplanation: z.string(),
});

export type ExplanationInput = z.infer<typeof ExplanationInputSchema>;

export const ExplanationOutputSchema = z.object({
  detailedExplanation: z.string().describe(
    'A detailed, human-readable explanation of the event and its risk score.'
  ),
});

export type ExplanationOutput = z.infer<typeof ExplanationOutputSchema>;

// -----------------------------
// Define AI Prompt
// -----------------------------
const explainableIntelligencePrompt = ai.definePrompt({
  name: 'explainableIntelligencePrompt',
  input: { schema: ExplanationInputSchema },
  output: { schema: ExplanationOutputSchema },
  prompt: `
You are a security analyst AI tasked with explaining flagged events to a human analyst.
Your task is to produce a clear, concise, human-readable explanation of why the event was flagged and its risk score.

Event Details:
- Description: {{{event.event.details}}}
- User: {{{event.user.name}}} (Role: {{{event.user.role}}})
- Location: {{{event.location.country}}} (Novelty: {{{event.location.isNovel}}})
- Device Novelty: {{{event.device.isNovel}}}

Analysis Metrics:
- Risk Score: {{{riskScore}}}
- Behavioral Anomaly Score: {{{behavioralAnomalyScore}}}
- Behavioral Explanation: {{{behavioralExplanation}}}

Generate a markdown explanation in the field 'detailedExplanation'.
`,
});

// -----------------------------
// Define the Flow
// -----------------------------
export const explainableIntelligenceFlow = ai.defineFlow(
  {
    name: 'explainableIntelligenceFlow',
    inputSchema: ExplanationInputSchema,
    outputSchema: ExplanationOutputSchema,
  },
  async (input: ExplanationInput) => {
    const { output } = await explainableIntelligencePrompt(input);
    return output!;
  }
);
