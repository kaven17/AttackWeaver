import { z } from 'zod';
import { runLocalLLM } from '@/ai/ollama';
import type { SignalFusionOutput } from './signalFusionflow';

/* ─────────────────────────────────────────────────────────────
   TOPOLOGY
───────────────────────────────────────────────────────────── */

const NETWORK_TOPOLOGY = {
  assets: [
    { id: 'ws-jsmith-01',     type: 'workstation',      criticality: 'low',      owner: 'jsmith',    trusts: ['fs-prod-01', 'dc-01'] },
    { id: 'ws-mchen-02',      type: 'workstation',      criticality: 'low',      owner: 'mchen',     trusts: ['fs-prod-01'] },
    { id: 'fs-prod-01',       type: 'file_server',      criticality: 'high',     owner: 'it-ops',    trusts: ['db-prod-01', 'backup-srv-01'] },
    { id: 'dc-01',            type: 'domain_controller',criticality: 'critical', owner: 'it-ops',    trusts: ['admin-console-01', 'db-prod-01', 'backup-srv-01'] },
    { id: 'db-prod-01',       type: 'database',         criticality: 'critical', owner: 'dba-team',  trusts: [] },
    { id: 'admin-console-01', type: 'admin_console',    criticality: 'critical', owner: 'it-ops',    trusts: ['dc-01', 'db-prod-01'] },
    { id: 'backup-srv-01',    type: 'backup_server',    criticality: 'high',     owner: 'it-ops',    trusts: [] },
  ],
  identities: [
    { id: 'jsmith',     role: 'developer',       privileged: false, canAccess: ['ws-jsmith-01', 'fs-prod-01'] },
    { id: 'rthompson',  role: 'analyst',         privileged: false, canAccess: ['ws-mchen-02', 'fs-prod-01'] },
    { id: 'mchen',      role: 'engineer',        privileged: false, canAccess: ['ws-mchen-02', 'fs-prod-01', 'db-prod-01'] },
    { id: 'svc-backup', role: 'service_account', privileged: true,  canAccess: ['backup-srv-01', 'fs-prod-01', 'db-prod-01'] },
  ],
};

/* MITRE ATT&CK stage → technique mapping used during local computation */
const STAGE_TECHNIQUES: Record<string, { id: string; name: string; stage: string }[]> = {
  'Initial Access':        [{ id: 'T1078', name: 'Valid Accounts', stage: 'Initial Access' }, { id: 'T1190', name: 'Exploit Public-Facing App', stage: 'Initial Access' }],
  'Execution':             [{ id: 'T1059.001', name: 'PowerShell', stage: 'Execution' }, { id: 'T1059.003', name: 'Windows Command Shell', stage: 'Execution' }],
  'Persistence':           [{ id: 'T1547', name: 'Boot Autostart', stage: 'Persistence' }, { id: 'T1136', name: 'Create Account', stage: 'Persistence' }],
  'Privilege Escalation':  [{ id: 'T1068', name: 'Exploitation for Privilege Escalation', stage: 'Privilege Escalation' }, { id: 'T1078.003', name: 'Local Accounts', stage: 'Privilege Escalation' }],
  'Lateral Movement':      [{ id: 'T1021.001', name: 'Remote Desktop Protocol', stage: 'Lateral Movement' }, { id: 'T1021.002', name: 'SMB/Windows Admin Shares', stage: 'Lateral Movement' }],
  'Collection':            [{ id: 'T1039', name: 'Data from Network Shared Drive', stage: 'Collection' }, { id: 'T1005', name: 'Data from Local System', stage: 'Collection' }],
  'Exfiltration':          [{ id: 'T1041', name: 'Exfiltration Over C2 Channel', stage: 'Exfiltration' }, { id: 'T1048', name: 'Exfiltration Over Alt Protocol', stage: 'Exfiltration' }],
  'Reconnaissance':        [{ id: 'T1595', name: 'Active Scanning', stage: 'Reconnaissance' }, { id: 'T1592', name: 'Gather Victim Host Info', stage: 'Reconnaissance' }],
};

const CRITICALITY_ORDER = ['low', 'medium', 'high', 'critical'];
const HIGH_VALUE = ['database', 'domain_controller', 'admin_console'];

/* ─────────────────────────────────────────────────────────────
   SCHEMA
───────────────────────────────────────────────────────────── */

export const AttackPathOutputSchema = z.object({
  nodes: z.array(
    z.object({
      id:             z.string(),
      label:          z.string(),
      type:           z.enum(['host', 'user', 'service', 'data']),
      criticality:    z.enum(['low', 'medium', 'high', 'critical']),
      compromised:    z.boolean(),
      mitreTechnique: z.string().optional(),
      mitreStage:     z.string().optional(),
    })
  ),
  edges: z.array(
    z.object({
      from:      z.string(),
      to:        z.string(),
      label:     z.string(),
      technique: z.string(),
      mitreId:   z.string(),
      stage:     z.string(),
    })
  ),
  blastRadius:                 z.number(),
  highValueTargetsReached:     z.array(z.string()),
  attackStages:                z.array(z.string()),
  estimatedDwellTimeMinutes:   z.number(),
  computedLocally:             z.boolean().optional(),
});

export type AttackPathOutput = z.infer<typeof AttackPathOutputSchema>;

/* ─────────────────────────────────────────────────────────────
   SAFE PARSE
───────────────────────────────────────────────────────────── */

function safeParse(raw: string): any | null {
  try { return JSON.parse(raw); } catch {}

  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end   = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) return null;

  try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { return null; }
}

/* ─────────────────────────────────────────────────────────────
   NORMALIZATION
───────────────────────────────────────────────────────────── */

function normalizeNodeType(type: any): 'host' | 'user' | 'service' | 'data' {
  const t = String(type || '').toLowerCase();
  if (t.includes('user'))                      return 'user';
  if (t.includes('service'))                   return 'service';
  if (t.includes('db') || t.includes('data')) return 'data';
  return 'host';
}

function normalizeOutput(raw: any): AttackPathOutput {
  const output: any = raw || {};

  /* NODES */
  let nodes = Array.isArray(output.nodes) ? output.nodes : [];
  nodes = nodes
    .filter((n: any) => n && (n.id || n.label))
    .map((n: any, i: number) => ({
      id:             String(n?.id ?? `node-${i}`),
      label:          String(n?.label ?? n?.id ?? `node-${i}`),
      type:           normalizeNodeType(n?.type),
      criticality:    ['low','medium','high','critical'].includes(String(n?.criticality).toLowerCase())
                        ? String(n.criticality).toLowerCase() as any
                        : 'low',
      compromised:    Boolean(n?.compromised ?? true),
      mitreTechnique: String(n?.mitreTechnique ?? 'T1078'),
      mitreStage:     String(n?.mitreStage ?? 'Initial Access'),
    }));

  if (nodes.length === 0) {
    nodes = [{ id:'entry', label:'Initial Compromise', type:'host', criticality:'low', compromised:true, mitreTechnique:'T1078', mitreStage:'Initial Access' }];
  }

  /* EDGES */
  let edges = Array.isArray(output.edges) ? output.edges : [];
  edges = edges
    .filter((e: any) => e && (e.from || e.to))
    .map((e: any) => ({
      from:      String(e?.from ?? nodes[0].id),
      to:        String(e?.to   ?? nodes[0].id),
      label:     String(e?.label     ?? 'lateral movement'),
      technique: String(e?.technique ?? 'unknown'),
      mitreId:   String(e?.mitreId   ?? 'T0000'),
      stage:     String(e?.stage     ?? 'unknown'),
    }));

  if (edges.length === 0 && nodes.length > 1) {
    edges = nodes.slice(1).map((n: any, i: number) => ({
      from: nodes[i].id, to: n.id,
      label: 'progression', technique: 'inferred', mitreId: 'T0000', stage: 'unknown',
    }));
  }

  /* STAGES */
  let attackStages = Array.isArray(output.attackStages)
    ? output.attackStages
        .map((s: any) => typeof s === 'string' ? s : s?.stage || s?.name || null)
        .filter((v: any): v is string => typeof v === 'string')
    : [];
  if (attackStages.length === 0) attackStages = ['Initial Access'];

  /* SCALARS */
  const blastRadius = typeof output.blastRadius === 'number' && output.blastRadius > 0
    ? output.blastRadius : nodes.length;
  const highValueTargetsReached = Array.isArray(output.highValueTargetsReached)
    ? output.highValueTargetsReached.filter((v: any): v is string => typeof v === 'string')
    : [];
  const estimatedDwellTimeMinutes = typeof output.estimatedDwellTimeMinutes === 'number'
    ? output.estimatedDwellTimeMinutes : 15;

  return { nodes, edges, blastRadius, highValueTargetsReached, attackStages, estimatedDwellTimeMinutes };
}

/* ─────────────────────────────────────────────────────────────
   LOCAL COMPUTATION ENGINE
   Runs when LLM returns nothing usable.
   Uses fusion clusters + topology to deterministically build
   the most plausible attack path.
───────────────────────────────────────────────────────────── */

function pickTechnique(stage: string, index = 0) {
  const bucket = STAGE_TECHNIQUES[stage] ?? STAGE_TECHNIQUES['Initial Access'];
  return bucket[index % bucket.length];
}

function inferStagesFromClusters(clusters: SignalFusionOutput['clusters']): string[] {
  const stageSet = new Set<string>();

  for (const cluster of clusters) {
    const desc = (cluster.summary ?? '').toLowerCase();

    if (desc.includes('privilege') || desc.includes('escalat')) stageSet.add('Privilege Escalation');
    if (desc.includes('lateral')   || desc.includes('movement')) stageSet.add('Lateral Movement');
    if (desc.includes('exfil')     || desc.includes('transfer')) stageSet.add('Exfiltration');
    if (desc.includes('persist')   || desc.includes('account')) stageSet.add('Persistence');
    if (desc.includes('reconn')    || desc.includes('scan')) stageSet.add('Reconnaissance');
    if (desc.includes('login')     || desc.includes('auth') || desc.includes('access')) stageSet.add('Initial Access');
  }

  if (stageSet.size === 0) stageSet.add('Initial Access');

  const order = [
    'Reconnaissance',
    'Initial Access',
    'Execution',
    'Persistence',
    'Privilege Escalation',
    'Lateral Movement',
    'Collection',
    'Exfiltration'
  ];

  return order.filter(s => stageSet.has(s));
}
function resolveEntryAsset(clusters: SignalFusionOutput['clusters']) {

  for (const cluster of clusters) {

    // FIX: use supportingEventIds instead of relatedEventIds
    for (const event of cluster.supportingEventIds ?? []) {
      const match = NETWORK_TOPOLOGY.assets.find(a =>
        event.includes(a.id) || event.includes(a.owner)
      );
      if (match) return match;
    }

    const summaryLower = (cluster.summary ?? '').toLowerCase();

    const match = NETWORK_TOPOLOGY.assets.find(a =>
      summaryLower.includes(a.id) ||
      summaryLower.includes(a.owner) ||
      summaryLower.includes(a.type)
    );

    if (match) return match;
  }

  return NETWORK_TOPOLOGY.assets
    .slice()
    .sort((a, b) =>
      CRITICALITY_ORDER.indexOf(a.criticality) -
      CRITICALITY_ORDER.indexOf(b.criticality)
    )[0];
}

export function computeAttackPathLocally(fusion: SignalFusionOutput): AttackPathOutput {
  const stages        = inferStagesFromClusters(fusion.clusters);
  const entryAsset    = resolveEntryAsset(fusion.clusters);
  const highestCluster = fusion.clusters.slice().sort((a, b) => b.confidenceScore - a.confidenceScore)[0];

  /* ── Build node list by traversing trust graph from entry ── */
  const visitedIds    = new Set<string>();
  const nodes: AttackPathOutput['nodes'] = [];
  const edges: AttackPathOutput['edges'] = [];

  // Map asset type → graph node type
  function assetToNodeType(type: string): 'host' | 'user' | 'service' | 'data' {
    if (type === 'database')         return 'data';
    if (type === 'domain_controller' || type === 'admin_console') return 'service';
    return 'host';
  }

  // Add entry node
  nodes.push({
    id:             entryAsset.id,
    label:          entryAsset.id,
    type:           assetToNodeType(entryAsset.type),
    criticality:    entryAsset.criticality as any,
    compromised:    true,
    mitreTechnique: pickTechnique(stages[0] ?? 'Initial Access').id,
    mitreStage:     stages[0] ?? 'Initial Access',
  });
  visitedIds.add(entryAsset.id);

  // BFS over trust graph up to depth 4
  const queue: { assetId: string; depth: number; stageIdx: number }[] = [
    { assetId: entryAsset.id, depth: 0, stageIdx: 0 },
  ];

  while (queue.length > 0) {
    const { assetId, depth, stageIdx } = queue.shift()!;
    if (depth >= 4) continue;

    const asset = NETWORK_TOPOLOGY.assets.find(a => a.id === assetId);
    if (!asset || !asset.trusts) continue;

    for (const targetId of asset.trusts) {
      if (visitedIds.has(targetId)) continue;
      const target = NETWORK_TOPOLOGY.assets.find(a => a.id === targetId);
      if (!target) continue;

      const nextStageIdx = Math.min(stageIdx + 1, stages.length - 1);
      const stage        = stages[nextStageIdx] ?? 'Lateral Movement';
      const tech         = pickTechnique(stage, depth);

      nodes.push({
        id:             target.id,
        label:          target.id,
        type:           assetToNodeType(target.type),
        criticality:    target.criticality as any,
        compromised:    depth < 2, // only first 2 hops are confirmed compromised
        mitreTechnique: tech.id,
        mitreStage:     tech.stage,
      });

      edges.push({
        from:      assetId,
        to:        target.id,
        label:     tech.name,
        technique: tech.name,
        mitreId:   tech.id,
        stage:     tech.stage,
      });

      visitedIds.add(target.id);
      queue.push({ assetId: target.id, depth: depth + 1, stageIdx: nextStageIdx });
    }
  }

  /* ── Derive high value targets reached ── */
  const highValueTargetsReached = nodes
    .filter(n => HIGH_VALUE.some(hv =>
      NETWORK_TOPOLOGY.assets.find(a => a.id === n.id && a.type === hv)
    ))
    .map(n => n.id);

  /* ── Dwell time: rough estimate from cluster timestamps ── */
  let estimatedDwellTimeMinutes = 20;
  if (fusion.clusters.length >= 2) {
    try {
      const times = fusion.clusters
  .flatMap(c => c.supportingEventIds ?? [])
  .map(id => {
    const match = id.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    return match ? new Date(match[0]).getTime() : null;
  })
  .filter((t): t is number => t !== null)
  .sort((a, b) => a - b);

      if (times.length >= 2) {
        estimatedDwellTimeMinutes = Math.round((times[times.length - 1] - times[0]) / 60000);
      }
    } catch {}
  }
  if (estimatedDwellTimeMinutes <= 0) estimatedDwellTimeMinutes = 20;

  return {
    nodes,
    edges,
    blastRadius:               nodes.length,
    highValueTargetsReached,
    attackStages:              stages,
    estimatedDwellTimeMinutes,
    computedLocally:           true,
  };
}

/* ─────────────────────────────────────────────────────────────
   FALLBACK — absolute last resort, minimal valid shape
───────────────────────────────────────────────────────────── */

function fallback(): AttackPathOutput {
  return {
    nodes: [{
      id: 'fallback-node', label: 'Initial Entry Point',
      type: 'host', criticality: 'low', compromised: true,
      mitreTechnique: 'T1078', mitreStage: 'Initial Access',
    }],
    edges:                       [],
    blastRadius:                 1,
    highValueTargetsReached:     [],
    attackStages:                ['Initial Access'],
    estimatedDwellTimeMinutes:   15,
    computedLocally:             true,
  };
}

/* ─────────────────────────────────────────────────────────────
   MAIN FLOW
───────────────────────────────────────────────────────────── */

export async function runAttackPath(
  fusion: SignalFusionOutput
): Promise<AttackPathOutput> {

  const prompt = `
You are Agent 2 (Attack Path Simulation).

STRICT RULES:
- Return ONLY raw JSON, no markdown, no explanation
- MUST include at least 1 node
- MUST include attackStages array
- All node ids must be strings
- All edge from/to values must reference existing node ids

CLUSTERS FROM SIGNAL FUSION:
${JSON.stringify(fusion.clusters, null, 2)}

NETWORK TOPOLOGY:
${JSON.stringify(NETWORK_TOPOLOGY, null, 2)}

Return this exact shape:
{
  "nodes": [
    {
      "id": "string",
      "label": "string",
      "type": "host" | "user" | "service" | "data",
      "criticality": "low" | "medium" | "high" | "critical",
      "compromised": boolean,
      "mitreTechnique": "T0000",
      "mitreStage": "string"
    }
  ],
  "edges": [
    {
      "from": "node-id",
      "to": "node-id",
      "label": "string",
      "technique": "string",
      "mitreId": "T0000",
      "stage": "string"
    }
  ],
  "blastRadius": number,
  "highValueTargetsReached": ["string"],
  "attackStages": ["string"],
  "estimatedDwellTimeMinutes": number
}
`;

  /* ── Attempt 1: LLM ── */
  try {
    const raw    = await runLocalLLM(prompt);
    const parsed = safeParse(raw);

    if (parsed && Array.isArray(parsed.nodes) && parsed.nodes.length > 0) {
      const normalized = normalizeOutput(parsed);
      const validated  = AttackPathOutputSchema.parse(normalized);
      return validated;
    }

    // LLM returned something but nodes were empty or missing
    console.info('[AttackPath] LLM output unusable — running local computation');
  } catch (err) {
    console.warn('[AttackPath] LLM call failed — running local computation', err);
  }

  /* ── Attempt 2: Local deterministic computation ── */
  try {
    const local     = computeAttackPathLocally(fusion);
    const validated = AttackPathOutputSchema.parse(local);
    return validated;
  } catch (err) {
    console.warn('[AttackPath] Local computation failed — using fallback', err);
  }

  /* ── Attempt 3: Absolute fallback ── */
  return fallback();
}