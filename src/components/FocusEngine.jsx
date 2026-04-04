import { useState, useEffect, useRef } from 'react';
import Draggable from 'react-draggable';
import { useMomentum } from '../context/MomentumContext';
import { evaluateStatus } from '../utils/momentumMath';

// ============================================================
// FocusEngine — Floating, Draggable Vector-linked Pomodoro
// ============================================================

let audioCtx = null;

export default function FocusEngine() {
  const { state, logFocusSession } = useMomentum();
  const ongoingVectors = state.vectors.filter(v => evaluateStatus(v) === 'ongoing');

  const [selectedVectorId, setSelectedVectorId] = useState('');
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [mode, setMode] = useState('work');       // 'work' | 'break'
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const intervalRef = useRef(null);
  const nodeRef = useRef(null);

  // Set default vector
  useEffect(() => {
    if (!selectedVectorId && ongoingVectors.length > 0) {
      setSelectedVectorId(ongoingVectors[0].id);
    }
  }, [ongoingVectors.length]); // eslint-disable-line

  // Sync timeLeft to workMinutes only when idle in work mode
  useEffect(() => {
    if (!isActive && mode === 'work') {
      setTimeLeft(workMinutes * 60);
    }
  }, [workMinutes]); // eslint-disable-line

  useEffect(() => {
    if (!isActive && mode === 'break') {
      setTimeLeft(breakMinutes * 60);
    }
  }, [breakMinutes]); // eslint-disable-line

  const beep = () => {
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const oscillator = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 1.2);
      oscillator.connect(gain);
      gain.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 1.2);
    } catch { /* audio blocked */ }
  };

  // Main tick
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setTimeout(() => handleComplete(), 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive]); // eslint-disable-line

  const handleComplete = () => {
    setIsActive(false);
    beep();
    if (mode === 'work') {
      if (selectedVectorId) logFocusSession(selectedVectorId, workMinutes);
      setMode('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      setMode('work');
      setTimeLeft(workMinutes * 60);
    }
  };

  // ── Controls ──────────────────────────────────────────────
  const startTimer  = () => setIsActive(true);
  const pauseTimer  = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    // timeLeft is intentionally NOT reset — resumes from exact second
  };
  const stopTimer = () => {
    clearInterval(intervalRef.current);
    setIsActive(false);
    setMode('work');
    setTimeLeft(workMinutes * 60);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const modeColor = mode === 'work' ? '#10b981' : '#8b5cf6';

  // ── Minimized pill ─────────────────────────────────────────
  const MiniPill = () => (
    <div
      className="drag-handle"
      onClick={() => setMinimized(false)}
      style={{
        background: 'rgba(20,20,40,0.95)',
        border: `1px solid ${modeColor}55`,
        borderRadius: '999px',
        padding: '6px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        cursor: 'pointer',
        boxShadow: `0 0 12px ${modeColor}33`,
        backdropFilter: 'blur(8px)',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: modeColor, fontWeight: 600 }}>
        {mode.toUpperCase()}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', color: '#f0eeff', letterSpacing: '2px' }}>
        {formatTime(timeLeft)}
      </span>
      {isActive && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: modeColor, boxShadow: `0 0 6px ${modeColor}`, animation: 'pulse 1.4s ease-in-out infinite' }} />
      )}
    </div>
  );

  // ── Full UI ────────────────────────────────────────────────
  const FullPanel = () => (
    <div style={{
      background: 'rgba(14,14,28,0.97)',
      border: `1px solid rgba(139,92,246,0.3)`,
      borderRadius: '12px',
      width: '240px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.1)',
      backdropFilter: 'blur(12px)',
      overflow: 'hidden',
    }}>
      <div
        className="drag-handle"
        style={{
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(139,92,246,0.15)',
          cursor: 'grab',
          userSelect: 'none',
          background: 'rgba(139,92,246,0.07)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="rgba(139,92,246,0.6)">
            <circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
            <circle cx="3" cy="6" r="1.2"/><circle cx="9" cy="6" r="1.2"/>
            <circle cx="3" cy="9" r="1.2"/><circle cx="9" cy="9" r="1.2"/>
          </svg>
          <span style={{ fontSize: '10px', color: 'rgba(164,158,200,0.7)', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>
            FOCUS ENGINE
          </span>
        </div>
        <button
          onClick={() => setMinimized(true)}
          style={{ background: 'none', border: 'none', color: 'rgba(164,158,200,0.5)', cursor: 'pointer', padding: '0', lineHeight: '1', fontSize: '14px' }}
        >—</button>
      </div>

      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '10px', color: modeColor, fontFamily: 'var(--font-mono)', letterSpacing: '1px' }}>
            {mode === 'work' ? '⚡ WORK SESSION' : '☕ BREAK'}
          </span>
        </div>

        <select
          value={selectedVectorId}
          onChange={e => setSelectedVectorId(e.target.value)}
          disabled={isActive || ongoingVectors.length === 0}
          style={{
            width: '100%', background: 'rgba(25,25,48,0.9)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '6px', color: '#f0eeff', fontSize: '11px', padding: '5px 8px', marginBottom: '10px',
          }}
        >
          {ongoingVectors.length === 0
            ? <option value="">No vectors</option>
            : ongoingVectors.map(v => <option key={v.id} value={v.id}>{v.title}</option>)
          }
        </select>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: 'rgba(164,158,200,0.6)', marginBottom: '3px' }}>WORK MIN</label>
            <input
              type="number" value={workMinutes} min={1}
              onChange={e => setWorkMinutes(Math.max(1, Number(e.target.value)))} disabled={isActive}
              style={{ width: '100%', background: 'rgba(25,25,48,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', color: '#f0eeff', fontSize: '12px', padding: '4px 6px', textAlign: 'center' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: 'rgba(164,158,200,0.6)', marginBottom: '3px' }}>BREAK MIN</label>
            <input
              type="number" value={breakMinutes} min={1}
              onChange={e => setBreakMinutes(Math.max(1, Number(e.target.value)))} disabled={isActive}
              style={{ width: '100%', background: 'rgba(25,25,48,0.9)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '6px', color: '#f0eeff', fontSize: '12px', padding: '4px 6px', textAlign: 'center' }}
            />
          </div>
        </div>

        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: '42px', textAlign: 'center', fontWeight: '200', letterSpacing: '4px',
          color: isActive ? modeColor : '#f0eeff', textShadow: isActive ? `0 0 16px ${modeColor}66` : 'none', margin: '6px 0 16px',
        }}>
          {formatTime(timeLeft)}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {!isActive ? (
            <button onClick={startTimer} disabled={ongoingVectors.length === 0}
              style={{ flex: 2, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '6px', color: '#10b981', padding: '7px 0', fontSize: '12px', cursor: 'pointer' }}>
              ▶ Start
            </button>
          ) : (
            <button onClick={pauseTimer}
              style={{ flex: 2, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '6px', color: '#a78bfa', padding: '7px 0', fontSize: '12px', cursor: 'pointer' }}>
              ⏸ Pause
            </button>
          )}
          <button onClick={stopTimer}
            style={{ flex: 1, background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: '6px', color: '#f43f5e', padding: '7px 0', fontSize: '12px', cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <Draggable nodeRef={nodeRef} bounds="parent" handle=".drag-handle" defaultPosition={{ x: 0, y: 0 }}>
      <div ref={nodeRef} style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 200 }}>
        {minimized ? <MiniPill /> : <FullPanel />}
      </div>
    </Draggable>
  );
}
