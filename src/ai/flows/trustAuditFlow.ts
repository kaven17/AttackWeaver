import { z } from 'zod';
import { runLocalLLM } from '@/ai/ollama';

/* ─────────────────────────────────────────────────────────────
   SCHEMA
───────────────────────────────────────────────────────────── */

export const TrustAuditOutputSchema = z.object({
  entities: z.array(
    z.object({
      entityId: z.string(),
      entityType: z.enum(['user', 'device']),
      displayName: z.string(),
      trustScore: z.number(),
      previousTrustScore: z.number(),
      riskFlags: z.array(z.string()),
      recommendedAction: z.string(),
      requiresStepUp: z.boolean(),
      anomalyDetails: z.string(),
    })
  ),
  criticalEntities: z.number(),
  averageTrustDrop: z.number(),
});

export type TrustAuditOutput = z.infer<typeof TrustAuditOutputSchema>;

/* ─────────────────────────────────────────────────────────────
   SAFE PARSE
───────────────────────────────────────────────────────────── */

function safeParse(raw: string) {
  try {
    return JSON.parse(raw);
  } catch {}

  const cleaned = raw
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   NORMALIZATION (STRICT)
───────────────────────────────────────────────────────────── */
function normalizeEntityType(v: any): 'user' | 'device' {
  const t = String(v || '').toLowerCase();

  if (t.includes('device') || t.includes('host')) return 'device';
  return 'user';
}
function normalize(raw: any, logs: any[]): TrustAuditOutput {
  const output: any = raw || {};

  /* entities (critical guarantee) */
const hasValidEntities =
  Array.isArray(output.entities) &&
  output.entities.some((e: any) => e?.entityId);

output.entities = hasValidEntities
  ? output.entities.map((e: any, i: number) => ({
      entityId: String(e?.entityId ?? `entity-${i}`),
      entityType: normalizeEntityType(e?.entityType),
      displayName: String(e?.displayName ?? e?.entityId ?? `entity-${i}`),

      trustScore: (() => {
        const n = Number(e?.trustScore);
        return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 60;
      })(),

      previousTrustScore: (() => {
        const n = Number(e?.previousTrustScore);
        return Number.isFinite(n) ? n : 85;
      })(),

      riskFlags: Array.isArray(e?.riskFlags)
        ? e.riskFlags.filter((v: any): v is string => typeof v === 'string')
        : [],

      recommendedAction: String(e?.recommendedAction ?? 'Monitor activity'),
      requiresStepUp: Boolean(e?.requiresStepUp),
      anomalyDetails: String(e?.anomalyDetails ?? 'No anomaly data'),
    }))
  : buildFallbackEntities(logs);

  /* criticalEntities */
  output.criticalEntities =
    typeof output.criticalEntities === 'number'
      ? output.criticalEntities
      : output.entities.filter((e: any) => e.trustScore < 30).length;

  /* averageTrustDrop */
  output.averageTrustDrop =
    typeof output.averageTrustDrop === 'number'
      ? output.averageTrustDrop
      : computeAverageDrop(output.entities);

  return output;
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK ENTITY BUILDER (STRONG)
───────────────────────────────────────────────────────────── */

function buildFallbackEntities(logs: any[]) {
  if (!logs?.length) {
    return [{
      entityId: 'fallback-user',
      entityType: 'user' as 'user',
      displayName: 'Unknown User',
      trustScore: 60,
      previousTrustScore: 85,
      riskFlags: ['no_data'],
      recommendedAction: 'Monitor activity',
      requiresStepUp: false,
      anomalyDetails: 'No logs available',
    }];
  }

  return logs.map((log, i) => ({
    entityId: String(log?.userId ?? log?.hostname ?? `entity-${i}`),

    entityType: (log?.hostname ? 'device' : 'user') as 'user' | 'device',

    displayName: String(log?.userId ?? log?.hostname ?? `entity-${i}`),

    trustScore: 60,
    previousTrustScore: 85,
    riskFlags: ['fallback'],
    recommendedAction: 'Monitor activity',
    requiresStepUp: false,
    anomalyDetails: 'Fallback generated',
  }));
}
/* ─────────────────────────────────────────────────────────────
   METRIC COMPUTATION
───────────────────────────────────────────────────────────── */

function computeAverageDrop(entities: any[]) {
  if (!entities.length) return 0;

  const total = entities.reduce((acc, e) => {
    return acc + (e.previousTrustScore - e.trustScore);
  }, 0);

  return Math.round(total / entities.length);
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK (FULL OBJECT)
───────────────────────────────────────────────────────────── */

function fallback(logs: any[]): TrustAuditOutput {
  const entities = buildFallbackEntities(logs);

  return {
    entities,
    criticalEntities: 0,
    averageTrustDrop: computeAverageDrop(entities),
  };
}

/* ─────────────────────────────────────────────────────────────
   MAIN FLOW
───────────────────────────────────────────────────────────── */

export async function runTrustAudit(logs: any[]): Promise<TrustAuditOutput> {
  const prompt = `
You are a security AI.

STRICT:
- Return ONLY JSON
- ALL fields required

Schema:
{
  "entities": [],
  "criticalEntities": number,
  "averageTrustDrop": number
}

INPUT:
${JSON.stringify(logs)}
`;

  try {
    const raw = await runLocalLLM(prompt);

    const parsed = safeParse(raw);
    if (!parsed) return fallback(logs);

    const normalized = normalize(parsed, logs);

    return TrustAuditOutputSchema.parse(normalized);

  } catch (err) {
    console.warn('[TrustAudit] failure → fallback', err);
    return fallback(logs);
  }
}