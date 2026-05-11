/**
 * Agent API Service
 * Calls backend server for each AI agent
 */

const BASE_URL = 'http://192.168.137.203:3001';

async function callAgent(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(err.error || `HTTP ${response.status}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Agent failed');
  }
  return result.data;
}

export const agentAPI = {
  checkHealth: async () => {
    const r = await fetch(`${BASE_URL}/health`);
    return r.json();
  },

  runSignalFusion: (logs) =>
    callAgent('/api/agent/signal-fusion', logs),

  runAttackPath: (incidentData) =>
    callAgent('/api/agent/attack-path', incidentData),

  runResponseAgent: (incidentAndAttack) =>
    callAgent('/api/agent/response', incidentAndAttack),

  runTrustAuditor: (allData) =>
    callAgent('/api/agent/trust-auditor', allData),

  runNarrativeEngine: (allAgentOutputs) =>
    callAgent('/api/agent/narrative', allAgentOutputs),
};