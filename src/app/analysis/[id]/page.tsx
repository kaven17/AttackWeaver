'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Zap, Shield, AlertTriangle, CheckCircle,
  XCircle, Clock, ChevronRight, ExternalLink, Eye,
  Target, Cpu, Activity
} from 'lucide-react';
import { ProcessedThreat } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

/* ─────────────────────────────────────────────────────────────────────────────
   SEVERITY FIX
   ruleBasedSeverity is 1–10 → multiply × 10 = 10–100 (your ground truth).
   The pipeline can only raise this number, never lower it.
   This prevents the "ransomware shows 18/100" bug.
───────────────────────────────────────────────────────────────────────────── */
function computeSeverity(threat: ProcessedThreat | null, reconstruction: any): number {
  const ruleBase = Math.round((threat?.ruleBasedSeverity ?? 5) * 10);
  if (!reconstruction) return ruleBase;
  return Math.max(ruleBase, reconstruction.overallSeverity ?? 0);
}

const ACTION_SPANS = [
  'col-span-2 row-span-2',
  'col-span-1 row-span-2',
  'col-span-1 row-span-1',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
  'col-span-1 row-span-2',
  'col-span-2 row-span-1',
  'col-span-1 row-span-1',
];

const ACTION_ICONS: Record<string, string> = {
  isolate_host: '🔒', revoke_credentials: '🔑', block_ip: '🚫',
  quarantine_process: '☣️', force_mfa: '🛡️', snapshot_memory: '💾',
  notify_soc: '📡', escalate_incident: '🚨',
};

function mapSource(src?: string): 'siem' | 'edr' | 'firewall' | 'cloud' {
  if (!src) return 'siem';
  const s = src.toLowerCase();
  if (s.includes('edr')) return 'edr';
  if (s.includes('firewall')) return 'firewall';
  if (s.includes('cloud')) return 'cloud';
  return 'siem';
}

function mapSeverityLabel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 8) return 'critical';
  if (score >= 6) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

function SeverityRing({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 40 ? '#eab308' : '#10b981';
  const label = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW';

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#0d1f0d" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 10px ${color})` }}
        />
      </svg>
      <div className="flex flex-col items-center z-10">
        <span className="text-4xl font-black text-white leading-none" style={{ fontFamily: "'Space Mono',monospace" }}>{score}</span>
        <span className="text-[9px] tracking-[0.2em] mt-1 font-bold uppercase" style={{ color, fontFamily: "'Barlow Condensed',sans-serif" }}>{label}</span>
      </div>
    </div>
  );
}

function ScanLine() {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
      <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent animate-[scan_1.8s_ease-in-out_infinite]" />
    </div>
  );
}

function BentoCell({ className = '', children, glow = false, delay = 0 }: {
  className?: string; children: React.ReactNode; glow?: boolean; delay?: number;
}) {
  return (
    <div
      className={`relative rounded-2xl border border-emerald-900/50 bg-black/85 backdrop-blur-sm overflow-hidden
        transition-all duration-300 hover:border-emerald-600/40
        ${glow ? 'shadow-[0_0_32px_rgba(16,185,129,0.12)]' : ''} ${className}`}
      style={{ animation: 'fadeSlideIn 0.45s ease both', animationDelay: `${delay}ms` }}
    >
      <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl pointer-events-none" />
      <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl pointer-events-none" />
      <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl pointer-events-none" />
      <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl pointer-events-none" />
      {children}
    </div>
  );
}

function Chip({ children, variant = 'default' }: {
  children: React.ReactNode;
  variant?: 'default' | 'green' | 'red' | 'yellow' | 'blue';
}) {
  const cls = {
    default: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    green:   'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    red:     'bg-red-500/15 text-red-400 border-red-500/35',
    yellow:  'bg-yellow-500/15 text-yellow-400 border-yellow-500/35',
    blue:    'bg-blue-500/15 text-blue-400 border-blue-500/35',
  }[variant];
  return (
    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-[0.15em] uppercase border ${cls}`}
      style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
      {children}
    </span>
  );
}

function ScoreBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const display = invert ? 100 - value : value;
  const color = display >= 70 ? '#10b981' : display >= 40 ? '#eab308' : '#ef4444';
  return (
    <div className="space-y-1">
      <div className="flex justify-between" style={{ fontFamily: "'Space Mono',monospace" }}>
        <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{label}</span>
        <span className="text-[9px] text-white">{value}</span>
      </div>
      <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${display}%`, backgroundColor: color, boxShadow: `0 0 6px ${color}60` }} />
      </div>
    </div>
  );
}

function StatCell({ icon, value, label, color = 'text-white', delay = 0 }: {
  icon: React.ReactNode; value: string | number; label: string; color?: string; delay?: number;
}) {
  return (
    <BentoCell className="col-span-6 sm:col-span-3 md:col-span-2 p-5 flex flex-col items-center justify-center gap-2" delay={delay}>
      <div className={color}>{icon}</div>
      <div className="font-black text-3xl text-white leading-none" style={{ fontFamily: "'Space Mono',monospace" }}>{value}</div>
      <div className="text-[9px] text-zinc-600 uppercase tracking-[0.15em] text-center" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{label}</div>
    </BentoCell>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════════════════ */
export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>();
  const [threat, setThreat]                 = useState<ProcessedThreat | null>(null);
  const [reconstruction, setReconstruction] = useState<any>(null);
  const [loading, setLoading]               = useState(true);
  const [analyzing, setAnalyzing]           = useState(false);
  const [actionStates, setActionStates]     = useState<Record<string, 'pending' | 'approved' | 'dismissed'>>({});
  const { toast } = useToast();

  useEffect(() => {
    const raw = localStorage.getItem('processedThreats');
    if (!raw) { setLoading(false); return; }
    const threats: ProcessedThreat[] = JSON.parse(raw);
    setThreat(threats.find(t => t.id === id) ?? null);
    setLoading(false);
  }, [id]);

  async function handleAnalyze() {
    if (!threat || analyzing) return;
    setAnalyzing(true);
    try {
      const normalizedLog = {
        id: threat.id, timestamp: threat.timestamp,
        source: mapSource((threat as any).rawLog?.source),
        severity: mapSeverityLabel(threat.ruleBasedSeverity),
        eventType: threat.event.type, description: threat.event.details,
        sourceIp: threat.location?.ip, destinationIp: undefined,
        userId: threat.user?.id, hostname: threat.device?.id,
      };

      const res = await fetch('/api/orchestrator', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: [normalizedLog] }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // ── SEVERITY FIX: floor pipeline output at rule-based score ──────────
      const ruleBase = Math.round((threat.ruleBasedSeverity ?? 5) * 10);
      data.reconstruction.overallSeverity = Math.max(ruleBase, data.reconstruction.overallSeverity ?? 0);

      setReconstruction(data.reconstruction);
      const init: Record<string, 'pending'> = {};
      data.reconstruction.response?.actions?.forEach((a: any, i: number) => {
        const stableKey = (a.id && a.id !== 'string') ? a.id : `action-${i}-${a.type ?? i}`;
        init[stableKey] = 'pending';
      });
      setActionStates(init);
      toast({ title: '✓ Pipeline Complete', description: 'All 4 agents executed.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Pipeline Failed', description: String(err) });
    } finally {
      setAnalyzing(false);
    }
  }

  const severity = computeSeverity(threat, reconstruction);
  const actions  = reconstruction?.response?.actions ?? [];

  if (loading) return (
    <div className="min-h-screen bg-[#050a05] flex items-center justify-center">
      <span className="text-emerald-400 text-sm animate-pulse tracking-widest" style={{ fontFamily: "'Space Mono',monospace" }}>
        LOADING THREAT DATA...
      </span>
    </div>
  );

  if (!threat) return (
    <div className="min-h-screen bg-[#050a05] flex items-center justify-center text-red-400" style={{ fontFamily: "'Space Mono',monospace" }}>
      THREAT NOT FOUND
    </div>
  );

  const sevVariant: 'red' | 'yellow' | 'green' = severity >= 60 ? 'red' : severity >= 40 ? 'yellow' : 'green';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400&family=Barlow+Condensed:wght@300;400;600;700;900&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        html, body { background: #050a05 !important; }

        @keyframes scan {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.025; }
          50%     { opacity: 0.06;  }
        }
        @keyframes flicker {
          0%,89%,91%,93%,100% { opacity: 1; }
          90% { opacity: 0.3; }
          92% { opacity: 0.8; }
          94% { opacity: 0.5; }
        }
        @keyframes blink {
          0%,49% { opacity: 1; }
          50%,100% { opacity: 0; }
        }

        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          animation: gridPulse 5s ease-in-out infinite;
        }
        .flicker { animation: flicker 9s ease-in-out infinite; }
        .cursor::after { content:'█'; animation: blink 1s step-end infinite; color:#10b981; margin-left:2px; }
      `}</style>

      <div className="min-h-screen bg-[#050a05] relative">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
        <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-50" />

        <div className="relative z-10 max-w-[1680px] mx-auto px-5 py-7">

          {/* Nav */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Link href="/" className="flex items-center gap-2 text-zinc-600 hover:text-emerald-400 transition-colors text-[10px] tracking-[0.2em] uppercase" style={{ fontFamily: "'Space Mono',monospace" }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back to SOC
            </Link>
            <div className="text-[10px] tracking-[0.35em] text-emerald-600 uppercase flicker cursor" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
              AttackWeaver // Analysis Mode
            </div>
            <div className="text-[10px] text-zinc-700 tabular-nums" style={{ fontFamily: "'Space Mono',monospace" }}>
              {new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC
            </div>
          </div>

          {/* ── 12-col bento grid ──────────────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-4">

            {/* [A] Banner */}
            <BentoCell className="col-span-12 p-7" glow delay={0}>
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Chip variant={sevVariant}>{severity >= 80 ? 'CRITICAL' : severity >= 60 ? 'HIGH' : severity >= 40 ? 'MEDIUM' : 'LOW'}</Chip>
                    <Chip>THREAT DETECTED</Chip>
                    <Chip variant="blue">{threat.event.type}</Chip>
                  </div>
                  <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[0.9] uppercase break-words"
                    style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                    {threat.event.type.replace(/_/g, ' ')}
                  </h1>
                  <p className="text-zinc-500 mt-3 text-xs max-w-3xl leading-relaxed" style={{ fontFamily: "'Space Mono',monospace" }}>
                    {threat.riskExplanation}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col items-end gap-3">
                  {!reconstruction ? (
                    <button onClick={handleAnalyze} disabled={analyzing}
                      className="relative px-10 py-5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed
                        text-black font-black text-base tracking-[0.2em] uppercase rounded-xl overflow-hidden
                        transition-all duration-200 shadow-[0_0_40px_rgba(16,185,129,0.45)]
                        hover:shadow-[0_0_60px_rgba(16,185,129,0.65)] active:scale-95"
                      style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                      {analyzing && <ScanLine />}
                      <span className="flex items-center gap-2">
                        <Zap className="w-5 h-5" />
                        {analyzing ? 'RUNNING AGENTS...' : 'RUN PIPELINE'}
                      </span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm" style={{ fontFamily: "'Space Mono',monospace" }}>
                      <CheckCircle className="w-5 h-5" /> Pipeline Complete
                    </div>
                  )}
                  <div className="text-[9px] text-zinc-700 tracking-widest uppercase" style={{ fontFamily: "'Space Mono',monospace" }}>
                    ID: {threat.id.slice(0, 16)}…
                  </div>
                </div>
              </div>
            </BentoCell>

            {/* [B] Severity ring */}
            <BentoCell className="col-span-12 sm:col-span-6 md:col-span-3 p-6 flex flex-col items-center justify-center gap-3" delay={60}>
              <SeverityRing score={severity} />
              <div className="text-[9px] text-zinc-600 tracking-[0.18em] uppercase text-center" style={{ fontFamily: "'Space Mono',monospace" }}>
                Rule: {Math.round((threat.ruleBasedSeverity ?? 5) * 10)}
                {reconstruction && ` → Pipeline: ${reconstruction.overallSeverity}`}
              </div>
            </BentoCell>

            {/* [C] Metadata */}
            <BentoCell className="col-span-12 sm:col-span-6 md:col-span-4 p-6" delay={90}>
              <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>Event Metadata</div>
              <div className="space-y-3">
                {([
                  ['User',      threat.user?.id   || threat.user?.name || '—'],
                  ['Device',    threat.device?.id || '—'],
                  ['Source IP', threat.location?.ip      || '—'],
                  ['Country',   threat.location?.country || '—'],
                  ['Role',      (threat.user as any)?.role || '—'],
                  ['Time',      new Date(threat.timestamp).toLocaleString()],
                ] as [string, string][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-zinc-900/80 pb-2">
                    <span className="text-zinc-600 text-[10px]" style={{ fontFamily: "'Space Mono',monospace" }}>{k}</span>
                    <span className="text-white text-[10px] text-right" style={{ fontFamily: "'Space Mono',monospace" }}>{v}</span>
                  </div>
                ))}
              </div>
            </BentoCell>

            {/* [D] Raw log */}
            <BentoCell className="col-span-12 md:col-span-5 p-5" delay={120}>
              <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-3" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>Raw Log</div>
              <pre className="text-[9px] text-zinc-500 overflow-auto max-h-52 leading-relaxed" style={{ fontFamily: "'Space Mono',monospace" }}>
                {JSON.stringify((threat as any).rawLog, null, 2)}
              </pre>
            </BentoCell>

            {/* ──────── POST-PIPELINE ──────── */}
            {reconstruction && (<>

              {/* [E] Narrative */}
              <BentoCell className="col-span-12 p-7" glow delay={0}>
                <div className="flex items-start gap-5">
                  <div className="shrink-0 w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[9px] tracking-[0.25em] text-emerald-500 uppercase mb-2" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>AI Incident Narrative</div>
                    <p className="text-white text-base md:text-lg leading-relaxed font-light max-w-5xl" style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: '0.01em' }}>
                      {reconstruction.narrative}
                    </p>
                  </div>
                </div>
              </BentoCell>

              {/* [F] Attack stages */}
              <BentoCell className="col-span-12 sm:col-span-7 md:col-span-5 p-6" delay={40}>
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>Attack Progression</div>
                <div className="flex flex-wrap gap-2 items-center">
                  {reconstruction.attackPath?.attackStages?.map((s: string, i: number) => (
                    <div key={s} className="flex items-center gap-1.5">
                      <span className="inline-flex items-center px-2.5 py-1 rounded text-[9px] font-black tracking-[0.12em] uppercase bg-emerald-500/8 border border-emerald-500/20 text-emerald-300"
                        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                        {s}
                      </span>
                      {i < reconstruction.attackPath.attackStages.length - 1 && <ChevronRight className="w-3 h-3 text-emerald-900 shrink-0" />}
                    </div>
                  ))}
                </div>
              </BentoCell>

              {/* [G–J] Stats */}
              <StatCell icon={<Target className="w-6 h-6" />} value={reconstruction.attackPath?.blastRadius ?? '—'} label="Blast Radius" color="text-red-400" delay={60} />
              <StatCell icon={<Clock className="w-6 h-6" />} value={reconstruction.attackPath?.estimatedDwellTimeMinutes ?? '—'} label="Dwell (min)" color="text-yellow-400" delay={80} />
              <StatCell icon={<Shield className="w-6 h-6" />} value={`↓${reconstruction.trustAudit?.averageTrustDrop ?? '—'}`} label="Trust Drop" color="text-orange-400" delay={100} />
              <StatCell icon={<AlertTriangle className="w-6 h-6" />} value={reconstruction.attackPath?.highValueTargetsReached?.length ?? 0} label="HVT Reached" color="text-red-500" delay={120} />

              {/* [K] Trust scores */}
              <BentoCell className="col-span-12 md:col-span-4 p-6" delay={60}>
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>Identity Trust Scores</div>
                <div className="space-y-4">
                  {reconstruction.trustAudit?.entities?.map((e: any) => {
                    const tc = e.trustScore < 30 ? '#ef4444' : e.trustScore < 60 ? '#eab308' : '#10b981';
                    return (
                      <div key={e.entityId} className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="text-white text-xs truncate" style={{ fontFamily: "'Space Mono',monospace" }}>{e.displayName}</div>
                          <div className="text-zinc-600 text-[9px] mt-0.5 truncate" style={{ fontFamily: "'Space Mono',monospace" }}>{e.riskFlags?.join(' · ')}</div>
                        </div>
                        <div className="text-xl font-black shrink-0" style={{ color: tc, fontFamily: "'Space Mono',monospace", textShadow: `0 0 12px ${tc}60` }}>
                          {e.trustScore}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </BentoCell>

              {/* [L] MITRE timeline */}
              <BentoCell className="col-span-12 md:col-span-8 p-6 h-auto" delay={80}>
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>MITRE ATT&CK Timeline</div>
                <div className="relative pl-5 space-y-4 pr-1">
                  <div className="absolute left-1.5 top-0 bottom-0 w-px bg-emerald-900/80" />
                  {reconstruction.mitreTacticTimeline?.map((item: any, i: number) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-3.5 top-1 w-2.5 h-2.5 rounded-full border-2 border-black bg-emerald-500"
                        style={{ boxShadow: '0 0 8px rgba(16,185,129,0.7)' }} />
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black tracking-[0.1em] uppercase bg-emerald-500/8 border border-emerald-500/20 text-emerald-300 mr-2"
                            style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                            {item.stage}
                          </span>
                          <span className="text-zinc-400 text-[10px]" style={{ fontFamily: "'Space Mono',monospace" }}>{item.technique}</span>
                        </div>
                        <span className="text-zinc-700 text-[9px] shrink-0" style={{ fontFamily: "'Space Mono',monospace" }}>
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </BentoCell>

              {/* [M] Blockchain */}
              <BentoCell className="col-span-12 sm:col-span-6 md:col-span-4 p-6" delay={100}>
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>Blockchain Audit Trail</div>
                {reconstruction.audit?.txHash ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-[10px]" style={{ fontFamily: "'Space Mono',monospace" }}>Written to Sepolia</span>
                    </div>
                    <a href={reconstruction.audit.explorer} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 text-[10px] text-blue-400 hover:text-blue-300 break-all"
                      style={{ fontFamily: "'Space Mono',monospace" }}>
                      View on Etherscan <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    <div className="text-[9px] text-zinc-600 break-all" style={{ fontFamily: "'Space Mono',monospace" }}>
                      {reconstruction.auditHash?.slice(0, 24)}…
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-yellow-500 text-[10px]" style={{ fontFamily: "'Space Mono',monospace" }}>
                    <Clock className="w-4 h-4 animate-pulse" /> Pending blockchain write…
                  </div>
                )}
                <div className="mt-5 pt-4 border-t border-zinc-900">
                  <div className="text-[9px] text-zinc-700 break-all" style={{ fontFamily: "'Space Mono',monospace" }}>
                    ID: {reconstruction.reconstructionId}
                  </div>
                </div>
              </BentoCell>

              {/* [N] Agent timings */}
              <BentoCell className="col-span-12 sm:col-span-6 md:col-span-8 p-6" delay={120}>
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4 flex items-center gap-2" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                  <Activity className="w-3.5 h-3.5" /> Agent Performance
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    ['Signal Fusion', reconstruction.agentTimings?.signalFusion],
                    ['Attack Path',   reconstruction.agentTimings?.attackPath],
                    ['Response',      reconstruction.agentTimings?.response],
                    ['Trust Audit',   reconstruction.agentTimings?.trustAudit],
                  ].map(([name, ms]) => (
                    <div key={name as string} className="text-center">
                      <div className="text-2xl font-black text-emerald-400" style={{ fontFamily: "'Space Mono',monospace" }}>
                        {ms ?? '—'}<span className="text-xs text-emerald-800 ml-0.5">ms</span>
                      </div>
                      <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>{name as string}</div>
                    </div>
                  ))}
                </div>
              </BentoCell>

              {/* ══ [O] ACTIONS BENTO — full width asymmetric grid ══ */}
              <div className="col-span-12">
                <BentoCell className="p-6" delay={0}>
                  <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-emerald-400" />
                      <span className="text-xl font-black text-white tracking-[0.15em] uppercase" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                        Response Actions
                      </span>
                      <Chip variant="green">{actions.length} TOTAL</Chip>
                      <Chip variant="red">{actions.filter((a: any) => a.requiresHumanApproval).length} MANUAL</Chip>
                    </div>
                    <div className="flex gap-3 text-[10px]" style={{ fontFamily: "'Space Mono',monospace" }}>
                      <span className="text-emerald-400">{Object.values(actionStates).filter(s => s === 'approved').length} approved</span>
                      <span className="text-zinc-700">·</span>
                      <span className="text-zinc-600">{Object.values(actionStates).filter(s => s === 'dismissed').length} dismissed</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 auto-rows-[110px] gap-3">
                    {actions.map((action: any, i: number) => {
                      // Fix: AI sometimes returns literal "string" as id — use index-based stable key
                      const stableKey = `action-${i}-${action.type ?? i}`;
                      // Use stableKey as the actionStates key too if id is unreliable
                      const stateKey  = (action.id && action.id !== 'string') ? action.id : stableKey;

                      const span    = ACTION_SPANS[i % ACTION_SPANS.length];
                      const state   = actionStates[stateKey] ?? 'pending';
                      const isWide  = span.includes('col-span-2');
                      const isTall  = span.includes('row-span-2');
                      const isLarge = isWide || isTall;

                      const border = state === 'approved' ? 'border-emerald-500/50'
                        : state === 'dismissed' ? 'border-zinc-800/40'
                        : action.requiresHumanApproval ? 'border-yellow-900/50 hover:border-yellow-700/50'
                        : 'border-zinc-800/60 hover:border-emerald-800/60';

                      const bg = state === 'approved' ? 'bg-emerald-500/5'
                        : state === 'dismissed' ? 'bg-zinc-900/20 opacity-30 grayscale'
                        : 'bg-zinc-950/90';

                      const accent = state === 'approved' ? 'rgba(16,185,129,0.5)'
                        : action.requiresHumanApproval ? 'rgba(234,179,8,0.3)'
                        : 'rgba(16,185,129,0.1)';

                      return (
                        <div key={stableKey}
                          className={`relative rounded-xl border overflow-hidden transition-all duration-300 ${span} ${border} ${bg}`}>
                          <div className="absolute top-0 inset-x-0 h-px" style={{ background: accent }} />
                          <div className="p-4 h-full flex flex-col">
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <span className="text-xl leading-none select-none">{ACTION_ICONS[action.type] || '⚡'}</span>
                              <div className="flex gap-1 flex-wrap justify-end">
                                {action.autoExecutable       && <Chip variant="green">AUTO</Chip>}
                                {action.requiresHumanApproval && <Chip variant="yellow">MANUAL</Chip>}
                              </div>
                            </div>

                            <div className="font-black text-white leading-tight uppercase text-sm"
                              style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: '0.05em' }}>
                              {action.title}
                            </div>

                            {isLarge && (
                              <p className="text-zinc-600 text-[9px] mt-1.5 leading-relaxed line-clamp-2 flex-1"
                                style={{ fontFamily: "'Space Mono',monospace" }}>
                                {action.justification}
                              </p>
                            )}

                            {isTall && (
                              <div className="mt-2 space-y-1.5">
                                <ScoreBar label="Effectiveness" value={action.effectiveness} />
                                <ScoreBar label="Disruption"    value={action.businessDisruption} invert />
                                <ScoreBar label="Reversibility" value={action.reversibility} />
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-auto pt-2">
                              <div style={{ fontFamily: "'Space Mono',monospace" }}>
                                <span className="text-zinc-700 text-[9px]">Score </span>
                                <span className="text-emerald-400 font-bold text-xs">{action.compositeScore}</span>
                              </div>

                              {state === 'pending' && (
                                <div className="flex gap-1">
                                  <button onClick={() => setActionStates(s => ({ ...s, [stateKey]: 'approved' }))}
                                    className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/30 flex items-center justify-center transition-colors">
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  </button>
                                  <button onClick={() => setActionStates(s => ({ ...s, [stateKey]: 'dismissed' }))}
                                    className="w-7 h-7 rounded-lg bg-zinc-800/80 border border-zinc-700/60 hover:bg-zinc-700 flex items-center justify-center transition-colors">
                                    <XCircle className="w-3.5 h-3.5 text-zinc-500" />
                                  </button>
                                </div>
                              )}
                              {state === 'approved'  && <div className="flex items-center gap-1 text-emerald-400"><CheckCircle className="w-3.5 h-3.5" /><span className="text-[9px]" style={{ fontFamily: "'Space Mono',monospace" }}>done</span></div>}
                              {state === 'dismissed' && <XCircle className="w-3.5 h-3.5 text-zinc-700" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </BentoCell>
              </div>

            </>)}
          </div>

          <div className="text-center text-[9px] text-zinc-800 tracking-[0.25em] uppercase mt-8 pb-2"
            style={{ fontFamily: "'Space Mono',monospace" }}>
            AttackWeaver v2 · 4-Agent SOC Pipeline · MITRE ATT&CK · Blockchain Audit
          </div>
        </div>
      </div>
    </>
  );
}