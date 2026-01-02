import { z } from 'zod';

/* ======================================================
   Base Raw Log
   ====================================================== */
export interface RawLog {
  timestamp: string;
  source: 'auth_service' | 'file_system' | 'web_api' | 'firewall';
  host: string;
  event: string;
  user: string | null;
  message: string;
}

/* ======================================================
   User Behavioral Baseline
   ====================================================== */
export interface UserBehaviorBaseline {
  loginTime: {
    normalRange: [number, number]; // e.g., [8, 17] for 8am–5pm
  };
  resourceAccess: {
    typicalOrder: string[]; // usual sequence of resources
  };
  apiCallFrequency: {
    mean: number;
    stdDev: number;
  };
}

/* ======================================================
   Enriched Event
   ====================================================== */
export interface EnrichedEvent {
  id: string;
  timestamp: string;
  rawLog: RawLog;

  user: {
    id: string;
    name: string;
    role: string;
  };

  device: {
    id: string;
    isNovel: boolean;
  };

  location: {
    ip: string;
    country: string;
    isNovel: boolean;
  };

  event: {
    type:
      | 'Login Attempt'
      | 'API Call'
      | 'Resource Access'
      | 'Privilege Escalation'
      | 'Network Connection'
      | 'Unknown';
    details: string;
    resourceAccessed?: string;
    apiCallsPerHour?: number;
  };

  network?: {
    knownC2Pattern?: boolean;
    dstPortRisk?: 'low' | 'medium' | 'high';
    suspiciousConnection?: boolean;
  };

  temporal?: {
    isOffHours?: boolean;
    recentFailures?: number;
    unusualTimePattern?: boolean;
  };

  actorCapabilities?: {
    allowedPrivilege?: 'low' | 'medium' | 'high';
    attemptedPrivilege?: 'low' | 'medium' | 'high';
  };

  precedingSignals?: {
    privilegeAttemptsObserved?: boolean;
    failedLoginsObserved?: boolean;
  };

  ruleBasedSeverity: number;
  riskExplanation: string;

  behavioralBaseline: UserBehaviorBaseline;

  behavioralAnomalyScore?: number;
  behavioralExplanation?: string;
}

/* ======================================================
   Fully Processed Threat
   ====================================================== */
export interface ProcessedThreat {
  id: string;
  timestamp: string;
  rawLog: RawLog;
  user: EnrichedEvent['user'];
  device: EnrichedEvent['device'];
  location: EnrichedEvent['location'];
  event: EnrichedEvent['event'];
  ruleBasedSeverity: number;
  riskExplanation: string;
  behavioralBaseline: UserBehaviorBaseline;

  riskScore: number | null;
  detailedExplanation: string | null;
  behavioralAnomalyScore: number | null;
  behavioralExplanation: string | null;
  riskBreakdown:
    | {
        ruleBased: number;
        contextual: number;
        behavioral: number;
      }
    | null;
  isAnalyzed: boolean;
}

/* ======================================================
   Genkit Input / Output Schemas
   ====================================================== */
export const AnalyzeThreatInputSchema = z.custom<EnrichedEvent>();
export type AnalyzeThreatInput = z.infer<typeof AnalyzeThreatInputSchema>;

export const AnalyzeThreatOutputSchema = z.object({
  riskScore: z.number().describe(
    'Final adaptive risk score (0–100), enhancing the initial rule-based severity.'
  ),
  detailedExplanation: z.string().describe(
    'SOC-ready, human-readable explanation of the event and its risk score (2–3 sentences).'
  ),
  behavioralAnomalyScore: z.number().describe(
    'Anomaly probability (0.0–1.0) indicating deviation from the user baseline.'
  ),
  riskBreakdown: z.object({
    ruleBased: z.number().describe('Contribution from static rules (0–100).'),
    contextual: z.number().describe(
      'Contribution from contextual signals like device/location novelty (0–100).'
    ),
    behavioral: z.number().describe(
      'Contribution from behavioral deviations (0–100).'
    ),
  }),
  attackStage: z.string().describe('Inferred stage of the attack lifecycle'),
  confidence: z.object({
    confidenceScore: z.number().describe('Confidence in the AI analysis (0–100)'),
    confidenceExplanation: z.string().describe('Reasoning behind the confidence score'),
  }),
});

export type AnalyzeThreatOutput = z.infer<typeof AnalyzeThreatOutputSchema>;

