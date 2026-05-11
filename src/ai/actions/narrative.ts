'use server';

import { generateNarrative as gen } from '@/ai/flows/narrativeFlow';

export async function generateNarrative(fusion: any, path: any, response: any, trust: any) {
  return gen(fusion, path, response, trust);
}