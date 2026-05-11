
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runBertSemanticAnalysis } from '@/ai/bert';
import { EnrichedEvent } from '@/lib/types';
import fetch from 'node-fetch';

/* ======================================================
   TYPES
====================================================== */

type CanonicalEventType =
  | 'PRIVILEGE_ESCALATION'
  | 'LOGIN_ATTEMPT'
  | 'API_CALL'
  | 'RESOURCE_ACCESS'
  | 'NETWORK_CONNECTION'
  | 'UNKNOWN';

export const AttackStageSchema = z.enum([
  'Reconnaissance',
  'Initial Access',
  'Privilege Escalation',
  'Lateral Movement',
  'Persistence',
  'Unknown',
]);
export type AttackStage = z.infer<typeof AttackStageSchema>;

export const AnalyzeThreatInputSchema = z.custom<EnrichedEvent>();
export type AnalyzeThreatInput = EnrichedEvent;

export const UnifiedThreatAnalysisOutputSchema = z.object({
  riskScore: z.number(),
  behavioralAnomalyScore: z.number(),
  behavioralExplanation: z.string(),
  detailedExplanation: z.string(),
  attackStage: AttackStageSchema,
  attackChain: z.array(AttackStageSchema),
  confidence: z.object({
    confidenceScore: z.number(),
    confidenceExplanation: z.string(),
  }),
  riskBreakdown: z.object({
    ruleBased: z.number(),
    contextual: z.number(),
    behavioral: z.number(),
  }),
  semanticSignals: z.object({
    semanticEventType: z.string(),
    targetPrivilege: z.string(),
    confidence: z.number(),
    ipReputationScore: z.number(),
  }),
});

export type UnifiedThreatAnalysisOutput =
  z.infer<typeof UnifiedThreatAnalysisOutputSchema>;

export type BertSemanticSignals = {
  semanticEventType:
    | 'authentication_failure'
    | 'authentication_success'
    | 'resource_access'
    | 'privilege_change'
    | 'configuration_change'
    | 'unknown';
  targetPrivilege: 'low' | 'medium' | 'high';
  confidence: number;
};

/* ======================================================
   FLOW
====================================================== */

export const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: UnifiedThreatAnalysisOutputSchema,
  },
  async (event): Promise<UnifiedThreatAnalysisOutput> => {
    console.log('=== ThreatLens AI Flow Started ===');

    // 1️⃣ Semantic
    const bertSignals = await runBertSemanticAnalysis(event.event.details);

    // 2️⃣ IP reputation
    const ipReputationScore = await queryAbuseIPDB(event.location.ip);

    // 3️⃣ Behavioral
    const behavioralAnomalyScore = computeBehavioralScore(event, bertSignals);

    // 4️⃣ Risk
    const riskBreakdown = computeRiskBreakdown(
      event,
      behavioralAnomalyScore,
      ipReputationScore
    );

    const riskScore = aggregateRisk(riskBreakdown, event);

    // 5️⃣ Attack stage
    const attackStage = await inferAttackStage(event, bertSignals);

    // 6️⃣ Chain
    const attackChain = buildAttackChain(event, attackStage);

    // 7️⃣ Confidence
    const confidence = calibrateConfidence(
      event,
      bertSignals,
      behavioralAnomalyScore
    );

    // 8️⃣ Explanation
    const explanations = buildExplanations(
      event,
      bertSignals,
      riskScore,
      attackStage,
      behavioralAnomalyScore
    );

    return {
      riskScore,
      behavioralAnomalyScore,
      behavioralExplanation: explanations.behavioral,
      detailedExplanation: explanations.detailed,
      attackStage,
      attackChain,
      confidence,
      riskBreakdown,
      semanticSignals: {
        ...bertSignals,
        ipReputationScore,
      },
    };
  }
);

/* ======================================================
   CORE LOGIC
====================================================== */

function computeBehavioralScore(
  event: EnrichedEvent,
  bert: BertSemanticSignals
): number {
  let score = 0;

  if (event.device.isNovel) score += 0.15;
  if (event.location.isNovel) score += 0.15;
  if (event.temporal?.isOffHours) score += 0.1;

  // critical fix
  if (
    event.event.type === 'Privilege Escalation' ||
    bert.semanticEventType === 'privilege_change'
  ) {
    score += 0.5;
  }

  if ((event.temporal?.recentFailures ?? 0) >= 3) score += 0.2;
  if (event.network?.knownC2Pattern) score += 0.3;

  return Math.min(score, 1);
}

function computeRiskBreakdown(
  event: EnrichedEvent,
  behavioralScore: number,
  ipReputation: number
) {
  const ruleBased = event.ruleBasedSeverity * 10;

  const contextual =
    (event.device.isNovel ? 10 : 0) +
    (event.location.isNovel ? 10 : 0) +
    (event.temporal?.isOffHours ? 5 : 0) +
    (ipReputation > 50 ? 10 : 0);

  const behavioral = Math.round(behavioralScore * 100);

  return { ruleBased, contextual, behavioral };
}

function aggregateRisk(
  b: { ruleBased: number; contextual: number; behavioral: number },
  event: EnrichedEvent
) {
  let score = Math.round(
    b.ruleBased * 0.45 +
      b.behavioral * 0.35 +
      b.contextual * 0.2
  );

  // hard rule
  if (event.event.type === 'Privilege Escalation') {
    score = Math.max(score, 75);
  }

  return Math.min(score, 100);
}

async function inferAttackStage(
  event: EnrichedEvent,
  bert: BertSemanticSignals
): Promise<AttackStage> {
  if (
    event.event.type === 'Privilege Escalation' ||
    bert.semanticEventType === 'privilege_change'
  ) {
    return 'Privilege Escalation';
  }

  if (event.network?.knownC2Pattern) return 'Lateral Movement';

  if (bert.semanticEventType === 'authentication_failure') {
    return 'Initial Access';
  }

  return 'Unknown';
}

function buildAttackChain(
  event: EnrichedEvent,
  stage: AttackStage
): AttackStage[] {
  const chain: AttackStage[] = [];

  if (stage === 'Privilege Escalation') {
    chain.push('Initial Access');
  }

  chain.push(stage);

  if (event.network?.knownC2Pattern) {
    chain.push('Lateral Movement');
  }

  return [...new Set(chain)];
}

function calibrateConfidence(
  event: EnrichedEvent,
  bert: BertSemanticSignals,
  behavioralScore: number
) {
  let score = 60;

  score += Math.round(bert.confidence * 20);

  if (bert.semanticEventType === 'privilege_change') {
    score += 10;
  }

  if (behavioralScore > 0.4) score += 10;
  if (event.ruleBasedSeverity >= 7) score += 10;

  score = Math.min(score, 95);

  return {
    confidenceScore: score,
    confidenceExplanation:
      score >= 80
        ? 'Strong multi-signal correlation.'
        : 'Moderate confidence based on partial signals.',
  };
}

function buildExplanations(
  event: EnrichedEvent,
  bert: BertSemanticSignals,
  riskScore: number,
  stage: AttackStage,
  behavioralScore: number
) {
  const behavioral =
    behavioralScore > 0.4
      ? 'Behavior deviates from expected baseline.'
      : 'Behavior aligns with baseline.';

  let detailed = '';

  if (stage === 'Privilege Escalation') {
    detailed = `Privilege escalation attempt detected for ${event.user.id}. This indicates a high-risk action with potential system-wide impact. Final risk score ${riskScore}.`;
  } else {
    detailed = `Event classified as ${stage}. Final risk score ${riskScore}.`;
  }

  return { behavioral, detailed };
}

/* ======================================================
   ABUSE IP
====================================================== */

async function queryAbuseIPDB(ip: string): Promise<number> {
  try {
    const res = await fetch(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`,
      {
        headers: {
          Key: process.env.ABUSEIPDB_KEY!,
          Accept: 'application/json',
        },
      }
    );

    const json: any = await res.json();

    return typeof json?.data?.abuseConfidenceScore === 'number'
      ? Math.min(100, json.data.abuseConfidenceScore)
      : 0;
  } catch {
    return 0;
  }
}