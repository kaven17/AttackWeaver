import { z } from 'zod';
import { runLocalLLM } from '@/ai/ollama';
import type { SignalFusionOutput } from './signalFusionflow';
import type { AttackPathOutput } from './attackPathFlow';

// ─── Schemas ────────────────────────────────────────────────────────────────

export const ResponseOutputSchema = z.object({
  actions: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      title: z.string(),
      description: z.string(),
      targetAsset: z.string(),
      effectiveness: z.number(),
      businessDisruption: z.number(),
      reversibility: z.number(),
      compositeScore: z.number(),
      requiresHumanApproval: z.boolean(),
      autoExecutable: z.boolean(),
      justification: z.string(),
      status: z.string(),
    })
  ),
  overallSeverity: z.number(),
  estimatedContainmentTimeMinutes: z.number(),
  immediateActionsRequired: z.number(),
});

export type ResponseOutput = z.infer<typeof ResponseOutputSchema>;

// ─── Safe JSON parser ───────────────────────────────────────────────────────

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {
    // 1. remove markdown fences
    let cleaned = raw
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // 2. extract first JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new Error('No JSON object found in LLM output');
    }

    const jsonString = cleaned.slice(start, end + 1);

    try {
      return JSON.parse(jsonString);
    } catch (err) {
      console.error('RAW LLM OUTPUT:\n', raw);
      throw new Error('Failed to parse extracted JSON');
    }
  }
}

// ─── Local execution ────────────────────────────────────────────────────────

export async function runResponseAgent(
  fusion: SignalFusionOutput,
  path: AttackPathOutput
): Promise<ResponseOutput> {

  const criticalClusters = fusion.clusters.filter(
    c => c.classification === 'critical'
  ).length;

  const avgConfidence =
    fusion.clusters.reduce((s, c) => s + c.confidenceScore, 0) /
    (fusion.clusters.length || 1);

  const overallSeverity = Math.round(
    path.blastRadius * 0.6 + avgConfidence * 40
  );

  const prompt = `
You are Agent 3 (Response Agent).

TASK:
- Generate 4–6 response actions
- Score each action:
  effectiveness (0–100)
  businessDisruption (0–100)
  reversibility (0–100)
- Compute:
  compositeScore = (effectiveness * 0.5) + ((100 - businessDisruption) * 0.3) + (reversibility * 0.2)
- Rank descending by compositeScore
- Mark:
  requiresHumanApproval (true/false)
  autoExecutable (true/false)

INPUT:
Attack Path:
${JSON.stringify(path, null, 2)}

Overall Severity: ${overallSeverity}
Critical Clusters: ${criticalClusters}

STRICT OUTPUT JSON:
{
  "actions": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "description": "string",
      "targetAsset": "string",
      "effectiveness": number,
      "businessDisruption": number,
      "reversibility": number,
      "compositeScore": number,
      "requiresHumanApproval": boolean,
      "autoExecutable": boolean,
      "justification": "string",
      "status": "pending"
    }
  ],
  "overallSeverity": number,
  "estimatedContainmentTimeMinutes": number,
  "immediateActionsRequired": number
}

ONLY RETURN JSON.
`;

  const raw = await runLocalLLM(prompt);

  const parsed = safeParse(raw);

  return ResponseOutputSchema.parse(parsed);
}