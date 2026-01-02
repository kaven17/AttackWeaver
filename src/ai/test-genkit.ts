// testThreatX.js
import { analyzeThreatFlow } from './analyze_threat_flow';
import { EnrichedEvent } from '@/lib/types';

// ---------------- MOCK BERT ----------------
async function runBertSemanticAnalysis(text: string) {
  // Mocking semantic signals
  return {
    semanticEventType: 'authentication_failure',
    targetPrivilege: 'high',
    confidence: 0.85
  };
}

// Patch the real import for testing
import * as bertModule from '@/ai/bert';
bertModule.runBertSemanticAnalysis = runBertSemanticAnalysis;

// ---------------- TEST EVENT ----------------
const testEvent: EnrichedEvent = {
  timestamp: new Date().toISOString(),
  user: { id: 'u123', name: 'Alice', role: 'admin' },
  device: { id: 'device001', isNovel: true },
  location: { country: 'US', isNovel: true },
  event: { type: 'login', details: 'Failed login attempt from new device' },
  ruleBasedSeverity: 7, // 1–10
  riskExplanation: 'Multiple failed login attempts detected',
  behavioralBaseline: {
    loginTime: { normalRange: [8, 18] },
    resourceAccess: { typicalOrder: ['dashboard', 'settings'] },
    apiCallFrequency: { mean: 20, stdDev: 5 }
  }
};

// ---------------- RUN FLOW ----------------
(async () => {
  try {
    const result = await analyzeThreatFlow(testEvent);
    console.log('===== ThreatX Output =====');
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('Error running ThreatX flow:', err);
  }
})();
