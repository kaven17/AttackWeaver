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
