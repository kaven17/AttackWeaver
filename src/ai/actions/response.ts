'use server';

const AGENT_BASE = 'http://192.168.68.123:3001';

export async function runResponseAgent(fusion: any, path: any) {
  const res = await fetch(`${AGENT_BASE}/api/agent/response`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fusion,
      path,
    }),
  });

  if (!res.ok) {
    throw new Error('Response agent failed');
  }

  const data = await res.json();

  return {
    actions: [],
    overallSeverity: path.blastRadius || 0,
    estimatedContainmentTimeMinutes: 30,
    immediateActionsRequired: 1,
    raw: data.data, // keep AI text if needed
  };
}