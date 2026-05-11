'use server';

import { runTrustAudit as runTrustAuditFlow } from '@/ai/flows/trustAuditFlow';

export async function runTrustAudit(events: any[]) {
  return runTrustAuditFlow(events);
}