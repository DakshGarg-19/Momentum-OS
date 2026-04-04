import { useState } from "react";
import { useMomentum } from "../context/MomentumContext";
import { evaluateStatus } from "../utils/momentumMath";
import VectorCard from "./VectorCard";

// ============================================================
// VectorList — Renders all vector cards + list header
// "Generate System Insights" button lives here above the list
// Includes Filter Bar for Ongoing / Completed / Archived
// ============================================================

const VectorList = () => {
  const { state, setTerminalOpen } = useMomentum();
  const { vectors } = state;
  const [filter, setFilter] = useState("ongoing"); // 'ongoing' | 'completed' | 'archived'

  // Map to add computed status
  const annotatedVectors = vectors.map((v) => ({
    ...v,
    _status: evaluateStatus(v),
  }));

  const displayedVectors = annotatedVectors.filter((v) =>
    filter === "archived" ? v._status === "stale" : v._status === filter,
  );

  const activeCount = annotatedVectors.filter(
    (v) => v._status === "ongoing",
  ).length;

  const handleOpenTerminal = () => setTerminalOpen(true);

  if (vectors.length === 0) {
    return (
      <div className="mos-vector-list-pane">
        {/* Header */}
        <div className="vector-list-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="vector-list-title">Vectors</span>
            <span className="vector-count-chip">0</span>
          </div>
          <button
            id="btn-open-terminal"
            className="btn-generate-insights"
            onClick={handleOpenTerminal}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            Data Terminal
          </button>
        </div>

        {/* Empty State */}
        <div className="empty-state">
          <div className="empty-state-icon">⚡</div>
          <p className="empty-state-title">No vectors initialized</p>
          <p className="empty-state-sub">
            Your behavioral system is idle. Initialize your first vector using
            the form on the right to begin generating momentum.
          </p>
        </div>
      </div>
    );
  }

  // return (
  //   <div className="mos-vector-list-pane">
  //     {/* ── List Header ── */}
  //     <div className="vector-list-header">
  //       <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
  //         <span className="vector-list-title">Vectors</span>
  //         <span className="vector-count-chip">{activeCount} ongoing</span>
  //       </div>
  //       <button
  //         id="btn-open-terminal"
  //         className="btn-generate-insights"
  //         onClick={handleOpenTerminal}
  //       >
  //         <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  //           <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
  //           <line x1="8" y1="21" x2="16" y2="21"/>
  //           <line x1="12" y1="17" x2="12" y2="21"/>
  //         </svg>
  //         Data Terminal
  //       </button>
  //     </div>

  //     {/* ── Filter Bar ── */}
  //     <div className="vector-filter-bar" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
  //       <button
  //         className={`filter-btn ${filter === 'ongoing' ? 'active' : ''}`}
  //         onClick={() => setFilter('ongoing')}
  //       >
  //         Ongoing
  //       </button>
  //       <button
  //         className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
  //         onClick={() => setFilter('completed')}
  //       >
  //         Completed
  //       </button>
  //       <button
  //         className={`filter-btn ${filter === 'archived' ? 'active' : ''}`}
  //         onClick={() => setFilter('archived')}
  //       >
  //         Archived
  //       </button>
  //     </div>

  //     {/* ── Vector Cards ── */}
  //       {displayedVectors.length > 0 ? (
  //         displayedVectors.map((vector) => (
  //           <VectorCard key={vector.id} vector={vector} />
  //         ))
  //       ) : (
  //         <div className="empty-state" style={{ marginTop: '20px' }}>
  //           <p className="empty-state-sub">No {filter} vectors found.</p>
  //         </div>
  //       )}
  //   </div>
  // );

  return (
    // Added 'flex flex-col h-full overflow-hidden' to the main pane
    <div className="mos-vector-list-pane flex flex-col h-full overflow-hidden">
      {/* ── List Header (Stays Pinned) ── */}
      <div className="vector-list-header shrink-0">
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span className="vector-list-title">Vectors</span>
          <span className="vector-count-chip">{activeCount} ongoing</span>
        </div>
        <button
          id="btn-open-terminal"
          className="btn-generate-insights"
          onClick={handleOpenTerminal}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Data Terminal
        </button>
      </div>

      {/* ── Filter Bar (Stays Pinned) ── */}
      <div
        className="vector-filter-bar shrink-0"
        style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
      >
        <button
          className={`filter-btn ${filter === "ongoing" ? "active" : ""}`}
          onClick={() => setFilter("ongoing")}
        >
          Ongoing
        </button>
        <button
          className={`filter-btn ${filter === "completed" ? "active" : ""}`}
          onClick={() => setFilter("completed")}
        >
          Completed
        </button>
        <button
          className={`filter-btn ${filter === "archived" ? "active" : ""}`}
          onClick={() => setFilter("archived")}
        >
          Archived
        </button>
      </div>

      {/* ── Scrollable Vector Cards Area ── */}
      {/* Added 'flex-1 overflow-y-auto flex flex-col gap-4' to make it scrollable */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2 ">
        {displayedVectors.length > 0 ? (
          displayedVectors.map((vector) => (
            <VectorCard key={vector.id} vector={vector} />
          ))
        ) : (
          <div className="empty-state" style={{ marginTop: "20px" }}>
            <p className="empty-state-sub">No {filter} vectors found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorList;
