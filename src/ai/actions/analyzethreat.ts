'use server';

import { analyzeThreatFlow } from '@/ai/analyze_threat_flow';
import { EnrichedEvent } from '@/lib/types';

export async function analyzeThreat(event: EnrichedEvent) {
  return analyzeThreatFlow(event);
}