'use server';

/**
 * @fileOverview Generates human-readable explanations for flagged events, detailing the factors contributing to the risk score.
 *
 * - generateExplanation - A function that generates the explanation for a flagged event.
 * - ExplanationInput - The input type for the generateExplanation function.
 * - ExplanationOutput - The return type for the generateExplanation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExplanationInputSchema = z.object({
  eventDescription: z.string().describe('A description of the flagged event.'),
  riskScore: z.number().describe('The risk score (0-100) associated with the event.'),
  severity: z.string().describe('The severity of the event (e.g., low, medium, high).'),
  contextualAnomalies: z.string().describe('Contextual anomalies observed during the event.'),
  behavioralDeviations: z.string().describe('Behavioral deviations observed during the event.'),
});
export type ExplanationInput = z.infer<typeof ExplanationInputSchema>;

const ExplanationOutputSchema = z.object({
  explanation: z.string().describe('A human-readable explanation of the event and its risk score.'),
});
export type ExplanationOutput = z.infer<typeof ExplanationOutputSchema>;

export async function generateExplanation(input: ExplanationInput): Promise<ExplanationOutput> {
  return explainableIntelligenceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainableIntelligencePrompt',
  input: {schema: ExplanationInputSchema},
  output: {schema: ExplanationOutputSchema},
  prompt: `You are a security expert explaining a flagged event to a security analyst.

  Given the following information about the event, generate a clear and concise explanation of why the event was flagged and its associated risk score.

  Event Description: {{{eventDescription}}}
  Risk Score: {{{riskScore}}}
  Severity: {{{severity}}}
  Contextual Anomalies: {{{contextualAnomalies}}}
  Behavioral Deviations: {{{behavioralDeviations}}}

  Explanation:`,
});

const explainableIntelligenceFlow = ai.defineFlow(
  {
    name: 'explainableIntelligenceFlow',
    inputSchema: ExplanationInputSchema,
    outputSchema: ExplanationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
