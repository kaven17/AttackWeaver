'use server';

import { runAttackPath as runAttackPathFlow } from '@/ai/flows/attackPathFlow';

export async function runAttackPath(input: any) {
  return runAttackPathFlow(input);
}