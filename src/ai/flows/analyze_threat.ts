import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { EnrichedEvent } from '@/lib/types';

/* ======================================================
   INPUT SCHEMA
   ====================================================== */

export const AnalyzeThreatInputSchema = z.custom<EnrichedEvent>();

export type AnalyzeThreatInput = z.infer<typeof AnalyzeThreatInputSchema>;

/* ======================================================
   OUTPUT SCHEMA (MERGED)
   ====================================================== */

export const UnifiedThreatAnalysisOutputSchema = z.object({
  riskScore: z
    .number()
    .describe('Final adaptive risk score (0–100)'),

  behavioralAnomalyScore: z
    .number()
    .describe('Behavioral deviation probability (0.0–1.0)'),

  behavioralExplanation: z
    .string()
    .describe('Explanation of detected behavioral deviations'),

  detailedExplanation: z
    .string()
    .describe('SOC-ready human-readable explanation'),

  riskBreakdown: z.object({
    ruleBased: z.number().describe('Rule-based contribution (0–100)'),
    contextual: z.number().describe('Contextual contribution (0–100)'),
    behavioral: z.number().describe('Behavioral contribution (0–100)'),
  }),
});

export type UnifiedThreatAnalysisOutput = z.infer<
  typeof UnifiedThreatAnalysisOutputSchema
>;

/* ======================================================
   UNIFIED PROMPT (ONE BRAIN)
   ====================================================== */

const unifiedThreatAnalysisPrompt = ai.definePrompt({
  name: 'unifiedThreatAnalysisPrompt',
  input: { schema: AnalyzeThreatInputSchema },
  output: { schema: UnifiedThreatAnalysisOutputSchema },
  prompt: `
You are ThreatLens AI, a senior SOC analyst.

Analyze ONE security event and produce a complete assessment.

TASKS:
1. Detect behavioral deviations from baseline
2. Assign behavioralAnomalyScore (0.0–1.0)
3. Compute final riskScore (0–100)
4. Explain behavioral deviations clearly
5. Provide a concise SOC explanation (2–3 sentences)
6. Provide a risk breakdown: ruleBased, contextual, behavioral (0–100 each)

EVENT:
- Timestamp: {{{timestamp}}}
- User: {{{user.name}}} (Role: {{{user.role}}})
- Location: {{{location.country}}} (Novel: {{{location.isNovel}}})
- Device: {{{device.id}}} (Novel: {{{device.isNovel}}})
- Event Type: {{{event.type}}}
- Event Details: {{{event.details}}}
- Rule-Based Severity: {{{ruleBasedSeverity}}}
- Initial Risk Explanation: {{{riskExplanation}}}

BEHAVIORAL BASELINE:
- Login Hours: {{{behavioralBaseline.loginTime.normalRange.[0]}}}:00 – {{{behavioralBaseline.loginTime.normalRange.[1]}}}:00
- Typical Resource Order: {{{behavioralBaseline.resourceAccess.typicalOrder}}}
- API Call Frequency: mean {{{behavioralBaseline.apiCallFrequency.mean}}}, std {{{behavioralBaseline.apiCallFrequency.stdDev}}}

RULES:
- Behavioral score reflects probability, not certainty
- Risk score must correlate with severity + novelty + behavior
- Explanations must be human-readable and analyst-friendly
`,
});

/* ======================================================
   SINGLE FLOW (ONE GEMINI CALL)
   ====================================================== */

export const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: UnifiedThreatAnalysisOutputSchema,
  },
  async (event: AnalyzeThreatInput) => {
    const { output } = await unifiedThreatAnalysisPrompt(event);
    return output!;
  }
);

/* ======================================================
   CONVENIENCE WRAPPER
   ====================================================== */

   export const analyzeThreatFlow = ai.defineFlow(
    {
      name: 'analyzeThreatFlow',
      inputSchema: AnalyzeThreatInputSchema,
      outputSchema: UnifiedThreatAnalysisOutputSchema,
    },
    async (event) => {
      const { output } = await unifiedThreatAnalysisPrompt(event);
      return output!;
    }
  );