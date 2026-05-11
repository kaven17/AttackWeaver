'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { RawLog, ProcessedThreat, EnrichedEvent, UserBehaviorBaseline } from '@/lib/types';
import { faker } from '@faker-js/faker';
import {
  UploadCloud, FileJson, CheckCircle, ArrowRight,
  Terminal, Shield, Zap, X, AlertTriangle
} from 'lucide-react';

/* ─── Baseline helpers (unchanged logic) ────────────────────────────────── */
const userBaselines: Record<string, UserBehaviorBaseline> = {};

function getOrCreateBaseline(userId: string): UserBehaviorBaseline {
  if (!userBaselines[userId]) {
    userBaselines[userId] = {
      loginTime: { normalRange: [faker.number.int({ min: 7, max: 9 }), faker.number.int({ min: 17, max: 19 })] },
      resourceAccess: { typicalOrder: ['/dashboard', '/reports', '/settings'] },
      apiCallFrequency: { mean: faker.number.int({ min: 10, max: 50 }), stdDev: faker.number.int({ min: 2, max: 8 }) },
    };
  }
  return userBaselines[userId];
}

function parseAndEnrich(log: RawLog): EnrichedEvent {
  const id = faker.string.uuid();
  let eventType: EnrichedEvent['event']['type'] = 'Unknown';
  let severity = 1;
  let userRole = 'User';
  let riskExplanation = 'Standard operational event.';

  const ipMatch = log.message.match(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
  const ip = ipMatch ? ipMatch[0] : faker.internet.ip();
  const isNovelDevice   = Math.random() < 0.1;
  const isNovelLocation = Math.random() < 0.1;
  let contextualScore = (isNovelDevice ? 1 : 0) + (isNovelLocation ? 2 : 0);

  if (log.event.includes('LOGIN_SUCCESS')) {
    eventType = 'Login Attempt'; severity = 1 + contextualScore;
    riskExplanation = 'A user successfully logged in.' + (contextualScore > 0 ? ' From a new device or location.' : '');
  } else if (log.event.includes('LOGIN_FAILED')) {
    eventType = 'Login Attempt'; severity = 4 + contextualScore;
    riskExplanation = 'A failed login attempt.';
  } else if (log.event.includes('FILE_ACCESS')) {
    eventType = 'Resource Access'; severity = 3;
    riskExplanation = `Accessed resource: ${log.message.split(' ').pop()}`;
  } else if (log.event.includes('API_CALL')) {
    eventType = 'API Call'; severity = 2;
    riskExplanation = `API call by user ${log.user}.`;
  } else if (log.event.includes('PRIVILEGE_ESCALATION')) {
    eventType = 'Privilege Escalation'; severity = 9;
    userRole = faker.helpers.arrayElement(['Admin', 'Developer']);
    riskExplanation = 'Attempted privilege escalation.';
  } else if (log.event.includes('NETWORK_CONNECTION')) {
    eventType = 'Network Connection'; severity = 2;
    riskExplanation = 'Network connection established.';
  }

  const userId = log.user || 'system';
  return {
    id, rawLog: log, timestamp: log.timestamp,
    user: { id: userId, name: userId, role: userRole },
    device: { id: log.host, isNovel: isNovelDevice },
    location: { ip, country: faker.location.country(), isNovel: isNovelLocation },
    event: { type: eventType, details: log.message },
    ruleBasedSeverity: severity, riskExplanation,
    behavioralBaseline: getOrCreateBaseline(userId),
  };
}

/* ─── Preview line component ─────────────────────────────────────────────── */
function LogPreviewLine({ line, index }: { line: string; index: number }) {
  let parsed: any = null;
  try { parsed = JSON.parse(line); } catch {}

  const eventType = parsed?.event ?? '—';
  const user      = parsed?.user  ?? '—';
  const ts        = parsed?.timestamp ? new Date(parsed.timestamp).toLocaleTimeString() : '—';
  const isHigh    = parsed?.event?.includes('PRIVILEGE') || parsed?.event?.includes('FAILED');

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-zinc-900 hover:border-emerald-900/50 transition-colors"
      style={{ animation: `fadeSlideIn 0.3s ease both`, animationDelay: `${index * 40}ms` }}
    >
      <span className="text-zinc-700 text-[9px] w-5 text-right shrink-0" style={{ fontFamily: "'Space Mono',monospace" }}>
        {index + 1}
      </span>
      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isHigh ? 'bg-red-500' : 'bg-emerald-500'}`}
        style={{ boxShadow: isHigh ? '0 0 6px #ef4444' : '0 0 6px #10b981' }} />
      <span className="text-emerald-300 text-[10px] font-bold truncate w-40 shrink-0"
        style={{ fontFamily: "'Barlow Condensed',sans-serif", letterSpacing: '0.08em' }}>
        {eventType}
      </span>
      <span className="text-zinc-500 text-[10px] truncate flex-1" style={{ fontFamily: "'Space Mono',monospace" }}>
        {user}
      </span>
      <span className="text-zinc-700 text-[9px] shrink-0" style={{ fontFamily: "'Space Mono',monospace" }}>
        {ts}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export function IngestPage() {
  const [logs, setLogs]             = useState('');
  const [fileName, setFileName]     = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [lineCount, setLineCount]   = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router  = useRouter();
  const { toast } = useToast();

  /* ── File load ─────────────────────────────────────────────────────────── */
  function loadFile(file: File) {
    if (!file.name.endsWith('.jsonl') && !file.name.endsWith('.json')) {
      setParseError('Only .jsonl files are supported');
      return;
    }
    setFileName(file.name);
    setParseError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setLogs(text);
      const lines = text.trim().split('\n').filter(Boolean);
      setLineCount(lines.length);
    };
    reader.readAsText(file);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  /* ── Drag & drop ───────────────────────────────────────────────────────── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  }, []);

  /* ── Process ───────────────────────────────────────────────────────────── */
  function handleProcess() {
    if (!logs) return;
    setIsProcessing(true);
    setParseError(null);

    try {
      const lines = logs.trim().split('\n');
      const parsedLogs: RawLog[] = lines
        .map(line => { try { return JSON.parse(line); } catch { return null; } })
        .filter((l): l is RawLog => l !== null);

      if (parsedLogs.length === 0) {
        setParseError('No valid JSON lines found in file');
        setIsProcessing(false);
        return;
      }

      const enriched: EnrichedEvent[] = parsedLogs.map(parseAndEnrich);
      const threats: ProcessedThreat[] = enriched.map(ev => ({
        id: ev.id, timestamp: ev.timestamp, rawLog: ev.rawLog,
        user: ev.user, device: ev.device, location: ev.location,
        event: ev.event, ruleBasedSeverity: ev.ruleBasedSeverity,
        riskExplanation: ev.riskExplanation, behavioralBaseline: ev.behavioralBaseline,
        riskScore: ev.ruleBasedSeverity * 10,
        detailedExplanation: null, behavioralAnomalyScore: null,
        behavioralExplanation: null, riskBreakdown: null, isAnalyzed: false,
      }));

      localStorage.setItem('processedThreats', JSON.stringify(threats));
      toast({ title: '✓ Ingestion Complete', description: `${threats.length} events processed and ready.` });
      router.push('/');
    } catch (err) {
      console.error(err);
      setParseError('Failed to parse file. Ensure each line is valid JSON.');
      setIsProcessing(false);
    }
  }

  /* ── Preview lines ─────────────────────────────────────────────────────── */
  const previewLines = logs
    ? logs.trim().split('\n').filter(Boolean).slice(0, 8)
    : [];

  const hasFile = !!logs && !!fileName;

  /* ── Severity distribution preview ────────────────────────────────────── */
  const severityCounts = (() => {
    if (!logs) return null;
    let critical = 0, high = 0, medium = 0, low = 0;
    logs.trim().split('\n').forEach(line => {
      try {
        const p = JSON.parse(line);
        const e = p.event ?? '';
        if (e.includes('PRIVILEGE')) critical++;
        else if (e.includes('FAILED')) high++;
        else if (e.includes('FILE_ACCESS')) medium++;
        else low++;
      } catch {}
    });
    return { critical, high, medium, low };
  })();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@300;400;600;700;900&display=swap');
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes gridPulse {
          0%,100% { opacity: 0.025; }
          50%     { opacity: 0.055; }
        }
        @keyframes scanDown {
          0%   { top: 0%;   opacity: 0; }
          5%   { opacity: 1; }
          95%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes pulseGlow {
          0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
          50%     { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); }
        }
        @keyframes flicker {
          0%,89%,91%,93%,100% { opacity: 1; }
          90% { opacity: 0.3; }
          92% { opacity: 0.8; }
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(16,185,129,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16,185,129,0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          animation: gridPulse 5s ease-in-out infinite;
        }
        .drop-active { animation: pulseGlow 1.5s ease infinite; }
        .flicker { animation: flicker 8s ease-in-out infinite; }
      `}</style>

      <div className="min-h-screen bg-[#050a05] relative">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
        <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-50" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-10"
          style={{ animation: 'fadeSlideIn 0.4s ease both' }}>

          {/* ── Page header ────────────────────────────────────────────── */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] tracking-[0.35em] text-emerald-600 uppercase flicker"
                style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                AttackWeaver // Log Ingestion
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-none uppercase tracking-tight"
              style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
              Ingest
              <span className="text-emerald-500"> Logs</span>
            </h1>
            <p className="text-zinc-500 mt-3 text-xs max-w-lg leading-relaxed"
              style={{ fontFamily: "'Space Mono',monospace" }}>
              Upload a JSONL file containing raw security events. Each line must be a valid JSON object.
              Events are parsed, enriched, and staged for multi-agent analysis.
            </p>
          </div>

          <div className="grid grid-cols-12 gap-4">

            {/* ── Drop zone — left 7 cols ──────────────────────────────── */}
            <div className="col-span-12 lg:col-span-7">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !hasFile && fileInputRef.current?.click()}
                className={`relative rounded-2xl border-2 border-dashed overflow-hidden transition-all duration-300 cursor-pointer
                  ${isDragging
                    ? 'border-emerald-400 bg-emerald-500/8 drop-active'
                    : hasFile
                    ? 'border-emerald-700/60 bg-black/80 cursor-default'
                    : 'border-zinc-800 bg-black/60 hover:border-emerald-800 hover:bg-emerald-500/4'
                  }`}
                style={{ minHeight: '320px' }}
              >
                {/* Corner accents */}
                <span className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl" />

                {/* Scan line when dragging */}
                {isDragging && (
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent"
                      style={{ animation: 'scanDown 1.5s ease-in-out infinite' }} />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".jsonl,.json"
                  className="sr-only"
                  onChange={handleFileChange}
                />

                {!hasFile ? (
                  /* Empty state */
                  <div className="flex flex-col items-center justify-center h-full py-16 px-8 text-center gap-5">
                    <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all duration-300
                      ${isDragging ? 'border-emerald-400 bg-emerald-500/15' : 'border-zinc-800 bg-zinc-900/50'}`}>
                      <UploadCloud className={`w-9 h-9 transition-colors ${isDragging ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    </div>

                    <div>
                      <p className="text-white font-black text-xl uppercase tracking-wide"
                        style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                        {isDragging ? 'DROP TO INGEST' : 'DROP JSONL FILE HERE'}
                      </p>
                      <p className="text-zinc-600 text-[10px] mt-1" style={{ fontFamily: "'Space Mono',monospace" }}>
                        or click to browse
                      </p>
                    </div>

                    <div className="flex gap-2 flex-wrap justify-center">
                      {['.jsonl', 'UTF-8', 'one event / line'].map(tag => (
                        <span key={tag}
                          className="px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase bg-zinc-900 border border-zinc-800 text-zinc-500"
                          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* File loaded state */
                  <div className="p-5 flex flex-col h-full" style={{ minHeight: '320px' }}>

                    {/* File info bar */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-zinc-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                          <FileJson className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="text-white text-sm font-bold" style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                            {fileName}
                          </div>
                          <div className="text-zinc-600 text-[9px]" style={{ fontFamily: "'Space Mono',monospace" }}>
                            {lineCount} events detected
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <button
                          onClick={e => { e.stopPropagation(); setLogs(''); setFileName(null); setLineCount(0); setParseError(null); }}
                          className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-red-900 hover:bg-red-900/20 flex items-center justify-center transition-colors"
                        >
                          <X className="w-3 h-3 text-zinc-500 hover:text-red-400" />
                        </button>
                      </div>
                    </div>

                    {/* Log preview */}
                    <div className="flex-1 space-y-1.5 overflow-hidden">
                      <div className="flex items-center gap-2 mb-2">
                        <Terminal className="w-3 h-3 text-zinc-700" />
                        <span className="text-[9px] text-zinc-700 uppercase tracking-widest"
                          style={{ fontFamily: "'Space Mono',monospace" }}>
                          preview — first {previewLines.length} of {lineCount} lines
                        </span>
                      </div>
                      {previewLines.map((line, i) => (
                        <LogPreviewLine key={i} line={line} index={i} />
                      ))}
                      {lineCount > 8 && (
                        <div className="text-center text-[9px] text-zinc-700 pt-1"
                          style={{ fontFamily: "'Space Mono',monospace" }}>
                          + {lineCount - 8} more lines
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Error */}
              {parseError && (
                <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl border border-red-900/50 bg-red-500/5 text-red-400 text-xs"
                  style={{ fontFamily: "'Space Mono',monospace" }}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {parseError}
                </div>
              )}
            </div>

            {/* ── Right panel — 5 cols ─────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

              {/* Pipeline info */}
              <div className="relative rounded-2xl border border-emerald-900/50 bg-black/85 overflow-hidden p-5"
                style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: '80ms' }}>
                <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl" />
                <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl" />
                <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl" />
                <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl" />

                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                  Processing Pipeline
                </div>

                <div className="space-y-3">
                  {[
                    { step: '01', label: 'Parse & Validate',   desc: 'Each line parsed as JSON, invalid lines dropped' },
                    { step: '02', label: 'Enrich Events',      desc: 'IP extraction, geo-tagging, device fingerprint' },
                    { step: '03', label: 'Rule-Based Scoring', desc: 'Severity 1–10 assigned per event type' },
                    { step: '04', label: 'Baseline Profiling', desc: 'Behavioral baseline built per user identity' },
                    { step: '05', label: 'Stage to Dashboard', desc: 'Threats sorted by risk, ready for AI pipeline' },
                  ].map(({ step, label, desc }) => (
                    <div key={step} className="flex gap-3 items-start">
                      <span className="text-emerald-700 font-black text-xs w-5 shrink-0 mt-0.5"
                        style={{ fontFamily: "'Space Mono',monospace" }}>
                        {step}
                      </span>
                      <div>
                        <div className="text-white text-xs font-bold uppercase tracking-wide"
                          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                          {label}
                        </div>
                        <div className="text-zinc-600 text-[9px] mt-0.5" style={{ fontFamily: "'Space Mono',monospace" }}>
                          {desc}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Severity distribution — only when file loaded */}
              {severityCounts && (
                <div className="relative rounded-2xl border border-emerald-900/50 bg-black/85 overflow-hidden p-5"
                  style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: '120ms' }}>
                  <span className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-500/40 rounded-tl-2xl" />
                  <span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-500/40 rounded-tr-2xl" />
                  <span className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-500/40 rounded-bl-2xl" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-500/40 rounded-br-2xl" />

                  <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4"
                    style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                    Event Distribution
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Critical', count: severityCounts.critical, color: '#ef4444' },
                      { label: 'High',     count: severityCounts.high,     color: '#f97316' },
                      { label: 'Medium',   count: severityCounts.medium,   color: '#eab308' },
                      { label: 'Low',      count: severityCounts.low,      color: '#10b981' },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="rounded-xl border border-zinc-900 bg-zinc-950/80 p-3">
                        <div className="font-black text-2xl" style={{ color, fontFamily: "'Space Mono',monospace",
                          textShadow: `0 0 12px ${color}50` }}>
                          {count}
                        </div>
                        <div className="text-zinc-600 text-[9px] uppercase tracking-widest mt-0.5"
                          style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                          {label}
                        </div>
                        <div className="mt-2 h-0.5 rounded-full bg-zinc-900 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${lineCount > 0 ? (count / lineCount) * 100 : 0}%`, backgroundColor: color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Process button */}
              <button
                onClick={handleProcess}
                disabled={isProcessing || !hasFile}
                className="relative w-full py-5 rounded-2xl font-black text-base tracking-[0.2em] uppercase
                  transition-all duration-200 overflow-hidden
                  disabled:opacity-30 disabled:cursor-not-allowed
                  enabled:active:scale-[0.98]"
                style={{
                  fontFamily: "'Barlow Condensed',sans-serif",
                  background: hasFile && !isProcessing
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : '#111',
                  color: hasFile && !isProcessing ? '#000' : '#374151',
                  boxShadow: hasFile && !isProcessing ? '0 0 40px rgba(16,185,129,0.35)' : 'none',
                  animation: 'fadeSlideIn 0.4s ease both',
                  animationDelay: '160ms',
                }}
              >
                {isProcessing && (
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      style={{ animation: 'scanDown 1.4s ease-in-out infinite' }} />
                  </div>
                )}
                <span className="flex items-center justify-center gap-3">
                  {isProcessing ? (
                    <><Zap className="w-5 h-5 animate-pulse" /> PROCESSING EVENTS...</>
                  ) : (
                    <><ArrowRight className="w-5 h-5" /> PROCESS &amp; ANALYZE</>
                  )}
                </span>
              </button>

              {/* Format hint */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-4"
                style={{ animation: 'fadeSlideIn 0.4s ease both', animationDelay: '200ms' }}>
                <div className="text-[9px] tracking-[0.2em] text-zinc-700 uppercase mb-2"
                  style={{ fontFamily: "'Barlow Condensed',sans-serif" }}>
                  Expected JSONL Format
                </div>
                <pre className="text-[9px] text-emerald-700/70 leading-relaxed overflow-x-auto"
                  style={{ fontFamily: "'Space Mono',monospace" }}>
{`{"event":"LOGIN_FAILED","user":"admin",
 "host":"ws-01","timestamp":"...","message":"..."}`}
                </pre>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}