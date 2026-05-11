'use client';

import { useState, useMemo, useEffect } from 'react';
import type { ProcessedThreat } from '@/lib/types';
import { ThreatList } from './threat-list';
import { ThreatDetailsSheet } from './threat-details-sheet';
import { Button } from '../ui/button';
import {
  UploadCloud, ShieldAlert, Activity, AlertTriangle,
  CheckCircle2, Zap, Eye, Radio, TrendingUp, Lock, Cpu, Shield
} from 'lucide-react';
import Link from 'next/link';

const E = '#34d399';

/* ── Pulse Dot ─────────────────────────────────── */
function PulseDot({ dim = false }: { dim?: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
        style={{ backgroundColor: dim ? 'rgba(52,211,153,0.4)' : E }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ backgroundColor: dim ? 'rgba(52,211,153,0.4)' : E }} />
    </span>
  );
}

/* ── Glow Number ───────────────────────────────── */
function GlowNum({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`font-black tabular-nums font-mono leading-none ${className}`}
      style={{ color: E, textShadow: `0 0 20px ${E}aa, 0 0 40px ${E}44` }}>
      {n}
    </span>
  );
}

/* ── Sparkbar ──────────────────────────────────── */
function Sparkbar({ threats }: { threats: ProcessedThreat[] }) {
  const bars = threats.slice(0, 24);
  const max = Math.max(...bars.map(t => t.riskScore ?? 0), 1);
  return (
    <div className="flex items-end gap-[2px] w-full h-full">
      {bars.map((t) => {
        const score = t.riskScore ?? 0;
        const h = Math.max(5, (score / max) * 100);
        const op = score >= 70 ? 1 : score >= 40 ? 0.6 : 0.28;
        return (
          <div key={t.id} className="flex-1 rounded-sm"
            style={{ height: `${h}%`, backgroundColor: E, opacity: op, boxShadow: op > 0.8 ? `0 0 6px ${E}80` : 'none' }} />
        );
      })}
    </div>
  );
}

/* ── Donut Ring ────────────────────────────────── */
function DonutRing({ high, medium, low, total }: { high: number; medium: number; low: number; total: number }) {
  const r = 38, circ = 2 * Math.PI * r;
  const hp = total > 0 ? high / total : 0;
  const mp = total > 0 ? medium / total : 0;
  const lp = Math.max(0, 1 - hp - mp);
  return (
    <div className="relative flex items-center justify-center w-[88px] h-[88px] shrink-0">
      <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90 absolute">
        <circle cx="44" cy="44" r={r} fill="none" stroke="#ffffff06" strokeWidth="11" />
        <circle cx="44" cy="44" r={r} fill="none" stroke={E} strokeWidth="11"
          strokeDasharray={`${circ * lp} ${circ}`} strokeDashoffset={0}
          style={{ filter: `drop-shadow(0 0 4px ${E})` }} />
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="11"
          strokeDasharray={`${circ * mp} ${circ}`} strokeDashoffset={-(circ * lp)} />
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth="11"
          strokeDasharray={`${circ * hp} ${circ}`} strokeDashoffset={-(circ * (lp + mp))}
          style={{ filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.5))' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-white/35 text-[8px] tracking-widest uppercase">total</span>
        <span className="font-black font-mono text-lg text-white leading-none">{total}</span>
      </div>
    </div>
  );
}

/* ── Cell ──────────────────────────────────────── */
function Cell({ children, style, className = '', accent = false }:
  { children: React.ReactNode; style?: React.CSSProperties; className?: string; accent?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 ${className}
        ${accent
          ? 'border-transparent'
          : 'bg-[#0f0f0f] border-white/[0.06] hover:border-[#34d399]/30 hover:shadow-[0_0_28px_rgba(52,211,153,0.09)]'
        }`}
      style={accent ? { backgroundColor: E, boxShadow: `0 0 48px ${E}44`, ...style } : style}
    >
      {!accent && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.018]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 4px)' }} />
      )}
      {children}
    </div>
  );
}

/* ── Horizontal scroll card ────────────────────── */
function ScrollCard({ threat }: { threat: ProcessedThreat }) {
  const score = threat.riskScore ?? 0;
  const tier = score >= 70 ? 'CRIT' : score >= 40 ? 'MED' : 'LOW';
  const tierColor = score >= 70 ? 'rgba(255,255,255,0.9)' : score >= 40 ? 'rgba(255,255,255,0.5)' : E;
  return (
    <div className="shrink-0 w-[180px] bg-[#0f0f0f] border border-white/[0.06] rounded-xl p-3.5 flex flex-col gap-2
      hover:border-[#34d399]/40 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)] transition-all duration-200 cursor-pointer">
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-widest uppercase font-mono" style={{ color: tierColor }}>{tier}</span>
        <span className="font-mono font-black text-lg" style={{ color: E }}>{score}</span>
      </div>
      <p className="text-white/70 text-xs font-mono truncate">{(threat as any).name ?? (threat as any).type ?? 'Event'}</p>
      <p className="text-white/25 text-[10px] font-mono truncate">{(threat as any).sourceIp ?? '—'}</p>
      <div className="w-full bg-white/5 rounded-full h-0.5 mt-auto">
        <div className="h-0.5 rounded-full" style={{ width: `${score}%`, backgroundColor: E }} />
      </div>
    </div>
  );
}

/* ── Empty State ───────────────────────────────── */
function EmptyState() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-8">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');`}</style>
      <div className="text-center max-w-sm" style={{ fontFamily: '"Space Mono", monospace' }}>
        <UploadCloud className="w-16 h-16 mx-auto mb-5" style={{ color: E, filter: `drop-shadow(0 0 14px ${E}80)` }} />
        <h2 className="text-4xl font-black text-white mb-3"
          style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.1em' }}>NO EVENTS</h2>
        <p className="text-white/30 text-sm mb-7 leading-relaxed">Threat feed is empty. Ingest logs to begin.</p>
        <Button asChild className="font-mono font-bold tracking-widest text-black"
          style={{ backgroundColor: E, boxShadow: `0 0 24px ${E}55` }}>
          <Link href="/ingest"><UploadCloud className="w-4 h-4 mr-2" />INGEST LOGS</Link>
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════════════ */
export function DashboardPage() {
  const [threats, setThreats]     = useState<ProcessedThreat[]>([]);
  const [selectedId, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('processedThreats');
    if (stored) {
      const parsed: ProcessedThreat[] = JSON.parse(stored);
      setThreats(
        parsed
          .map(t => ({ ...t, riskScore: t.riskScore ?? t.ruleBasedSeverity * 10 }))
          .sort((a, b) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
      );
    }
  }, []);

  const selectedThreat  = useMemo(() => threats.find(t => t.id === selectedId) || null, [threats, selectedId]);
  const highRiskCount   = threats.filter(t => (t.riskScore ?? 0) >= 70).length;
  const mediumRiskCount = threats.filter(t => (t.riskScore ?? 0) >= 40 && (t.riskScore ?? 0) < 70).length;
  const lowRiskCount    = threats.filter(t => (t.riskScore ?? 0) < 40).length;
  const critPct         = threats.length > 0 ? Math.round((highRiskCount / threats.length) * 100) : 0;

  if (threats.length === 0) return <EmptyState />;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Bebas+Neue&display=swap');
        .dash { font-family: "Space Mono", monospace; }
        .lbl  { font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.3); }
        .lbl-k{ font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:rgba(0,0,0,.45); }
        /* hide scrollbar but keep scroll */
        .hscroll::-webkit-scrollbar { display:none; }
        .hscroll { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>

      <div className="dash h-screen  bg-transparent px-4 py-6 md:px-8 md:py-10">

        {/* ── Header ──────────────────────────────── */}
        <div className="flex items-center justify-between mb-7">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-7 h-7 shrink-0" style={{ color: E, filter: `drop-shadow(0 0 8px ${E})` }} />
            <div>
              <h1 className="text-2xl md:text-4xl font-black text-white tracking-widest"
                style={{ fontFamily: '"Bebas Neue", sans-serif', letterSpacing: '0.13em' }}>
                SOC ANALYST DASHBOARD
              </h1>
              <p className="text-white/20 text-[10px] tracking-widest uppercase mt-0.5">
                Threat Intelligence Center · Real-time Monitoring
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/30 font-mono">
            <PulseDot /><span style={{ color: E }}>LIVE</span>
            <span className="text-white/15 px-1">|</span>
            <span>{new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            BENTO GRID — explicit grid-template-areas
            12 equal columns, no gaps left behind
        ═════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gap: '12px',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'auto',
          gridTemplateAreas: `
            "tot  tot  tot  tot  crit crit crit crit med  med  low  low"
            "tot  tot  tot  tot  spk  spk  spk  spk  spk  dist dist dist"
            "sys  sys  sys  sys  top  top  top  top  shld shld shld shld"
            "feed feed feed feed feed feed feed feed feed feed feed feed"
          `
        }}>

          {/* ① TOTAL — accent hero, row-span 2 */}
          <Cell accent style={{ gridArea: 'tot' }} className="p-6 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-start justify-between">
              <span className="lbl-k">Total Events</span>
              <Activity className="w-5 h-5 text-black/30" />
            </div>
            <div>
              <div className="font-black tabular-nums font-mono text-7xl md:text-8xl text-black leading-none"
                style={{ textShadow: '0 3px 0 rgba(0,0,0,0.12)' }}>
                {threats.length}
              </div>
              <p className="text-black/45 text-xs mt-2">logs ingested &amp; scored</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-black/35" />
              <span className="lbl-k">feed active</span>
            </div>
          </Cell>

          {/* ② CRITICAL */}
          <Cell style={{ gridArea: 'crit' }} className="p-5 flex flex-col justify-between min-h-[96px]">
            <div className="flex items-center justify-between">
              <span className="lbl">Critical Logs</span>
              <AlertTriangle className="w-4 h-4 text-white/15" />
            </div>
            <GlowNum n={highRiskCount} className="text-5xl md:text-6xl" />
            <div>
              <div className="w-full bg-white/5 rounded-full h-[3px] mt-2">
                <div className="h-[3px] rounded-full transition-all duration-700"
                  style={{ width: `${critPct}%`, backgroundColor: E, boxShadow: `0 0 6px ${E}` }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-white/25 text-[10px]">{critPct}% of feed</span>
                <div className="flex items-center gap-1"><PulseDot /><span className="text-[10px]" style={{ color: E }}>ALERT</span></div>
              </div>
            </div>
          </Cell>

          {/* ③ MEDIUM */}
          <Cell style={{ gridArea: 'med' }} className="p-5 flex flex-col justify-between min-h-[96px]">
            <span className="lbl">Medium Risk</span>
            <GlowNum n={mediumRiskCount} className="text-4xl" />
            <span className="text-white/20 text-[10px]">score 40–69</span>
          </Cell>

          {/* ④ LOW */}
          <Cell style={{ gridArea: 'low' }} className="p-5 flex flex-col justify-between min-h-[96px]">
            <span className="lbl">Low / Clear</span>
            <div className="flex items-end gap-2">
              <span className="font-black font-mono text-4xl text-white/40">{lowRiskCount}</span>
              <CheckCircle2 className="w-4 h-4 text-white/15 mb-1.5" />
            </div>
            <span className="text-white/20 text-[10px]">score &lt; 40</span>
          </Cell>

          {/* ⑤ SPARKBAR */}
          <Cell style={{ gridArea: 'spk' }} className="p-5 flex flex-col min-h-[130px]">
            <div className="flex items-center justify-between mb-3">
              <span className="lbl">Risk Score Histogram</span>
              <TrendingUp className="w-4 h-4 text-white/15" />
            </div>
            <div className="flex-1 min-h-[70px]">
              <Sparkbar threats={threats} />
            </div>
            <p className="text-white/20 text-[10px] mt-2">
              Top {Math.min(24, threats.length)} events · desc
            </p>
          </Cell>

          {/* ⑥ DISTRIBUTION DONUT */}
          <Cell style={{ gridArea: 'dist' }} className="p-5 flex flex-col min-h-[130px]">
            <span className="lbl mb-3">Distribution</span>
            <div className="flex items-center gap-4 flex-1">
              <DonutRing high={highRiskCount} medium={mediumRiskCount} low={lowRiskCount} total={threats.length} />
              <div className="flex flex-col gap-2 text-[10px] flex-1">
                {[
                  { label: 'Critical', val: highRiskCount, color: 'rgba(255,255,255,0.88)' },
                  { label: 'Medium',   val: mediumRiskCount, color: 'rgba(255,255,255,0.45)' },
                  { label: 'Low',      val: lowRiskCount, color: E },
                ].map(({ label, val, color }) => (
                  <div key={label} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-white/35">{label}</span>
                    </div>
                    <span className="font-bold" style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </Cell>

          {/* ⑦ SYSTEM STATUS */}
          <Cell style={{ gridArea: 'sys' }} className="p-5 flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-3.5 h-3.5 text-white/20" />
              <span className="lbl">System Status</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                { label: 'Threat Engine', ok: true },
                { label: 'AI Scoring',    ok: true },
                { label: 'Log Ingestion', ok: true },
                { label: 'Alert Queue',   ok: highRiskCount > 0 },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between border-b border-white/[0.04] pb-2 last:border-0 last:pb-0">
                  <span className="text-white/30 text-[10px]">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold" style={{ color: ok ? E : 'rgba(255,255,255,0.4)' }}>
                      {ok ? 'ONLINE' : 'IDLE'}
                    </span>
                    {ok && <PulseDot />}
                  </div>
                </div>
              ))}
            </div>
          </Cell>

          {/* ⑧ TOP THREAT */}
          <Cell style={{ gridArea: 'top' }} className="p-5 flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center justify-between">
              <span className="lbl">Highest Threat</span>
              <Zap className="w-4 h-4 text-white/15" />
            </div>
            {threats[0] ? (
              <>
                <div className="mt-2">
                  <p className="text-white font-bold text-sm truncate">{(threats[0] as any).name ?? (threats[0] as any).type ?? 'Unknown'}</p>
                  <p className="text-white/30 text-xs truncate mt-0.5">{(threats[0] as any).sourceIp ?? 'src unknown'}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-white/20 text-[10px] uppercase tracking-widest">risk score</span>
                  <span className="font-mono font-black text-2xl" style={{ color: E, textShadow: `0 0 14px ${E}` }}>
                    {threats[0].riskScore ?? '—'}
                  </span>
                </div>
              </>
            ) : <span className="text-white/20 text-xs">No data</span>}
          </Cell>

          {/* ⑨ SHIELD — accent small */}
          <Cell accent style={{ gridArea: 'shld' }} className="p-5 flex flex-col justify-between min-h-[110px]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-black/40" />
              <span className="lbl-k">Analyzed</span>
            </div>
            <div className="font-black font-mono text-4xl text-black">{threats.length}</div>
            <div className="flex items-center justify-between">
              <span className="lbl-k">total events</span>
              <Cpu className="w-4 h-4 text-black/25" />
            </div>
          </Cell>

          {/* ⑩ FULL-WIDTH THREAT FEED */}
          <Cell style={{ gridArea: 'feed' }} className="p-5 flex flex-col min-h-[440px] w-full">
            <div className="flex items-center gap-2 mb-5">
              <Eye className="w-4 h-4 text-white/20" />
              <span className="lbl">Threat Event Feed</span>
              <div className="flex-1" />
              <PulseDot /><span className="text-[10px] tracking-widest font-mono" style={{ color: E }}>{threats.length} EVENTS</span>
            </div>
            <div className="flex-1 overflow-hidden">
  <div className="w-full h-full overflow-x-auto overflow-y-hidden hscroll">
    <div className="inline-block min-w-max">
      <ThreatList
        threats={threats}
        onSelectThreat={(t) => setSelected(t.id)}
        selectedThreatId={selectedId}
      />
    </div>
  </div>
</div>
          </Cell>

        </div>{/* end bento */}

        {/* ══════════════════════════════════════════
            HORIZONTAL SCROLL STRIP
        ═════════════════════════════════════════ */}
        

      </div>

      <ThreatDetailsSheet
        threat={selectedThreat}
        open={!!selectedThreat}
        onOpenChange={(open) => { if (!open) setSelected(null); }}
      />
    </>
  );
}