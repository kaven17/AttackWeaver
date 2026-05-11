'use client';

import { useState, useMemo } from 'react';
import {
  Shield, Terminal, Activity, Search, Filter,
  ChevronDown, X, AlertTriangle, Eye, Clock,
  MapPin, Monitor, Zap, ArrowUpRight
} from 'lucide-react';

interface SecurityLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  role: string;
  eventType: string;
  action: string;
  device: string;
  deviceId: string;
  location: string;
  ipAddress: string;
  riskScore: number;
  severity: 'Critical' | 'High' | 'Suspicious' | 'Low';
  attackStage: string;
  behavioralAnomaly: number;
  explanation: string;
}

const SAMPLE_LOGS: SecurityLog[] = [
  { id:'EVT-2024-001', timestamp:'2024-12-18 14:23:45', user:'admin_user_47', userId:'U-4721', role:'Administrator', eventType:'Privilege Escalation', action:'Attempted sudo access to production database', device:'Unknown Device (Linux)', deviceId:'DEV-UNKNOWN-8472', location:'Moscow, Russia', ipAddress:'185.220.101.45', riskScore:85, severity:'Critical', attackStage:'Privilege Escalation', behavioralAnomaly:92, explanation:'User accessed system outside normal hours (2 AM local time), from new geographic location, attempting privileged operations never performed before.' },
  { id:'EVT-2024-002', timestamp:'2024-12-18 14:18:12', user:'jdoe@corp.com', userId:'U-1523', role:'Developer', eventType:'Lateral Movement', action:'Accessed 15 employee records via API', device:'New Mobile Device (Android)', deviceId:'DEV-8823', location:'Beijing, China', ipAddress:'218.75.102.93', riskScore:72, severity:'High', attackStage:'Lateral Movement', behavioralAnomaly:78, explanation:'Developer role accessing HR data from new device. Historical pattern shows only code repository access. API call frequency 4x above baseline.' },
  { id:'EVT-2024-003', timestamp:'2024-12-18 14:15:33', user:'service_account_12', userId:'U-SVC-12', role:'Service Account', eventType:'Initial Access', action:'Multiple failed authentication attempts', device:'Known Server', deviceId:'DEV-1205', location:'Virginia, USA', ipAddress:'52.45.23.110', riskScore:45, severity:'Suspicious', attackStage:'Initial Access', behavioralAnomaly:55, explanation:'8 failed login attempts followed by successful authentication. Service accounts typically have zero failures. Possible credential stuffing.' },
  { id:'EVT-2024-004', timestamp:'2024-12-18 14:12:08', user:'api_bot_external', userId:'U-API-991', role:'API Client', eventType:'Reconnaissance', action:'Endpoint enumeration detected', device:'New Device', deviceId:'DEV-UNKNOWN-2441', location:'Frankfurt, Germany', ipAddress:'91.213.8.72', riskScore:38, severity:'Suspicious', attackStage:'Reconnaissance', behavioralAnomaly:42, explanation:'Sequential API endpoint probing pattern detected. 47 unique endpoints accessed in 2 minutes. New IP address for this client.' },
  { id:'EVT-2024-005', timestamp:'2024-12-18 14:08:55', user:'msmith@corp.com', userId:'U-7841', role:'Manager', eventType:'Data Access', action:'Downloaded financial reports', device:'Known Laptop', deviceId:'DEV-4412', location:'New York, USA', ipAddress:'172.16.5.44', riskScore:15, severity:'Low', attackStage:'Unknown', behavioralAnomaly:18, explanation:'Normal business activity. User regularly accesses financial data during business hours from approved device.' },
  { id:'EVT-2024-006', timestamp:'2024-12-18 14:05:21', user:'dbadmin_prod', userId:'U-DBA-03', role:'Database Admin', eventType:'Persistence', action:'Created new admin account', device:'Known Workstation', deviceId:'DEV-3307', location:'London, UK', ipAddress:'81.92.201.15', riskScore:68, severity:'High', attackStage:'Persistence', behavioralAnomaly:71, explanation:'Admin account created outside change window. No associated ticket found. Account naming does not follow organizational convention.' },
  { id:'EVT-2024-007', timestamp:'2024-12-18 14:02:10', user:'contractor_ext_45', userId:'U-EXT-145', role:'External Contractor', eventType:'Data Exfiltration', action:'Large file transfer to external IP', device:'Known Device', deviceId:'DEV-9912', location:'Mumbai, India', ipAddress:'103.21.58.92', riskScore:52, severity:'Suspicious', attackStage:'Lateral Movement', behavioralAnomaly:61, explanation:'Transferred 2.3 GB to unknown external server. Contractor typically transfers <100 MB per session. File transfer occurred after hours.' },
  { id:'EVT-2024-008', timestamp:'2024-12-18 13:58:44', user:'jsmith@corp.com', userId:'U-2214', role:'Sales Rep', eventType:'Authentication', action:'Successful login', device:'Known Mobile', deviceId:'DEV-5523', location:'Chicago, USA', ipAddress:'192.168.1.88', riskScore:8, severity:'Low', attackStage:'Unknown', behavioralAnomaly:5, explanation:'Normal login activity during business hours from registered device and typical location.' },
];

const SEV = {
  Critical:   { bar:'#ef4444', text:'text-red-400',    badge:'border-red-900/60 bg-red-950/40 text-red-400',       dot:'#ef4444' },
  High:       { bar:'#f97316', text:'text-orange-400', badge:'border-orange-900/60 bg-orange-950/40 text-orange-400', dot:'#f97316' },
  Suspicious: { bar:'#eab308', text:'text-yellow-400', badge:'border-yellow-900/60 bg-yellow-950/40 text-yellow-400', dot:'#eab308' },
  Low:        { bar:'#10b981', text:'text-emerald-400',badge:'border-emerald-900/60 bg-emerald-950/40 text-emerald-400', dot:'#10b981' },
} as const;

const STAGES = ['All Stages','Initial Access','Reconnaissance','Lateral Movement','Privilege Escalation','Persistence','Data Exfiltration','Unknown'];
const SEVS   = ['All','Critical','High','Suspicious','Low'];

function Corner({ pos }: { pos: 'tl'|'tr'|'bl'|'br' }) {
  const cls = { tl:'top-0 left-0 border-t-2 border-l-2 rounded-tl-2xl', tr:'top-0 right-0 border-t-2 border-r-2 rounded-tr-2xl', bl:'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-2xl', br:'bottom-0 right-0 border-b-2 border-r-2 rounded-br-2xl' }[pos];
  return <span className={`absolute w-4 h-4 border-emerald-500/30 ${cls}`} />;
}

function RiskBar({ score }: { score: number }) {
  const color = score >= 70 ? '#ef4444' : score >= 50 ? '#f97316' : score >= 30 ? '#eab308' : '#10b981';
  return (
    <div className="flex items-center gap-2">
      <span className="font-black text-sm" style={{ fontFamily:"'Space Mono',monospace", color, textShadow:`0 0 8px ${color}60` }}>{score}</span>
      <div className="w-14 h-1 rounded-full bg-zinc-900 overflow-hidden">
        <div className="h-full rounded-full" style={{ width:`${score}%`, backgroundColor:color, boxShadow:`0 0 4px ${color}80` }} />
      </div>
    </div>
  );
}

export function LogsPage() {
  const [selected, setSelected] = useState<SecurityLog | null>(null);
  const [search, setSearch]     = useState('');
  const [sevFilter, setSevFilter]   = useState('All');
  const [stageFilter, setStageFilter] = useState('All Stages');
  const [showSevDrop, setShowSevDrop]   = useState(false);
  const [showStageDrop, setShowStageDrop] = useState(false);

  const filtered = useMemo(() => SAMPLE_LOGS.filter(l => {
    const matchSev   = sevFilter === 'All' || l.severity === sevFilter;
    const matchStage = stageFilter === 'All Stages' || l.attackStage === stageFilter;
    const matchQ     = !search || [l.user, l.eventType, l.id, l.ipAddress, l.attackStage]
      .some(v => v.toLowerCase().includes(search.toLowerCase()));
    return matchSev && matchStage && matchQ;
  }), [search, sevFilter, stageFilter]);

  const counts = {
    Critical:   SAMPLE_LOGS.filter(l => l.severity === 'Critical').length,
    High:       SAMPLE_LOGS.filter(l => l.severity === 'High').length,
    Suspicious: SAMPLE_LOGS.filter(l => l.severity === 'Suspicious').length,
    Low:        SAMPLE_LOGS.filter(l => l.severity === 'Low').length,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Barlow+Condensed:wght@300;400;600;700;900&display=swap');
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gridPulse { 0%,100%{opacity:0.025} 50%{opacity:0.055} }
        @keyframes scanDown { 0%{top:0%;opacity:0} 5%{opacity:1} 95%{opacity:1} 100%{top:100%;opacity:0} }
        @keyframes flicker { 0%,89%,91%,93%,100%{opacity:1} 90%{opacity:0.3} 92%{opacity:0.8} }
        .grid-bg {
          background-image: linear-gradient(rgba(16,185,129,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(16,185,129,0.035) 1px,transparent 1px);
          background-size:44px 44px; animation:gridPulse 5s ease-in-out infinite;
        }
        .flicker { animation:flicker 8s ease-in-out infinite; }
        .row-hover:hover { background:rgba(16,185,129,0.04) !important; }
        .scrollbar-thin::-webkit-scrollbar{width:4px;height:4px}
        .scrollbar-thin::-webkit-scrollbar-track{background:transparent}
        .scrollbar-thin::-webkit-scrollbar-thumb{background:#064e3b;border-radius:9999px}
        .tag { display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:10px;font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;border:1px solid; }
        .panel { position:relative;border-radius:16px;overflow:hidden;background:rgba(0,0,0,0.85);border:1px solid rgba(16,185,129,0.12); }
        .panel::before { content:'';position:absolute;inset:0;border-radius:16px;background:linear-gradient(135deg,rgba(16,185,129,0.025) 0%,transparent 60%);pointer-events:none; }
        .modal-backdrop { backdrop-filter:blur(8px);background:rgba(0,0,0,0.82); }
        .dropdown { position:absolute;top:calc(100% + 6px);left:0;z-index:50;min-width:180px;border-radius:12px;border:1px solid rgba(16,185,129,0.15);background:rgba(5,10,5,0.98);overflow:hidden; }
        .dropdown-item:hover { background:rgba(16,185,129,0.06); }
      `}</style>

      <div className="min-h-screen bg-[#050a05] relative">
        <div className="fixed inset-0 grid-bg pointer-events-none z-0" />
        <div className="fixed top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent z-50" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-5 py-10"
          style={{ animation:'fadeSlideIn 0.4s ease both' }}>

          {/* ── Page Header ── */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className="text-[9px] tracking-[0.35em] text-emerald-600 uppercase flicker"
                style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                AttackWeaver // Security Event Log
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white leading-none uppercase tracking-tight"
              style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
              Event
              <span className="text-emerald-500"> Logs</span>
            </h1>
            <p className="text-zinc-500 mt-3 text-xs max-w-lg leading-relaxed"
              style={{ fontFamily:"'Space Mono',monospace" }}>
              All ingested security events — correlated, enriched, and staged for AI reconstruction.
              Click any row to inspect the full threat analysis.
            </p>
          </div>

          {/* ── Bento Grid ── */}
          <div className="grid grid-cols-12 gap-4">

            {/* ── LEFT: Main table — 7 cols ── */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4">

              {/* Search + Filter bar */}
              <div className="panel p-3 flex flex-wrap gap-2 items-center"
                style={{ animation:'fadeSlideIn 0.4s ease both', animationDelay:'40ms' }}>
                <Corner pos="tl" /><Corner pos="tr" />
                {/* Search */}
                <div className="flex items-center gap-2 flex-1 min-w-[160px] px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-900 focus-within:border-emerald-900/60">
                  <Search className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search user, IP, event type..."
                    className="bg-transparent flex-1 text-[11px] text-zinc-300 placeholder-zinc-700 outline-none"
                    style={{ fontFamily:"'Space Mono',monospace" }}
                  />
                  {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-zinc-600 hover:text-zinc-400" /></button>}
                </div>

                {/* Severity dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowSevDrop(v => !v); setShowStageDrop(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-900 hover:border-emerald-900/50 transition-colors"
                  >
                    <Filter className="w-3 h-3 text-zinc-600" />
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                      {sevFilter === 'All' ? 'Severity' : sevFilter}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-700" />
                  </button>
                  {showSevDrop && (
                    <div className="dropdown">
                      {SEVS.map(s => (
                        <button key={s} onClick={() => { setSevFilter(s); setShowSevDrop(false); }}
                          className="dropdown-item w-full text-left px-4 py-2.5 text-[11px] transition-colors"
                          style={{ fontFamily:"'Barlow Condensed',sans-serif", color: s === 'All' ? '#6b7280' : SEV[s as keyof typeof SEV]?.bar ?? '#6b7280', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase' }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stage dropdown */}
                <div className="relative">
                  <button
                    onClick={() => { setShowStageDrop(v => !v); setShowSevDrop(false); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-900 hover:border-emerald-900/50 transition-colors"
                  >
                    <Activity className="w-3 h-3 text-zinc-600" />
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                      {stageFilter === 'All Stages' ? 'Stage' : stageFilter.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-zinc-700" />
                  </button>
                  {showStageDrop && (
                    <div className="dropdown">
                      {STAGES.map(s => (
                        <button key={s} onClick={() => { setStageFilter(s); setShowStageDrop(false); }}
                          className="dropdown-item w-full text-left px-4 py-2.5 text-[11px] text-zinc-400 font-bold uppercase tracking-widest transition-colors"
                          style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <span className="ml-auto text-[9px] text-zinc-700" style={{ fontFamily:"'Space Mono',monospace" }}>
                  {filtered.length}/{SAMPLE_LOGS.length} events
                </span>
              </div>

              {/* Table */}
              <div className="panel" style={{ animation:'fadeSlideIn 0.4s ease both', animationDelay:'80ms' }}>
                <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                <div className="overflow-x-auto scrollbar-thin">
                  <table className="w-full" style={{ minWidth:640 }}>
                    <thead>
                      <tr className="border-b border-zinc-900/80" style={{ background:'rgba(6,20,8,0.9)' }}>
                        {['Event ID','Time','User','Event Type','Risk','Severity','Stage',''].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600"
                            style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} className="py-16 text-center text-zinc-700 text-xs" style={{ fontFamily:"'Space Mono',monospace" }}>
                          no events match filters
                        </td></tr>
                      ) : filtered.map((l, i) => (
                        <tr
                          key={l.id}
                          className="row-hover border-b border-zinc-900/40 cursor-pointer transition-colors"
                          style={{ background: i % 2 === 0 ? 'rgba(5,12,6,0.7)' : 'rgba(3,8,4,0.5)', animation:`fadeSlideIn 0.3s ease both`, animationDelay:`${i * 30}ms` }}
                          onClick={() => setSelected(l)}
                        >
                          <td className="px-4 py-3">
                            <span className="text-emerald-700 text-[10px]" style={{ fontFamily:"'Space Mono',monospace" }}>{l.id}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-zinc-600 text-[10px]" style={{ fontFamily:"'Space Mono',monospace" }}>
                              {l.timestamp.split(' ')[1]}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-zinc-200 text-xs font-bold" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{l.user}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-emerald-300 text-xs font-bold uppercase tracking-wide" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{l.eventType}</span>
                          </td>
                          <td className="px-4 py-3"><RiskBar score={l.riskScore} /></td>
                          <td className="px-4 py-3">
                            <span className={`tag ${SEV[l.severity].badge}`}>
                              <span className="w-1 h-1 rounded-full" style={{ background:SEV[l.severity].dot }} />
                              {l.severity}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-zinc-500 text-[10px] uppercase tracking-widest" style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{l.attackStage}</span>
                          </td>
                          <td className="px-4 py-3">
                            <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 group-hover:text-emerald-600" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ── RIGHT: Sidebar — 5 cols ── */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4">

              {/* Event Distribution */}
              <div className="panel p-5" style={{ animation:'fadeSlideIn 0.4s ease both', animationDelay:'60ms' }}>
                <Corner pos="tl" /><Corner pos="tr" />
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                  Event Distribution
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {(Object.entries(counts) as [keyof typeof SEV, number][]).map(([sev, count]) => (
                    <div key={sev}
                      className="rounded-xl border border-zinc-900 bg-zinc-950/80 p-3 cursor-pointer transition-all hover:border-zinc-800"
                      onClick={() => setSevFilter(sevFilter === sev ? 'All' : sev)}>
                      <div className="font-black text-2xl" style={{ fontFamily:"'Space Mono',monospace", color:SEV[sev].bar, textShadow:`0 0 12px ${SEV[sev].bar}50` }}>
                        {count}
                      </div>
                      <div className="text-zinc-600 text-[9px] uppercase tracking-widest mt-0.5"
                        style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{sev}</div>
                      <div className="mt-2 h-0.5 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width:`${(count/SAMPLE_LOGS.length)*100}%`, backgroundColor:SEV[sev].bar }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attack Stage Breakdown */}
              <div className="panel p-5" style={{ animation:'fadeSlideIn 0.4s ease both', animationDelay:'100ms' }}>
                <Corner pos="tl" /><Corner pos="tr" />
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                  Attack Stage Breakdown
                </div>
                <div className="space-y-2.5">
                  {['Initial Access','Lateral Movement','Privilege Escalation','Persistence','Reconnaissance','Unknown'].map(stage => {
                    const c = SAMPLE_LOGS.filter(l => l.attackStage === stage).length;
                    if (!c) return null;
                    return (
                      <div key={stage} className="flex items-center gap-3">
                        <span className="text-zinc-500 text-[10px] w-32 truncate uppercase tracking-wide font-bold"
                          style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{stage}</span>
                        <div className="flex-1 h-1 rounded-full bg-zinc-900 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500/60"
                            style={{ width:`${(c/SAMPLE_LOGS.length)*100}%`, boxShadow:'0 0 4px rgba(16,185,129,0.4)' }} />
                        </div>
                        <span className="text-emerald-600 text-[10px] font-black w-4 text-right"
                          style={{ fontFamily:"'Space Mono',monospace" }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="panel p-5" style={{ animation:'fadeSlideIn 0.4s ease both', animationDelay:'140ms' }}>
                <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
                <div className="text-[9px] tracking-[0.25em] text-emerald-600 uppercase mb-4"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                  Session Stats
                </div>
                <div className="space-y-3">
                  {[
                    { label:'Total Events',      value: SAMPLE_LOGS.length,                  icon:<Activity className="w-3.5 h-3.5" /> },
                    { label:'Avg Risk Score',     value: Math.round(SAMPLE_LOGS.reduce((a,l)=>a+l.riskScore,0)/SAMPLE_LOGS.length), icon:<AlertTriangle className="w-3.5 h-3.5" /> },
                    { label:'High Risk Events',   value: SAMPLE_LOGS.filter(l=>l.riskScore>60).length, icon:<Zap className="w-3.5 h-3.5" /> },
                    { label:'Unique Users',        value: new Set(SAMPLE_LOGS.map(l=>l.userId)).size, icon:<Eye className="w-3.5 h-3.5" /> },
                  ].map(({ label, value, icon }) => (
                    <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl border border-zinc-900/60 bg-zinc-950/50">
                      <div className="flex items-center gap-2 text-zinc-600">{icon}
                        <span className="text-[10px] uppercase tracking-widest text-zinc-600"
                          style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{label}</span>
                      </div>
                      <span className="font-black text-emerald-400 text-sm"
                        style={{ fontFamily:"'Space Mono',monospace" }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center p-6 z-50"
          onClick={() => setSelected(null)}>
          <div className="panel w-full max-w-2xl max-h-[88vh] overflow-y-auto scrollbar-thin"
            style={{ border:'1px solid rgba(16,185,129,0.2)', animation:'fadeSlideIn 0.2s ease both' }}
            onClick={e => e.stopPropagation()}>
            <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-zinc-900/80">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span className="font-black text-xl uppercase tracking-wider text-white"
                    style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Event Details</span>
                </div>
                <span className="text-[9px] text-emerald-700 mt-0.5 block"
                  style={{ fontFamily:"'Space Mono',monospace" }}>{selected.id}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={`tag ${SEV[selected.severity].badge}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background:SEV[selected.severity].dot }} />
                  {selected.severity}
                </span>
                <button className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 flex items-center justify-center transition-colors"
                  onClick={() => setSelected(null)}>
                  <X className="w-3 h-3 text-zinc-500" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Top row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon:<Clock className="w-3.5 h-3.5" />, label:'Timestamp', value:selected.timestamp },
                  { icon:<MapPin className="w-3.5 h-3.5" />, label:'Location', value:selected.location },
                  { icon:<Monitor className="w-3.5 h-3.5" />, label:'Device', value:selected.device },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="rounded-xl border border-zinc-900/60 bg-zinc-950/60 p-3">
                    <div className="flex items-center gap-1.5 text-zinc-600 mb-1">{icon}
                      <span className="text-[9px] uppercase tracking-widest"
                        style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{label}</span>
                    </div>
                    <div className="text-zinc-200 text-[10px]" style={{ fontFamily:"'Space Mono',monospace" }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* User + identity */}
              <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/60 p-4">
                <div className="text-[9px] tracking-[0.2em] text-emerald-700 uppercase mb-3"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Identity</div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                  {[['User',selected.user],['User ID',selected.userId],['Role',selected.role],['IP Address',selected.ipAddress]].map(([k,v]) => (
                    <div key={k} className="flex gap-2 items-start">
                      <span className="text-zinc-600 text-[9px] uppercase tracking-widest w-16 shrink-0 pt-0.5"
                        style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{k}</span>
                      <span className="text-zinc-200 text-[10px] break-all" style={{ fontFamily:"'Space Mono',monospace" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Threat metrics */}
              <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/60 p-4">
                <div className="text-[9px] tracking-[0.2em] text-emerald-700 uppercase mb-3"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Threat Metrics</div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Risk Score</div>
                    <RiskBar score={selected.riskScore} />
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Behavioral Anomaly</div>
                    <RiskBar score={selected.behavioralAnomaly} />
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Attack Stage</div>
                    <span className="text-emerald-300 text-xs font-bold uppercase tracking-wide"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{selected.attackStage}</span>
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-600 uppercase tracking-widest mb-1"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Event Type</div>
                    <span className="text-zinc-200 text-xs font-bold uppercase tracking-wide"
                      style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>{selected.eventType}</span>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="rounded-xl border border-zinc-900/60 bg-zinc-950/60 p-4">
                <div className="text-[9px] tracking-[0.2em] text-emerald-700 uppercase mb-2"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>Action Performed</div>
                <p className="text-zinc-300 text-[11px] leading-relaxed" style={{ fontFamily:"'Space Mono',monospace" }}>
                  {selected.action}
                </p>
              </div>

              {/* AI Analysis */}
              <div className="rounded-xl border p-4" style={{ borderColor:'rgba(59,130,246,0.2)', background:'rgba(2,8,20,0.8)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" style={{ boxShadow:'0 0 6px #60a5fa' }} />
                  <div className="text-[9px] tracking-[0.2em] text-blue-500 uppercase"
                    style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>AI Analysis</div>
                </div>
                <p className="text-blue-200/80 text-[11px] leading-relaxed" style={{ fontFamily:"'Space Mono',monospace" }}>
                  {selected.explanation}
                </p>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex gap-3 p-5 pt-0">
              <button className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest border border-zinc-800 text-zinc-500 hover:bg-zinc-900 transition-colors"
                style={{ fontFamily:"'Barlow Condensed',sans-serif" }}>
                False Positive
              </button>
              <button className="flex-1 py-3 rounded-xl font-black text-sm uppercase tracking-widest text-white transition-all"
                style={{ fontFamily:"'Barlow Condensed',sans-serif", background:'linear-gradient(135deg,#7f1d1d,#dc2626)', boxShadow:'0 0 16px rgba(220,38,38,0.25)' }}>
                Escalate Threat
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
export default LogsPage;