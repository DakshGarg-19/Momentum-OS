import { useState } from 'react';
import { useMomentum } from '../context/MomentumContext';

// ============================================================
// VectorForm — "Initialize Vector" right-sidebar form (v2)
// Goal-based: title + Build / Explore / Avoid strategy texts
// + Target Date + Energy Level
// ============================================================

const VectorForm = () => {
  const { addVector } = useMomentum();

  const [title,       setTitle]       = useState('');
  const [buildText,   setBuildText]   = useState('');
  const [exploreText, setExploreText] = useState('');
  const [avoidText,   setAvoidText]   = useState('');
  const [targetDate,  setTargetDate]  = useState('');
  const [energy,      setEnergy]      = useState(3);
  const [errors,      setErrors]      = useState({});

  const validate = () => {
    const errs = {};
    if (!title.trim()) errs.title = 'Vector name is required';
    if (!buildText.trim()) errs.buildText = 'Define your execution strategy';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    addVector({ title, buildText, exploreText, avoidText, targetDate, energy });

    // Reset
    setTitle('');
    setBuildText('');
    setExploreText('');
    setAvoidText('');
    setTargetDate('');
    setEnergy(3);
    setErrors({});
  };

  return (
    <div>
      <p className="form-section-title">Initialize</p>
      <h2 className="form-title-main">New Vector</h2>

      <form id="vector-form" onSubmit={handleSubmit} noValidate>

        {/* ── Vector Title ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="vector-title">Vector Name</label>
          <input
            id="vector-title"
            type="text"
            className={`form-input ${errors.title ? 'error' : ''}`}
            placeholder='e.g. "Master System Design"'
            value={title}
            onChange={(e) => { setTitle(e.target.value); setErrors(p => ({...p, title: ''})); }}
            autoComplete="off"
          />
          {errors.title && (
            <p className="form-error">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              {errors.title}
            </p>
          )}
        </div>

        <div className="form-divider" />

        {/* ── Build Strategy ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="vector-build">
            <span style={{ color: 'var(--type-build)', marginRight: 4 }}>■</span>
            Build Strategy
          </label>
          <textarea
            id="vector-build"
            className={`form-input form-textarea ${errors.buildText ? 'error' : ''}`}
            placeholder="The core execution plan. What will you actually do?"
            rows={3}
            value={buildText}
            onChange={(e) => { setBuildText(e.target.value); setErrors(p => ({...p, buildText: ''})); }}
          />
          {errors.buildText && (
            <p className="form-error">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              {errors.buildText}
            </p>
          )}
        </div>

        {/* ── Explore / Research ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="vector-explore">
            <span style={{ color: 'var(--type-explore)', marginRight: 4 }}>■</span>
            Explore / Research
          </label>
          <textarea
            id="vector-explore"
            className="form-input form-textarea"
            placeholder="Vague areas to research. Questions you need to answer."
            rows={2}
            value={exploreText}
            onChange={(e) => setExploreText(e.target.value)}
          />
        </div>

        {/* ── Avoid / Distractions ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="vector-avoid">
            <span style={{ color: 'var(--type-avoid)', marginRight: 4 }}>■</span>
            Distractions to Avoid
          </label>
          <textarea
            id="vector-avoid"
            className="form-input form-textarea"
            placeholder="What drains energy without output? What should you stop?"
            rows={2}
            value={avoidText}
            onChange={(e) => setAvoidText(e.target.value)}
          />
        </div>

        <div className="form-divider" />

        {/* ── Target Date ── */}
        <div className="form-group">
          <label className="form-label" htmlFor="vector-target-date">Target Date</label>
          <input
            id="vector-target-date"
            type="date"
            className="form-input"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            style={{ colorScheme: 'dark' }}
          />
        </div>

        {/* ── Energy Level ── */}
        <div className="form-group">
          <label className="form-label">
            Energy Level
            <span style={{ color: 'var(--text-dim)', fontWeight: 400, marginLeft: 4, textTransform: 'none', letterSpacing: 0 }}>
              (initial importance)
            </span>
          </label>
          <div className="energy-btn-group" role="group" aria-label="Energy level selector">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                id={`energy-${level}`}
                className={`energy-btn ${energy === level ? 'selected' : ''}`}
                onClick={() => setEnergy(level)}
                aria-pressed={energy === level}
                aria-label={`Energy level ${level}`}
              >
                {level}
                <span className="energy-btn-dot" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Submit ── */}
        <button
          id="btn-initialize-vector"
          type="submit"
          className="btn-initialize"
          aria-label="Initialize new vector"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
          </svg>
          Initialize Vector
        </button>

      </form>
    </div>
  );
};

export default VectorForm;
