export interface UserBehaviorBaseline {
    loginTime: {
        normalRange: [number, number]; // e.g., [8, 17] for 8am-5pm
        typicalDays: string[]; // e.g., ['Mon', 'Tue', 'Wed']
    };
    resourceAccess: {
        typicalOrder: string[];
    };
    apiCallFrequency: {
        mean: number;
        stdDev: number;
    };
}

export interface RawEvent {
  id: string;
  timestamp: string;
  user: {
    id: string;
    name: string;
    role: 'Admin' | 'Developer' | 'User';
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
      | 'Privilege Escalation';
    details: string;
  };
  ruleBasedSeverity: number; // 1-10
  contextualAnomalyScore: number; // 0-1
  behavioralAnomalyScore: number; // 0-1
  behavioralBaseline: UserBehaviorBaseline;
  confidence: number; // 0-1
}

export interface ProcessedThreat extends RawEvent {
  riskScore: number;
  riskExplanation: string;
  detailedExplanation: string;
  behavioralExplanation: string;
  riskBreakdown: {
    ruleBased: number;
    contextual: number;
    behavioral: number;
  };
}
