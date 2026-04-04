import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useMomentum } from '../context/MomentumContext';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend, Label
} from 'recharts';
import {
  getActivityTimeline, getVectorStatusDistribution,
  getVectorCompletionTime, getTaskVolume
} from '../utils/chartData';
import { computeTelemetry } from '../utils/momentumMath';

// ============================================================
// TelemetryTerminal — Full-screen Data Dashboard
// Recharts charts + 90-day heatmap + Puter.js Strategic Audit
// ============================================================

const TOOLTIP_STYLE = {
  backgroundColor: '#111827',
  borderColor: '#374151',
  color: '#f3f4f6',
  borderRadius: '8px',
  fontSize: '12px',
};

const PIE_COLORS = { Ongoing: '#8b5cf6', Completed: '#10b981', Archived: '#4b5563' };

const HEATMAP_COLORS = ['#1f2937', '#064e3b', '#059669', '#10b981', '#34d399'];

// ── Contribution Calendar (Phase 3) ────────────────────────
function ContributionCalendar({ activityLog }) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  // Build intensity map keyed by YYYY-MM-DD local time
  const intensityMap = {};
  for (const event of activityLog) {
    const d = new Date(event.timestamp);
    if (d.getFullYear() !== selectedYear) continue;
    const key = d.toLocaleDateString('en-CA');
    const pts = event.type === 'focus_session' ? 2 : event.type === 'progress' ? 1 : 0;
    if (pts > 0) intensityMap[key] = (intensityMap[key] || 0) + pts;
  }

  // Generate all days of the selected year
  const start = new Date(selectedYear, 0, 1);
  const end   = new Date(selectedYear, 11, 31);
  const days  = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString('en-CA');
    const count = intensityMap[key] || 0;
    let intensity = 0;
    if (count > 0)  intensity = 1;
    if (count >= 3) intensity = 2;
    if (count >= 6) intensity = 3;
    if (count >= 10) intensity = 4;
    days.push({ date: key, count, intensity, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) });
  }

  // Pad for week alignment (day 0 = Sun)
  const firstDayOfWeek = start.getDay();
  const padded = Array(firstDayOfWeek).fill(null).concat(days);

  const totalContribs = days.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ background: 'var(--bg-tertiary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>Action Heatmap</h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalContribs} contributions in {selectedYear}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setSelectedYear(y => y - 1)}
            style={{ background: 'none', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', color: 'var(--text-secondary)', cursor: 'pointer', padding: '2px 8px', fontSize: '14px' }}
          >‹</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-primary)', minWidth: '36px', textAlign: 'center' }}>{selectedYear}</span>
          <button
            onClick={() => setSelectedYear(y => Math.min(y + 1, currentYear))}
            disabled={selectedYear >= currentYear}
            style={{ background: 'none', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '4px', color: selectedYear >= currentYear ? 'var(--text-muted)' : 'var(--text-secondary)', cursor: selectedYear >= currentYear ? 'not-allowed' : 'pointer', padding: '2px 8px', fontSize: '14px' }}
          >›</button>
        </div>
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', gap: '2px', paddingLeft: '0', marginBottom: '4px', overflow: 'hidden' }}>
        {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map(m => (
          <span key={m} style={{ flex: 1, fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{m}</span>
        ))}
      </div>

      {/* Grid */}
      <div style={{
        display: 'grid',
        gridTemplateRows: 'repeat(7, 1fr)',
        gridAutoFlow: 'column',
        gap: '4px',
        overflowX: 'auto',
        paddingBottom: '6px',
      }}>
        {padded.map((d, i) => (
          d === null
            ? <div key={`pad-${i}`} style={{ width: 13, height: 13 }} />
            : <div
                key={d.date}
                title={`${d.label}: ${d.count} points`}
                style={{
                  width: 13, height: 13,
                  backgroundColor: HEATMAP_COLORS[d.intensity],
                  borderRadius: '2px',
                  transition: 'transform 0.1s',
                  cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.4)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
              />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Less</span>
        {HEATMAP_COLORS.map((c, i) => (
          <div key={i} style={{ width: 11, height: 11, backgroundColor: c, borderRadius: '2px' }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>More</span>
      </div>
    </div>
  );
}

// ── Strategic Audit Panel (Phase 4) ────────────────────────
function StrategicAuditPanel({ vectors, activityLog }) {
  const [aiInsight, setAiInsight]     = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateStrategicReport = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);

    // Dynamically script load puter if missing
    if (!window.puter) {
      try {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = "https://js.puter.com/v2/";
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      } catch (err) {
        setAiInsight("AI Engine not initialized. Please refresh.");
        setIsAnalyzing(false);
        return;
      }
    }

    try {
      if (!window.puter?.ai?.chat) throw new Error('Puter SDK unavailable');
      const telemetry = computeTelemetry(vectors, activityLog);
      const prompt = `You are Momentum OS, an advanced Behavioral Telemetry AI. Analyze this user data: ${JSON.stringify(telemetry)}.
Format your response strictly in Markdown using this exact structure:
📊 Executive Summary
(2 sentences summarizing their overall system health and momentum trajectory).
🔍 Deep Insights
Velocity & Focus: (Analyze Action Velocity vs Focus Hours. Are they doing fake work or highly efficient?)
Execution Consistency: (Analyze Execution Ratio. Are they decisive or hesitating?)
Vector Health: (Analyze Active vs Stale vectors. Is there scope creep or drift?)
⚡ The Prime Directive
(Give 1 highly specific, ruthless action they must take in the next 24 hours to optimize their system).`;
      
      const response = await window.puter.ai.chat(prompt);
      const text = typeof response === 'string' ? response : response?.message?.content ?? JSON.stringify(response);
      setAiInsight(text);
    } catch (err) {
      setAiInsight('System Audit Offline: Connect to Network.');
      console.warn('[StrategicAudit]', err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{
      background: 'var(--bg-tertiary)',
      padding: '20px',
      borderRadius: 'var(--radius-md)',
      border: '1px solid rgba(16,185,129,0.25)',
      gridColumn: '1 / -1', // span full width
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', letterSpacing: '1px' }}>
            ⚡ STRATEGIC AUDIT
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI-powered behavioral analysis</span>
        </div>
        <button
          onClick={generateStrategicReport}
          disabled={isAnalyzing || vectors.length === 0}
          style={{
            background: isAnalyzing ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: '6px',
            color: '#10b981',
            padding: '7px 16px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '1px',
            cursor: isAnalyzing || vectors.length === 0 ? 'not-allowed' : 'pointer',
            opacity: vectors.length === 0 ? 0.4 : 1,
          }}
        >
          {isAnalyzing ? '■ ANALYZING...' : '▶ RUN SYSTEM AUDIT'}
        </button>
      </div>

      {isAnalyzing && (
        <div style={{ fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: '12px', animation: 'pulse 1.5s infinite' }}>
          {'> Scanning telemetry matrix...'}
        </div>
      )}

      {aiInsight && !isAnalyzing && (
        <div style={{
          fontFamily: 'var(--font-sans)',
          fontSize: '13px',
          color: '#10b981',
          lineHeight: '1.6',
          background: 'rgba(16,185,129,0.05)',
          border: '1px solid rgba(16,185,129,0.15)',
          borderRadius: '6px',
          padding: '16px',
          whiteSpace: 'pre-wrap',
          textShadow: '0 0 8px rgba(16,185,129,0.3)',
        }} className="prose prose-invert prose-emerald max-w-none">
          <ReactMarkdown>{aiInsight}</ReactMarkdown>
        </div>
      )}

      {!aiInsight && !isAnalyzing && (
        <div style={{ color: 'var(--text-muted)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
          {'> Awaiting command. Run audit to receive strategic analysis.'}
        </div>
      )}
    </div>
  );
}

// ── Main Terminal ───────────────────────────────────────────
export default function TelemetryTerminal() {
  const { terminalOpen, setTerminalOpen, state } = useMomentum();

  if (!terminalOpen) return null;

  const handleClose = () => setTerminalOpen(false);
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) handleClose();
  };

  const activityData    = getActivityTimeline(state.activityLog, 14);
  const statusData      = getVectorStatusDistribution(state.vectors);
  const completionData  = getVectorCompletionTime(state.vectors);
  const volumeData      = getTaskVolume(state.vectors);
  const totalVectors    = state.vectors.length;

  const cardStyle = {
    background: 'var(--bg-tertiary)',
    padding: '20px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border-subtle)',
  };

  return (
    <div
      className="modal-backdrop"
      style={{ zIndex: 9999 }}
      onClick={handleBackdropClick}
    >
      <div className="modal-box" style={{
        maxWidth: '92vw',
        width: '1280px',
        height: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <p className="modal-tag">Momentum OS</p>
            <h2 className="modal-title">Integrated Data Terminal</h2>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close terminal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Scrollable Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-y-auto p-6 flex-1">

          {/* Chart 1: Activity Timeline */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Activity Timeline (14 Days)</h3>
            <div style={{ width: '100%', height: '240px', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer>
                <AreaChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradEdits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: '#f3f4f6' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="edits"          name="Total Edits"       stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gradEdits)" />
                  <Area type="monotone" dataKey="progressEvents" name="Progress Actions"  stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#gradProgress)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Donut with center label */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Vector Distribution</h3>
            <div style={{ width: '100%', height: '240px', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={PIE_COLORS[entry.name]} />
                    ))}
                    <Label
                      value={`${totalVectors}`}
                      position="center"
                      style={{ fontSize: '26px', fontWeight: '200', fill: '#f0eeff', fontFamily: 'var(--font-mono)' }}
                    />
                    <Label
                      value="VECTORS"
                      position="center"
                      dy={22}
                      style={{ fontSize: '9px', fill: '#635f84', letterSpacing: '2px', fontFamily: 'var(--font-mono)' }}
                    />
                  </Pie>
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Task Volume */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Task Execution Volume</h3>
            <div style={{ width: '100%', height: '240px', minWidth: 0, minHeight: 0 }}>
              <ResponsiveContainer>
                <BarChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="totalTasks"     name="Total Tasks"     fill="#4b5563" barSize={36} radius={[6,6,0,0]} />
                  <Bar dataKey="completedTasks" name="Completed Tasks" fill="#8b5cf6" barSize={36} radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Time-to-Completion */}
          <div style={cardStyle}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>Time to Completion (Days)</h3>
            <div style={{ width: '100%', height: '240px', minWidth: 0, minHeight: 0 }}>
              {completionData.length > 0 ? (
                <ResponsiveContainer>
                  <BarChart data={completionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} />
                    <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                    <Bar dataKey="days" name="Days to Finish" fill="#10b981" barSize={36} radius={[6,6,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                  {'> No completed vectors yet.'}
                </div>
              )}
            </div>
          </div>

          {/* Chart 5: Contribution Heatmap (full width) */}
          <div style={{ gridColumn: '1 / -1' }}>
            <ContributionCalendar activityLog={state.activityLog} />
          </div>

          {/* Panel 6: Strategic Audit (full width) */}
          <StrategicAuditPanel vectors={state.vectors} activityLog={state.activityLog} />

        </div>
      </div>
    </div>
  );
}
