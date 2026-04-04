import { useState, useRef } from "react";
import { useMomentum } from "../context/MomentumContext";
import { calculateMomentum, evaluateStatus } from "../utils/momentumMath";

// ============================================================
// VectorCard — Checklist-Driven Vector Card (v2)
// Progress is automatic: checking items fires ActivityEvents.
// ============================================================

const STATUS_META = {
  active: { label: "ACTIVE", className: "active" },
  completed: { label: "COMPLETED", className: "completed" },
  stale: { label: "STALE", className: "stale" },
};

/** Chevron icon — rotates when open */
const ChevronIcon = ({ open }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 200ms ease",
    }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const VectorCard = ({ vector }) => {
  const {
    state,
    toggleChecklistItem,
    addChecklistItem,
    deleteChecklistItem,
    markVectorComplete,
    deleteVector,
  } = useMomentum();

  // Local UI state
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [newItemText, setNewItemText] = useState("");
  const addInputRef = useRef(null);

  // ── Derived data ──────────────────────────────────────────
  const checklist = vector.checklist ?? [];
  const checklistTotal = checklist.length;
  const checklistCompleted = checklist.filter((i) => i.done).length;
  const progressPercent =
    checklistTotal > 0
      ? Math.min(100, Math.round((checklistCompleted / checklistTotal) * 100))
      : 0;

  const canMarkComplete =
    checklistTotal > 0 &&
    checklistCompleted === checklistTotal &&
    vector.completedAt == null;

  const momentum = calculateMomentum(
    vector,
    state.activityLog,
    vector.lastActionAt,
    vector.createdAt,
  );
  const status = evaluateStatus(vector);
  const statusMeta = STATUS_META[status] ?? STATUS_META.active;

  const momentumClass =
    momentum > 0 ? "positive" : momentum < 0 ? "negative" : "neutral";
  const momentumSign = momentum > 0 ? "+" : "";

  // Target date display
  const targetDateLabel = vector.targetDate
    ? new Date(vector.targetDate + "T00:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // ── Handlers ─────────────────────────────────────────────
  const handleToggle = (itemId) => toggleChecklistItem(vector.id, itemId);

  const handleAddItem = (e) => {
    e.preventDefault();
    const text = newItemText.trim();
    if (!text) return;
    addChecklistItem(vector.id, text);
    setNewItemText("");
    addInputRef.current?.focus();
  };

  const handleDeleteItem = (e, itemId) => {
    e.stopPropagation();
    deleteChecklistItem(vector.id, itemId);
  };

  const handleDeleteVector = () => {
    if (window.confirm(`Remove vector "${vector.title}"?`))
      deleteVector(vector.id);
  };

  // ── Render ────────────────────────────────────────────────
  // return (
  //   <div
  //     className={`vector-card card-enter ${status} h-auto flex flex-col`}
  //     id={`vector-${vector.id}`}
  //   >
  return (
    <div
      // Added shrink-0 to prevent the card from compressing
      className={`vector-card card-enter ${status} h-auto flex flex-col shrink-0`}
      id={`vector-${vector.id}`}
    >
      {/* ── Header ── */}
      <div className="vector-card-header shrink-0">
        <div className="vector-card-title-group">
          <h2 className="vector-card-title" title={vector.title}>
            {vector.title}
          </h2>
          <div className="vector-badges">
            <span className={`badge-status ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
            {/* Energy pips */}
            <span className="energy-pips" title={`Energy: ${vector.energy}/5`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={`energy-pip ${n <= vector.energy ? "active" : ""}`}
                />
              ))}
            </span>
            {/* Target date badge */}
            {targetDateLabel && (
              <span className="badge-target-date">
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {targetDateLabel}
              </span>
            )}
          </div>
        </div>

        <button
          className="vector-card-delete"
          id={`delete-vector-${vector.id}`}
          onClick={handleDeleteVector}
          title="Remove vector"
          aria-label={`Delete vector ${vector.title}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4h6v2" />
          </svg>
        </button>
      </div>

      {/* ── Progress + Momentum Row ── */}
      <div className="vector-metrics shrink-0">
        <div className="vector-progress-group">
          <div className="vector-progress-label">
            <span className="vector-progress-text">
              {checklistTotal === 0 ? "No items yet" : "Progress"}
            </span>
            {checklistTotal > 0 && (
              <span className="vector-progress-count text-mono">
                {checklistCompleted} / {checklistTotal}
              </span>
            )}
          </div>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <div
              className={`progress-fill ${progressPercent >= 100 ? "complete" : ""}`}
              style={{
                width: checklistTotal > 0 ? `${progressPercent}%` : "0%",
              }}
            />
          </div>
        </div>

        <div
          className={`momentum-score ${momentumClass}`}
          title="Current Momentum Score"
        >
          <span className="momentum-score-value">
            {momentumSign}
            {momentum.toFixed(1)}
          </span>
          <span className="momentum-score-label">MOMENTUM</span>
        </div>
      </div>

      {/* ── Strategy ── */}
      {(vector.buildText || vector.exploreText || vector.avoidText) && (
        <div className="vector-strategy shrink-0">
          <button
            className="strategy-toggle"
            onClick={() => setStrategyOpen((v) => !v)}
            aria-expanded={strategyOpen}
            aria-controls={`strategy-${vector.id}`}
            type="button"
          >
            <span>Strategy</span>
            <ChevronIcon open={strategyOpen} />
          </button>

          {strategyOpen && (
            <div className="strategy-blocks" id={`strategy-${vector.id}`}>
              {vector.buildText && (
                <div className="strategy-block build">
                  <span className="strategy-label">BUILD</span>
                  <p className="strategy-text">{vector.buildText}</p>
                </div>
              )}
              {vector.exploreText && (
                <div className="strategy-block explore">
                  <span className="strategy-label">EXPLORE</span>
                  <p className="strategy-text">{vector.exploreText}</p>
                </div>
              )}
              {vector.avoidText && (
                <div className="strategy-block avoid">
                  <span className="strategy-label">AVOID</span>
                  <p className="strategy-text">{vector.avoidText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Checklist ── */}
      <div className="checklist-section">
        <div className="checklist-section-header shrink-0">
          <span className="checklist-section-label">
            <svg
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 11 12 14 22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            Checklist
          </span>
          {checklistTotal > 0 && (
            <span className="checklist-count-chip">
              {checklistCompleted}/{checklistTotal}
            </span>
          )}
        </div>

        {/* Items */}
        {checklist.length > 0 ? (
          <div className="mt-2 mb-4">
            <div className="checklist-items">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="py-1 flex items-center justify-between group"
                >
                  <label className="flex items-start gap-3 cursor-pointer group flex-1 mr-2">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => handleToggle(item.id)}
                      className="mt-1 w-4 h-4 cursor-pointer appearance-none rounded border border-gray-600 bg-gray-800 checked:bg-violet-500 checked:border-violet-500 relative flex items-center justify-center after:content-['✔'] after:absolute after:text-white after:text-[10px] after:opacity-0 checked:after:opacity-100 transition-all"
                    />
                    <span
                      className={`text-sm transition-colors ${item.done ? "line-through text-gray-500" : "text-gray-300 group-hover:text-white"}`}
                    >
                      {item.text}
                    </span>
                  </label>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-red-400 shrink-0"
                    onClick={(e) => handleDeleteItem(e, item.id)}
                    aria-label={`Remove: ${item.text}`}
                    type="button"
                    title="Remove item"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="checklist-empty">
            No items yet — add your first action below.
          </p>
        )}

        {/* Add Item Row */}
        <form className="checklist-add-row" onSubmit={handleAddItem}>
          <input
            ref={addInputRef}
            id={`add-item-${vector.id}`}
            className="checklist-add-input"
            type="text"
            placeholder="Add checklist item..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            autoComplete="off"
            aria-label="New checklist item text"
            disabled={status === "completed"}
          />
          <button
            type="submit"
            className="btn-add-item"
            aria-label="Add item to checklist"
            disabled={!newItemText.trim() || status === "completed"}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </form>

        {canMarkComplete && (
          <button
            className="btn-mark-complete"
            onClick={() => markVectorComplete(vector.id)}
            aria-label={`Mark vector ${vector.title} complete`}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mark Complete
          </button>
        )}
      </div>
    </div>
  );
};

export default VectorCard;
