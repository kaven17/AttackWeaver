
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import type { SignalFusionOutput } from './signalFusionflow';
import type { AttackPathOutput } from './attackPathFlow';
import type { ResponseOutput } from './ResponseFlow';
import type { TrustAuditOutput } from './trustAuditFlow';

// ─── Schema ───────────────────────────────────────────────────────────────────

const NarrativeInputSchema = z.object({
  fusionSummary: z.string(),
  attackStages: z.string(),
  blastRadius: z.number(),
  highValueTargets: z.string(),
  dwellTime: z.number(),
  topAction: z.string(),
  overallSeverity: z.number(),
  criticalEntities: z.number(),
  trustSummary: z.string(),
});

const NarrativeOutputSchema = z.object({
  narrative: z.string().describe('3–4 sentence executive incident narrative'),
});

// ─── Prompt ───────────────────────────────────────────────────────────────────

const narrativePrompt = ai.definePrompt({
  name: 'attackNarrativePrompt',
  model: 'googleai/gemini-2.5-flash',
  input: { schema: NarrativeInputSchema },
  output: { schema: NarrativeOutputSchema },
  prompt: `
You are a senior SOC analyst writing a concise executive incident brief.

INCIDENT DATA:
- Signal summary: {{fusionSummary}}
- Attack progression: {{attackStages}}
- Blast radius: {{blastRadius}}/100
- High-value targets reached: {{highValueTargets}}
- Estimated dwell time: {{dwellTime}} minutes
- Recommended top action: {{topAction}}
- Overall severity: {{overallSeverity}}/100
- Critical identities: {{criticalEntities}}
- Trust summary: {{trustSummary}}

Write a 3–4 sentence narrative that:
1. Opens with the initial attack vector
2. Describes the progression and lateral movement
3. States what critical assets are at risk
4. Closes with the single most important immediate action

Write in clear, plain English. No bullet points. No jargon without explanation. Flowing prose only.
`,
});

// ─── Exported helper ─────────────────────────────────────────────────────────

export async function generateNarrative(
  fusion: SignalFusionOutput,
  path: AttackPathOutput,
  response: ResponseOutput,
  trust: TrustAuditOutput
): Promise<string> {
  const criticalClusters = fusion.clusters.filter(c => c.classification === 'critical');
  const fusionSummary = criticalClusters.map(c => c.summary).join('; ') || 'No critical clusters detected';

  const result = await narrativePrompt({
    fusionSummary,
    attackStages: path.attackStages.join(' → '),
    blastRadius: path.blastRadius,
    highValueTargets: path.highValueTargetsReached.join(', ') || 'none',
    dwellTime: path.estimatedDwellTimeMinutes,
    topAction: response.actions[0]?.title || 'Escalate to SOC lead',
    overallSeverity: response.overallSeverity,
    criticalEntities: trust.criticalEntities,
    trustSummary: trust.entities
      .map((e: { displayName: any; trustScore: any; }) => `${e.displayName}: ${e.trustScore}/100`)
      .join(', '),
  });

  return result.output!.narrative;
}