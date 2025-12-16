'use server';

/**
 * @fileOverview This file defines a Genkit flow for establishing a behavioral baseline per user/device,
 * tracking login time distributions, resource access order, and API call frequency to detect deviations
 * from established patterns and output probabilistic anomaly scores.
 *
 * - behavioralFingerprinting - A function that initiates the behavioral fingerprinting process.
 * - BehavioralFingerprintingInput - The input type for the behavioralFingerprinting function.
 * - BehavioralFingerprintingOutput - The return type for the behavioralFingerprinting function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { EnrichedEvent } from '@/lib/types';


export const BehavioralFingerprintingInputSchema = z.custom<EnrichedEvent>();

export type BehavioralFingerprintingInput = z.infer<
  typeof BehavioralFingerprintingInputSchema
>;

export const BehavioralFingerprintingOutputSchema = z.object({
  behavioralAnomalyScore: z
    .number()
    .describe(
      'A probabilistic anomaly score (0-1) indicating the degree of deviation from the established behavioral baseline.'
    ),
  behavioralExplanation: z
    .string()
    .describe(
      'A human-readable explanation of the factors contributing to the anomaly score.'
    ),
});
export type BehavioralFingerprintingOutput = z.infer<
  typeof BehavioralFingerprintingOutputSchema
>;


const behavioralFingerprintingPrompt = ai.definePrompt({
  name: 'behavioralFingerprintingPrompt',
  input: {schema: BehavioralFingerprintingInputSchema},
  output: {schema: BehavioralFingerprintingOutputSchema},
  prompt: `You are a security analyst tasked with identifying unusual activities based on user and device behavior.
You will receive data about a user's event and their typical behavioral baseline.
Based on this data, you should:
1. Detect deviations from the established patterns.
2. Calculate a probabilistic anomaly score (0-1) indicating the degree of deviation.
3. Provide a human-readable explanation of the factors contributing to the anomaly score.
Here is the data for the user/device and their baseline:
Event:
- User ID: {{{user.id}}}
- Device ID: {{{device.id}}}
- Event Type: {{{event.type}}}
- Timestamp: {{{timestamp}}}

Behavioral Baseline:
- Normal Login Hours: {{{behavioralBaseline.loginTime.normalRange.[0]}}}:00 - {{{behavioralBaseline.loginTime.normalRange.[1]}}}:00
- Typical Resource Access Order: {{{behavioralBaseline.resourceAccess.typicalOrder}}}
- Average API Calls per Hour: {{{behavioralBaseline.apiCallFrequency.mean}}} (std dev: {{{behavioralBaseline.apiCallFrequency.stdDev}}})
`,
});

export const behavioralFingerprintingFlow = ai.defineFlow(
  {
    name: 'behavioralFingerprintingFlow',
    inputSchema: BehavioralFingerprintingInputSchema,
    outputSchema: BehavioralFingerprintingOutputSchema,
  },
  async input => {
    const {output} = await behavioralFingerprintingPrompt(input);
    return output!;
  }
);
