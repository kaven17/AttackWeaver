export type BertSemanticSignals = {
    semanticEventType: string;
    action: string;
    targetPrivilege: 'low' | 'medium' | 'high';
    confidence: number; // 0.0 – 1.0
  };
  