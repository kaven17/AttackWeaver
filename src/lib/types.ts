import { z } from 'zod';

export interface RawLog {
  timestamp: string;
  source: 'auth_service' | 'file_system' | 'web_api' | 'firewall';
  host: string;
  event: string;
  user: string | null;
  message: string;
}

export interface EnrichedEvent {
  id: string;
  rawLog: RawLog;
  timestamp: string;
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
  };
  ruleBasedSeverity: number;
  behavioralBaseline: UserBehaviorBaseline;
}

export interface ProcessedThreat extends EnrichedEvent {
  riskScore: number | null; // Can be null until analyzed
  riskExplanation: string | null;
  detailedExplanation: string | null;
  behavioralAnomalyScore: number | null;
  behavioralExplanation: string | null;
  riskBreakdown: {
    ruleBased: number;
    contextual: number;
    behavioral: number;
  } | null;
  isAnalyzed: boolean;
}

// Simplified for client-side state
export interface UserBehaviorBaseline {
  loginTime: {
    normalRange: [number, number]; // e.g., [8, 17] for 8am-5pm
  };
  resourceAccess: {
    typicalOrder: string[];
  };
  apiCallFrequency: {
    mean: number;
    stdDev: number;
  };
}


// Schema for the comprehensive analysis flow
export const AnalyzeThreatInputSchema = z.custom<EnrichedEvent>();
export type AnalyzeThreatInput = z.infer<typeof AnalyzeThreatInputSchema>;

export const AnalyzeThreatOutputSchema = z.object({
    riskScore: z.number().describe("The final calculated risk score for the event (0-100)."),
    explanation: z.string().describe("A concise, one-sentence explanation of the risk score."),
    detailedExplanation: z.string().describe("A detailed, human-readable explanation of the event and its risk score (2-3 sentences, markdown format)."),
    behavioralAnomalyScore: z.number().describe("A probabilistic anomaly score (0.0-1.0) indicating the degree of deviation from the established behavioral baseline."),
    behavioralExplanation: z.string().describe("A human-readable explanation of the factors contributing to the behavioral anomaly score."),
    riskBreakdown: z.object({
        ruleBased: z.number().describe("Contribution to risk from static rules (0-100)."),
        contextual: z.number().describe("Contribution to risk from contextual factors like location/device novelty (0-100)."),
        behavioral: z.number().describe("Contribution to risk from behavioral deviations (0-100)."),
    }),
});
export type AnalyzeThreatOutput = z.infer<typeof AnalyzeThreatOutputSchema>;
