'use server';

const AGENT_BASE = 'http://192.168.68.123:3001';

export async function runSignalFusion(input: any) {
  const res = await fetch(`${AGENT_BASE}/api/agent/signal-fusion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    throw new Error('Signal Fusion agent failed');
  }

  const data = await res.json();

  return {
    clusters: [],
    totalEventsProcessed: input.logs?.length || 0,
    falsePositivesFiltered: 0,
    raw: data.data, // AI text output
  };
}