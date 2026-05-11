import { NextRequest, NextResponse } from 'next/server';

import { runSignalFusion } from '@/ai/flows/signalFusionflow';
import { runAttackPath } from '@/ai/flows/attackPathFlow';
import { runResponseAgent } from '@/ai/flows/ResponseFlow';
import { runTrustAudit } from '@/ai/flows/trustAuditFlow';
import { generateNarrative } from '@/ai/flows/narrativeFlow';
import { writeAudit } from '@/lib/audit';

/* ====================================================== */

function generateId(): string {
  return `recon-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function detectScenarioType(stages: string[], summaries: string): string {
  const all = (stages.join(' ') + summaries).toLowerCase();

  if (all.includes('impact') || all.includes('encrypt') || all.includes('ransomware')) return 'ransomware';
  if (all.includes('credential') || all.includes('brute') || all.includes('stuffing')) return 'credential_stuffing';
  if (all.includes('exfil') || all.includes('off-hours') || all.includes('insider')) return 'insider_threat';

  return 'unknown';
}

/* ====================================================== */

export async function POST(req: NextRequest) {
  const overallStart = Date.now();

  try {
    const { logs } = await req.json();

    if (!logs?.length) {
      return NextResponse.json(
        { success: false, error: 'No logs provided' },
        { status: 400 }
      );
    }

    /* ======================================================
       STEP 1 — PARALLEL
    ====================================================== */
    const t1 = Date.now();

    const [fusion, trust] = await Promise.all([
      runSignalFusion({ logs }),
      runTrustAudit(logs),
    ]);

    const parallelTime = Date.now() - t1;

    /* ======================================================
       STEP 2 — ATTACK PATH
    ====================================================== */
    const t2 = Date.now();
    const path = await runAttackPath(fusion);
    const pathTime = Date.now() - t2;

    /* ======================================================
       STEP 3 — RESPONSE
    ====================================================== */
    const t3 = Date.now();
    const response = await runResponseAgent(fusion, path);
    const responseTime = Date.now() - t3;

    /* ======================================================
       STEP 4 — NARRATIVE
    ====================================================== */
    const t4 = Date.now();
    const narrative = await generateNarrative(fusion, path, response, trust);
    const reconTime = Date.now() - t4;

    /* ======================================================
       MITRE TIMELINE
    ====================================================== */
    const seen = new Set<string>();

    const mitreTacticTimeline = path.edges
      .filter((e: any) => {
        const key = `${e.stage}-${e.mitreId}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((e: any) => ({
        stage: e.stage,
        timestamp: new Date(Date.now() - Math.random() * 3_600_000).toISOString(),
        technique: `${e.mitreId}: ${e.technique}`,
      }));

    /* ======================================================
       SEVERITY
    ====================================================== */
    const overallSeverity = Math.min(
      100,
      Math.round(
        path.blastRadius * 0.4 +
        response.overallSeverity * 0.4 +
        Math.min(trust.averageTrustDrop, 100) * 0.2
      )
    );

    /* ======================================================
       RECONSTRUCTION
    ====================================================== */
    const reconstruction: any = {
      reconstructionId: generateId(),
      timestamp: new Date().toISOString(),
      scenarioType: detectScenarioType(
        path.attackStages,
        fusion.clusters.map((c: any) => c.summary).join(' ')
      ),
      overallSeverity,
      narrative,
      signalFusion: fusion,
      attackPath: path,
      response,
      trustAudit: trust,
      mitreTacticTimeline,
    };

    /* ======================================================
       BLOCKCHAIN AUDIT (DIRECT — FIXED)
    ====================================================== */
    try {
      const audit = await writeAudit(reconstruction);

      reconstruction.audit = {
        hash: audit.hash,
        txHash: audit.txHash,
        explorer: audit.explorer,
      };

      console.log('[audit] tx:', audit.txHash);
    } catch (e) {
      console.warn('[audit] failed:', e);

      reconstruction.audit = {
        hash: null,
        txHash: null,
        explorer: null,
      };
    }

    /* ======================================================
       RESPONSE
    ====================================================== */

    return NextResponse.json({
      success: true,
      reconstruction,
      agentTimings: {
        signalFusion: parallelTime,
        trustAudit: parallelTime,
        attackPath: pathTime,
        response: responseTime,
        reconstruction: reconTime,
        total: Date.now() - overallStart,
      },
    });

  } catch (err) {
    console.error('[orchestrator]', err);

    return NextResponse.json(
      { success: false, error: String(err) },
      { status: 500 }
    );
  }
}