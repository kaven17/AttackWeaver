import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { runBertSemanticAnalysis } from '@/ai/bert';
import { EnrichedEvent } from '@/lib/types';
import fetch from 'node-fetch';
import 'server-only';
import { googleAI } from '@genkit-ai/google-genai';


/* ======================================================
   CANONICAL TYPES
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

/* ======================================================
   SCHEMAS
====================================================== */
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
   ATTACK STAGE (RULE-BASED → AI FALLBACK)
====================================================== */
async function inferAttackStage(
  event: EnrichedEvent,
  bert: BertSemanticSignals
): Promise<AttackStage> {
  const canonical = normalizeEventType(event.event.type);

  if (canonical === 'PRIVILEGE_ESCALATION' || bert.semanticEventType === 'privilege_change') {
    return 'Privilege Escalation';
  }
  if (event.network?.knownC2Pattern) {
    return 'Lateral Movement';
  }
  if (canonical === 'LOGIN_ATTEMPT' &&
      (bert.semanticEventType === 'authentication_failure' || (event.temporal?.recentFailures ?? 0) > 0)) {
    return 'Initial Access';
  }
  if (event.precedingSignals?.privilegeAttemptsObserved) {
    return 'Persistence';
  }

  // AI fallback
  return await inferAttackStageWithAI(event);
}

/* ======================================================
   CORE FLOW
====================================================== */
export const analyzeThreatFlow = ai.defineFlow(
  {
    name: 'analyzeThreatFlow',
    inputSchema: AnalyzeThreatInputSchema,
    outputSchema: UnifiedThreatAnalysisOutputSchema,
  },
  async (event): Promise<UnifiedThreatAnalysisOutput> => {
    console.log('=== ThreatLens AI Flow Started ===');
    console.log('Event Received:', JSON.stringify(event, null, 2));

    // 1️⃣ Run BERT semantic analysis
    console.log('\n[Step 1] Running BERT semantic analysis...');
    const bertSignals = await runBertSemanticAnalysis(event.event.details);
    console.log('BERT Signals:', bertSignals);

    // 2️⃣ Query IP reputation
    console.log('\n[Step 2] Querying AbuseIPDB...');
    const ipReputationScore = await queryAbuseIPDB(event.location.ip);
    console.log('IP Reputation Score:', ipReputationScore);

    // 3️⃣ Compute behavioral anomaly
    console.log('\n[Step 3] Computing behavioral anomaly score...');
    const behavioralAnomalyScore = computeBehavioralScore(event, bertSignals);
    console.log('Behavioral Anomaly Score:', behavioralAnomalyScore);

    // 4️⃣ Risk breakdown and aggregate score
    console.log('\n[Step 4] Computing risk breakdown...');
    const riskBreakdown = computeRiskBreakdown(event, behavioralAnomalyScore, ipReputationScore);
    const riskScore = aggregateRisk(riskBreakdown);
    console.log('Risk Breakdown:', riskBreakdown);
    console.log('Aggregated Risk Score:', riskScore);

    // 5️⃣ Determine attack stage with AI fallback
    console.log('\n[Step 5] Inferring attack stage...');
    const attackStage = await inferAttackStage(event, bertSignals);
    console.log('Attack Stage:', attackStage);

    // 6️⃣ Build attack chain
    console.log('\n[Step 6] Building attack chain...');
    const attackChain = buildAttackChain(event, attackStage);
    console.log('Attack Chain:', attackChain.join(' → '));

    // 7️⃣ Calibrate confidence
    console.log('\n[Step 7] Calibrating confidence...');
    const confidence = calibrateConfidence(event, bertSignals, behavioralAnomalyScore);
    console.log('Confidence:', confidence);

    // 8️⃣ Build explanations
    console.log('\n[Step 8] Building explanations...');
    const explanations = buildExplanations(event, bertSignals, riskScore, attackStage, behavioralAnomalyScore);
    console.log('Explanations:', explanations);

    console.log('\n=== ThreatLens AI Flow Completed ===\n');

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
   NORMALIZATION
====================================================== */
function normalizeEventType(raw: EnrichedEvent['event']['type']): CanonicalEventType {
  switch (raw) {
    case 'Privilege Escalation':
      return 'PRIVILEGE_ESCALATION';
    case 'Login Attempt':
      return 'LOGIN_ATTEMPT';
    case 'API Call':
      return 'API_CALL';
    case 'Resource Access':
      return 'RESOURCE_ACCESS';
    case 'Network Connection':
      return 'NETWORK_CONNECTION';
    default:
      return 'UNKNOWN';
  }
}

/* ======================================================
   BEHAVIORAL INTELLIGENCE
====================================================== */
function computeBehavioralScore(event: EnrichedEvent, bert: BertSemanticSignals): number {
  let score = 0;
  if (event.device.isNovel) score += 0.15;
  if (event.location.isNovel) score += 0.15;
  if (event.temporal?.isOffHours) score += 0.1;
  if (event.actorCapabilities?.attemptedPrivilege &&
      event.actorCapabilities.allowedPrivilege !== event.actorCapabilities.attemptedPrivilege) {
    score += 0.45;
  }
  if ((event.temporal?.recentFailures ?? 0) >= 3) score += 0.15;
  if (event.network?.knownC2Pattern) score += 0.3;
  if (bert.targetPrivilege === 'high') score += 0.1;
  return Math.min(score, 1);
}

/* ======================================================
   RISK COMPUTATION
====================================================== */
function computeRiskBreakdown(event: EnrichedEvent, behavioralScore: number, ipReputation: number) {
  const ruleBased = event.ruleBasedSeverity * 10;
  const contextual = (event.device.isNovel ? 10 : 0) +
                     (event.location.isNovel ? 10 : 0) +
                     (event.temporal?.isOffHours ? 5 : 0) +
                     (ipReputation > 50 ? 10 : 0);
  const behavioral = Math.round(behavioralScore * 100);
  return { ruleBased, contextual, behavioral };
}

function aggregateRisk(b: { ruleBased: number; contextual: number; behavioral: number }) {
  return Math.min(Math.round(b.ruleBased * 0.45 + b.behavioral * 0.35 + b.contextual * 0.2), 100);
}

async function inferAttackStageWithAI(event: EnrichedEvent): Promise<AttackStage> {
  const prompt = `
Infer the MITRE ATT&CK stage for the following event.
Return ONLY one of:
Reconnaissance
Initial Access
Privilege Escalation
Lateral Movement
Persistence
Unknown

Event:
${JSON.stringify(event, null, 2)}
`;

  try {
    // Pass just the prompt as a string
    const res = await ai.generate(prompt);

    const t = res.text?.trim();
    const allowed: AttackStage[] = [
      'Reconnaissance',
      'Initial Access',
      'Privilege Escalation',
      'Lateral Movement',
      'Persistence',
      'Unknown'
    ];
    return allowed.includes(t as AttackStage) ? (t as AttackStage) : 'Unknown';
  } catch (err) {
    console.error('[inferAttackStageWithAI] AI fallback failed:', err);
    return 'Unknown';
  }
}




/* ======================================================
   ATTACK CHAIN
====================================================== */
function buildAttackChain(event: EnrichedEvent, stage: AttackStage): AttackStage[] {
  const chain: AttackStage[] = [];
  if ((event.temporal?.recentFailures ?? 0) > 0) chain.push('Initial Access');
  if (event.actorCapabilities?.attemptedPrivilege &&
      event.actorCapabilities.allowedPrivilege !== event.actorCapabilities.attemptedPrivilege) chain.push('Privilege Escalation');
  if (event.network?.knownC2Pattern) chain.push('Lateral Movement');
  if (event.precedingSignals?.privilegeAttemptsObserved) chain.push('Persistence');
  if (chain.length === 0) chain.push(stage);
  return [...new Set(chain)];
}

/* ======================================================
   CONFIDENCE
====================================================== */
function calibrateConfidence(event: EnrichedEvent, bert: BertSemanticSignals, behavioralScore: number) {
  let score = 60;
  score += Math.round(bert.confidence * 20);
  score += behavioralScore > 0.4 ? 10 : 0;
  score += event.ruleBasedSeverity >= 7 ? 10 : 0;
  score = Math.min(score, 95);
  return {
    confidenceScore: score,
    confidenceExplanation: score >= 80
      ? 'Assessment is supported by explicit security-relevant behavior.'
      : 'Assessment is based on limited corroborating signals.',
  };
}

/* ======================================================
   EXPLANATIONS
====================================================== */
function buildExplanations(_event: EnrichedEvent, bert: BertSemanticSignals, riskScore: number, stage: AttackStage, behavioralScore: number) {
  const behavioral = behavioralScore > 0.4
    ? 'The activity violates expected role behavior.'
    : 'The activity aligns with historical behavior.';
  const detailed = `Detected ${bert.semanticEventType} mapped to ${stage}. Final risk score ${riskScore}.`;
  return { behavioral, detailed };
}

/* ======================================================
   ABUSEIPDB
====================================================== */
async function queryAbuseIPDB(ip: string): Promise<number> {
  try {
    const res = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${ip}`, {
      headers: { Key: process.env.ABUSEIPDB_KEY!, Accept: 'application/json' },
    });
    const json: any = await res.json();
    return typeof json?.data?.abuseConfidenceScore === 'number'
      ? Math.min(100, json.data.abuseConfidenceScore)
      : 0;
  } catch {
    return 0;
  }
}
