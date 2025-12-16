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
}

export interface ProcessedThreat extends RawEvent {
  riskScore: number;
  riskExplanation: string;
  detailedExplanation: string;
  behavioralAnomalyScore: number;
  behavioralExplanation: string;
}
