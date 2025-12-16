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

const BehavioralFingerprintingInputSchema = z.object({
  userId: z.string().describe('The unique identifier for the user.'),
  deviceId: z.string().describe('The unique identifier for the device.'),
  loginTimeDistribution: z
    .array(z.number())
    .describe(
      'An array representing the distribution of login times for the user/device.'
    ),
  resourceAccessOrder: z
    .array(z.string())
    .describe(
      'An array representing the order in which resources are accessed by the user/device.'
    ),
  apiCallFrequency: z
    .array(z.number())
    .describe(
      'An array representing the frequency of API calls made by the user/device.'
    ),
});
export type BehavioralFingerprintingInput = z.infer<
  typeof BehavioralFingerprintingInputSchema
>;

const BehavioralFingerprintingOutputSchema = z.object({
  anomalyScore: z
    .number()
    .describe(
      'A probabilistic anomaly score (0-1) indicating the degree of deviation from the established behavioral baseline.'
    ),
  explanation: z
    .string()
    .describe(
      'A human-readable explanation of the factors contributing to the anomaly score.'
    ),
});
export type BehavioralFingerprintingOutput = z.infer<
  typeof BehavioralFingerprintingOutputSchema
>;

export async function behavioralFingerprinting(
  input: BehavioralFingerprintingInput
): Promise<BehavioralFingerprintingOutput> {
  return behavioralFingerprintingFlow(input);
}

const behavioralFingerprintingPrompt = ai.definePrompt({
  name: 'behavioralFingerprintingPrompt',
  input: {schema: BehavioralFingerprintingInputSchema},
  output: {schema: BehavioralFingerprintingOutputSchema},
  prompt: `You are a security analyst tasked with identifying unusual activities based on user and device behavior.

You will receive data about a user's login time distribution, resource access order, and API call frequency.

Based on this data, you should:

1.  Establish a behavioral baseline for the user/device.
2.  Detect deviations from the established patterns.
3.  Calculate a probabilistic anomaly score (0-1) indicating the degree of deviation.
4.  Provide a human-readable explanation of the factors contributing to the anomaly score.

Here is the data for the user/device:

User ID: {{{userId}}}
Device ID: {{{deviceId}}}
Login Time Distribution: {{{loginTimeDistribution}}}
Resource Access Order: {{{resourceAccessOrder}}}
API Call Frequency: {{{apiCallFrequency}}}

Anomaly Score: 
Explanation: `,
});

const behavioralFingerprintingFlow = ai.defineFlow(
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
