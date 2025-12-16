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
import { EnrichedEvent } from '@/lib/types';


export const ExplanationInputSchema = z.object({
  event: z.custom<EnrichedEvent>(),
  riskScore: z.number(),
  behavioralAnomalyScore: z.number(),
  behavioralExplanation: z.string(),
});

export type ExplanationInput = z.infer<typeof ExplanationInputSchema>;

export const ExplanationOutputSchema = z.object({
  detailedExplanation: z.string().describe('A detailed, human-readable explanation of the event and its risk score.'),
});
export type ExplanationOutput = z.infer<typeof ExplanationOutputSchema>;


const prompt = ai.definePrompt({
  name: 'explainableIntelligencePrompt',
  input: {schema: ExplanationInputSchema},
  output: {schema: ExplanationOutputSchema},
  prompt: `You are a security expert explaining a flagged event to a security analyst.
  Given the following information about the event, generate a clear and concise explanation of why the event was flagged and its associated risk score.
  
  Event:
  - Description: {{{event.event.details}}}
  - User: {{{event.user.name}}}
  - Location: {{{event.location.country}}}
  - Device Novelty: {{{event.device.isNovel}}}
  - Location Novelty: {{{event.location.isNovel}}}
  
  Analysis:
  - Risk Score: {{{riskScore}}}
  - Behavioral Anomaly Score: {{{behavioralAnomalyScore}}}
  - Behavioral Explanation: {{{behavioralExplanation}}}

  Generate the 'detailedExplanation' field.
  `,
});

export const explainableIntelligenceFlow = ai.defineFlow(
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
