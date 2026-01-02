// src/ai/dev.ts
import 'dotenv/config';
import { analyzeThreatFlow } from './analyze_threat_flow';
import { EnrichedEvent } from '@/lib/types';

async function main() {
  const testEvent: EnrichedEvent = {
    timestamp: new Date().toISOString(),
    user: { id: 'u123', name: 'Alice', role: 'admin' },
    device: { id: 'd456', isNovel: true },
    location: { country: 'US', isNovel: true },
    event: {
      type: 'login',
      details: 'Failed login attempt for admin from new device'
    },
    ruleBasedSeverity: 6,
    riskExplanation: 'Multiple failed login attempts detected',
    behavioralBaseline: {
      loginTime: { normalRange: [8, 18] },
      resourceAccess: { typicalOrder: ['dashboard', 'settings'] },
      apiCallFrequency: { mean: 10, stdDev: 2 }
    }
  };

  try {
    const output = await analyzeThreatFlow(testEvent);
    console.log(JSON.stringify(output, null, 2));
  } catch (err) {
    console.error('Error running ThreatX flow:', err);
  }
}

main();
