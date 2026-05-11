import { z } from 'zod';
import { runLocalLLM } from '@/ai/ollama';

/* ─────────────────────────────────────────────────────────────
   SCHEMAS
───────────────────────────────────────────────────────────── */

export const SignalFusionInputSchema = z.object({
  logs: z.array(
    z.object({
      id: z.string(),
      timestamp: z.string(),
      source: z.enum(['siem', 'edr', 'firewall', 'cloud']),
      severity: z.enum(['low', 'medium', 'high', 'critical']),
      eventType: z.string(),
      sourceIp: z.string().optional(),
      destinationIp: z.string().optional(),
      userId: z.string().optional(),
      hostname: z.string().optional(),
      description: z.string(),
    })
  ),
});

export type SignalFusionInput = z.infer<typeof SignalFusionInputSchema>;

export const SignalFusionOutputSchema = z.object({
  clusters: z.array(
    z.object({
      clusterId: z.string(),
      classification: z.enum(['noise', 'suspicious', 'critical']),
      confidenceScore: z.number(),
      eventCount: z.number(),
      timeWindow: z.object({
        start: z.string(),
        end: z.string(),
      }),
      sourceIps: z.array(z.string()),
      userIds: z.array(z.string()),
      hostnames: z.array(z.string()),
      supportingEventIds: z.array(z.string()),
      summary: z.string(),
    })
  ),
  totalEventsProcessed: z.number(),
  falsePositivesFiltered: z.number(),
});

export type SignalFusionOutput = z.infer<typeof SignalFusionOutputSchema>;

/* ─────────────────────────────────────────────────────────────
   SAFE PARSE (STRICT)
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

  if (start !== -1 && end !== -1) {
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {}
  }

  return null; // CRITICAL: never return wrong schema
}

/* ─────────────────────────────────────────────────────────────
   NORMALIZATION
───────────────────────────────────────────────────────────── */

function normalizeClassification(
  value: string
): 'noise' | 'suspicious' | 'critical' {
  const v = (value || '').toLowerCase();

  if (v.includes('critical')) return 'critical';
  if (v.includes('suspicious')) return 'suspicious';
  if (v.includes('noise')) return 'noise';

  return 'suspicious';
}

function normalizeOutput(output: any): SignalFusionOutput {
  const clustersRaw = Array.isArray(output?.clusters) ? output.clusters : [];

  const clusters = clustersRaw.map((c: any, i: number) => ({
    clusterId: String(c?.clusterId ?? `cluster-${i}`),

    classification: normalizeClassification(c?.classification),

    confidenceScore:
      typeof c?.confidenceScore === 'number'
        ? c.confidenceScore
        : 0.7,

    eventCount:
      typeof c?.eventCount === 'number'
        ? c.eventCount
        : 1,

    timeWindow: {
      start: c?.timeWindow?.start ?? new Date().toISOString(),
      end: c?.timeWindow?.end ?? new Date().toISOString(),
    },

    sourceIps: Array.isArray(c?.sourceIps) ? c.sourceIps : [],
    userIds: Array.isArray(c?.userIds) ? c.userIds : [],
    hostnames: Array.isArray(c?.hostnames) ? c.hostnames : [],
    supportingEventIds: Array.isArray(c?.supportingEventIds)
      ? c.supportingEventIds
      : [],

    summary: String(c?.summary ?? 'Correlated security events'),
  }));

  return {
    clusters,
    totalEventsProcessed:
      typeof output?.totalEventsProcessed === 'number'
        ? output.totalEventsProcessed
        : clusters.length,

    falsePositivesFiltered:
      typeof output?.falsePositivesFiltered === 'number'
        ? output.falsePositivesFiltered
        : 0,
  };
}

/* ─────────────────────────────────────────────────────────────
   HARD FALLBACK (DETERMINISTIC)
───────────────────────────────────────────────────────────── */

function buildFallbackClusters(
  logs: SignalFusionInput['logs']
): SignalFusionOutput['clusters'] {

  if (!logs.length) return [];

  const classification: 'noise' | 'suspicious' | 'critical' =
    logs[0].severity === 'critical'
      ? 'critical'
      : logs[0].severity === 'high'
      ? 'suspicious'
      : 'noise';

  return [
    {
      clusterId: 'cluster-0',

      classification, // ✅ now exact union type

      confidenceScore: 0.8,
      eventCount: logs.length,

      timeWindow: {
        start: logs[0].timestamp,
        end: logs[logs.length - 1].timestamp,
      },

      // ✅ remove undefined values + force string[]
      sourceIps: logs
        .map(l => l.sourceIp)
        .filter((v): v is string => typeof v === 'string'),

      userIds: logs
        .map(l => l.userId)
        .filter((v): v is string => typeof v === 'string'),

      hostnames: logs
        .map(l => l.hostname)
        .filter((v): v is string => typeof v === 'string'),

      supportingEventIds: logs.map(l => l.id),

      summary: `${logs[0].eventType} affecting ${logs.length} events`,
    },
  ];
}

/* ─────────────────────────────────────────────────────────────
   MAIN FLOW
───────────────────────────────────────────────────────────── */

export async function runSignalFusion(
  input: SignalFusionInput
): Promise<SignalFusionOutput> {

  const prompt = `
You are Agent 1 (Signal Fusion).

STRICT RULES:
- Return ONLY JSON
- Use EXACT classification: noise OR suspicious OR critical
- NO markdown
- NO explanations

INPUT:
${JSON.stringify(input.logs, null, 2)}

OUTPUT:
{
  "clusters": [
    {
      "clusterId": "string",
      "classification": "noise | suspicious | critical",
      "confidenceScore": number,
      "eventCount": number,
      "timeWindow": { "start": "string", "end": "string" },
      "sourceIps": [],
      "userIds": [],
      "hostnames": [],
      "supportingEventIds": [],
      "summary": "string"
    }
  ],
  "totalEventsProcessed": number,
  "falsePositivesFiltered": number
}
`;

  const raw = await runLocalLLM(prompt);

  const parsed = safeParse(raw);

  // HARD GUARANTEE
  if (!parsed || !parsed.clusters?.length) {
    const fallbackClusters = buildFallbackClusters(input.logs);

    return {
      clusters: fallbackClusters,
      totalEventsProcessed: input.logs.length,
      falsePositivesFiltered: 0,
    };
  }

  const normalized = normalizeOutput(parsed);

  // SECOND GUARD
  if (!normalized.clusters.length) {
    normalized.clusters = buildFallbackClusters(input.logs);
  }

  return SignalFusionOutputSchema.parse(normalized);
}