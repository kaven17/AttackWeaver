'use client';

import { ShieldHalf, Terminal, Wifi, Activity, Lock } from 'lucide-react';
import { FC, useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


// ── Typewriter ──────────────────────────────────────────────────────────────
const PHRASES = [
  'Reconstructing Attack Chains...',
  'Correlating 1.2M Alerts...',
  'Mapping Lateral Movement...',
  'Scoring Threat Vectors...',
  'Auditing Trust Identities...',
];

const Typewriter: FC = () => {
  const [phraseIdx, setPhraseIdx] = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const phrase = PHRASES[phraseIdx];
    let timeout: ReturnType<typeof setTimeout>;
    if (!deleting && displayed.length < phrase.length) {
      timeout = setTimeout(() => setDisplayed(phrase.slice(0, displayed.length + 1)), 55);
    } else if (!deleting && displayed.length === phrase.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 28);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setPhraseIdx((i) => (i + 1) % PHRASES.length);
    }
    return () => clearTimeout(timeout);
  }, [displayed, deleting, phraseIdx]);

  return (
    <div className="font-mono text-sm text-emerald-400/80 flex items-center gap-2 mt-3">
      <span className="text-emerald-500">$</span>
      <span>{displayed}</span>
      <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
    </div>
  );
};

// ── Scrolling Threat Feed ────────────────────────────────────────────────────
const THREAT_ITEMS = [
  { icon: <Terminal className="w-3 h-3" />, label: 'MITRE ATT&CK', value: 'T1059.001 — PowerShell' },
  { icon: <Wifi className="w-3 h-3" />, label: 'Lateral Move', value: '192.168.1.4 → DC-01' },
  { icon: <Activity className="w-3 h-3" />, label: 'Blast Radius', value: '14 assets at risk' },
  { icon: <Lock className="w-3 h-3" />, label: 'Trust Score', value: 'jsmith@corp — 12/100' },
  { icon: <ShieldHalf className="w-3 h-3" />, label: 'Stage', value: 'Lateral Movement' },
  { icon: <Terminal className="w-3 h-3" />, label: 'EDR Alert', value: 'Credential Dump Detected' },
  { icon: <Wifi className="w-3 h-3" />, label: 'Firewall', value: 'Outbound C2 — Blocked' },
  { icon: <Activity className="w-3 h-3" />, label: 'Confidence', value: 'Critical — 97%' },
];

const ThreatFeed: FC = () => {
  const trackRef = useRef<HTMLDivElement>(null);

  // Duplicate items for seamless loop
  const items = [...THREAT_ITEMS, ...THREAT_ITEMS];

  return (
    <div className="relative w-full overflow-hidden mt-10 border-y border-emerald-900/40">
      {/* fade edges */}
      <div className="absolute left-0 top-0 h-full w-20 z-10 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 h-full w-20 z-10 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none" />

      <div
        ref={trackRef}
        className="flex gap-4 py-3 w-max"
        style={{ animation: 'scrollX 28s linear infinite' }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-900/50 bg-emerald-950/30 backdrop-blur-sm whitespace-nowrap flex-shrink-0"
          >
            <span className="text-emerald-500">{item.icon}</span>
            <span className="text-emerald-600/70 font-mono text-xs">{item.label}:</span>
            <span className="text-emerald-300 font-mono text-xs">{item.value}</span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes scrollX {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

// ── Stats Bar ────────────────────────────────────────────────────────────────
const STATS = [
  { label: 'Alerts Processed', value: '2.4M' },
  { label: 'Incidents Correlated', value: '1,847' },
  { label: 'Avg Response Time', value: '4.2s' },
  { label: 'Threats Neutralised', value: '99.1%' },
];

const StatsBar: FC = () => (
  <div className="flex gap-6 overflow-x-auto pb-1 scroll-x mt-8 justify-center flex-wrap md:flex-nowrap">
    {STATS.map((s, i) => (
      <div key={i} className="flex-shrink-0 text-center px-5 py-3 rounded-lg border border-emerald-900/40 bg-black/30 backdrop-blur-sm">
        <div className="font-mono text-2xl font-bold text-emerald-400">{s.value}</div>
        <div className="text-xs text-emerald-700 mt-0.5 uppercase tracking-widest">{s.label}</div>
      </div>
    ))}
  </div>
);

// ── Agent Pills ──────────────────────────────────────────────────────────────
const AGENTS = [
  'Signal Fusion',
  'Attack Path',
  'Response Agent',
  'Trust Auditor',
];

const AgentPills: FC = () => (
  <div className="flex gap-2 overflow-x-auto scroll-x pb-1 mt-5 justify-center flex-wrap">
    {AGENTS.map((a, i) => (
      <div
        key={i}
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-800/50 bg-emerald-950/40 backdrop-blur-sm"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />
        <span className="font-mono text-xs text-emerald-400">{a}</span>
      </div>
    ))}
  </div>
);

// ── Hero ─────────────────────────────────────────────────────────────────────
export function Hero() {
  const scrollToDashboard = () => {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  };
  const router = useRouter(); // ✅ inside component

  return (
    <section className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden ">
      {/* 3D scene — always on top of solid bg, below everything else */}
      

      {/* Subtle scanline overlay — very low opacity so 3D shows through */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)',
        }}
      />

      {/* Vignette — edges only, centre clear */}
      <div
        className="absolute inset-0 pointer-events-none z-[1]"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Content — sits above scene */}
      <div className="relative z-10 flex flex-col items-center text-center px-4 w-full max-w-3xl mx-auto">

        {/* Badge */}
        <div className="mb-5 flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-800/60 bg-emerald-950/50 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest">Blue-Team Co-Pilot · Active</span>
        </div>

        {/* Shield icon */}
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-emerald-700/40 bg-emerald-950/60 backdrop-blur-sm shadow-[0_0_24px_rgba(52,211,153,0.15)]">
          <ShieldHalf className="h-7 w-7 text-emerald-400" />
        </div>

        {/* Title */}
        <h1
          className="font-mono text-5xl md:text-7xl font-bold tracking-tighter text-white"
          style={{ textShadow: '0 0 40px rgba(52,211,153,0.3), 0 0 80px rgba(52,211,153,0.1)' }}
        >
          Attack<span className="text-emerald-400">Weaver</span>
        </h1>

        {/* Typewriter */}
        <Typewriter />

        {/* Subtitle */}
        <p className="mt-5 max-w-xl text-sm md:text-base text-neutral-400 leading-relaxed font-mono">
          Multi-agent AI that reconstructs attack chains from raw telemetry —
          <span className="text-emerald-400/80"> signal fusion, path simulation, response ranking, trust auditing</span>
          {' '}in parallel.
        </p>

        {/* Agent pills */}
        <AgentPills />
        
        {/* CTA */}
        <div className="mt-8 flex gap-3">
  <button
    onClick={() => router.push('/ingest')}
    className="px-6 py-2.5 rounded-lg font-mono text-sm font-semibold bg-emerald-500 hover:bg-emerald-400 text-black transition-all duration-150 shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:shadow-[0_0_32px_rgba(52,211,153,0.55)]"
  >
    Upload Logs →
  </button>

  <button className="px-6 py-2.5 rounded-lg font-mono text-sm font-semibold border border-emerald-800/60 bg-black/30 text-emerald-400 hover:bg-emerald-950/60 backdrop-blur-sm transition-all duration-150">
    Scroll to Dashboard
  </button>
</div>
      </div>

      {/* Scrolling threat feed — pinned to bottom, z above scene */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <ThreatFeed />
      </div>

      {/* Scrollbar styles for horizontal scroll elements */}
      <style>{`
        .scroll-x::-webkit-scrollbar { height: 3px; }
        .scroll-x::-webkit-scrollbar-track { background: transparent; }
        .scroll-x::-webkit-scrollbar-thumb { background: #065f46; border-radius: 9999px; }
      `}</style>
    </section>
  );
}