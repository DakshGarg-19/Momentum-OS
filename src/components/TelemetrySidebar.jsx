import { useMomentum } from "../context/MomentumContext";
import { computeTelemetry } from "../utils/momentumMath";
import FocusEngine from "./FocusEngine";

// ============================================================
// TelemetrySidebar — Left sidebar
// Aggregate analytics + brand + insights button
// computeTelemetry fully implemented in Step 5
// ============================================================

const TelemetrySidebar = () => {
  const { state, setTerminalOpen, exportData, importData } = useMomentum();
  const { vectors, activityLog } = state;

  // Step 5: computeTelemetry returns real metrics; skeleton returns zeros
  const telemetry = computeTelemetry(vectors, activityLog);

  const {
    totalSystemMomentum,
    focusIndex,
    executionRatio,
    activeCount,
    staleCount,
    topVector,
    actionVelocity,
  } = telemetry;

  const momentumClass =
    totalSystemMomentum > 0
      ? "positive"
      : totalSystemMomentum < 0
        ? "negative"
        : "accent";

  const momentumSign = totalSystemMomentum > 0 ? "+" : "";

  const handleInsights = () => setTerminalOpen(true);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const success = importData(event.target.result);
      if (success) {
        alert("Data imported successfully!");
      } else {
        alert("Failed to import data. Invalid format.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <aside className="mos-sidebar-left">
      {/* ── Brand ── */}
      <div className="mos-brand">
        <div className="mos-brand-icon" aria-hidden="true">
          {/* Bolt / momentum icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div className="mos-brand-text">
          <h1>Momentum OS</h1>
          <p>Behavioral Telemetry</p>
        </div>
      </div>

      {/* ── System Status ── */}
      <div className="telemetry-section" style={{ paddingTop: "20px" }}>
        <div className="telemetry-section-label">System Status</div>

        {/* Total System Momentum */}
        <div className="telemetry-metric">
          <span className="telemetry-metric-label">Total Momentum</span>
          <span className={`telemetry-metric-value ${momentumClass}`}>
            {momentumSign}
            {totalSystemMomentum.toFixed(1)}
          </span>
          <span className="telemetry-metric-sub">
            across all active vectors
          </span>
        </div>

        {/* Focus Index */}
        <div className="telemetry-metric">
          <span className="telemetry-metric-label">Focus Index</span>
          <span className="telemetry-metric-value accent">
            {isNaN(focusIndex) || !isFinite(focusIndex)
              ? "—"
              : `${focusIndex.toFixed(0)}%`}
          </span>
          <span className="telemetry-metric-sub">top 3 vs total momentum</span>
        </div>

        {/* Execution Ratio */}
        <div className="telemetry-metric">
          <span className="telemetry-metric-label">Execution Ratio</span>
          <span
            className={`telemetry-metric-value ${executionRatio >= 0.5 ? "positive" : "negative"}`}
          >
            {isNaN(executionRatio)
              ? "—"
              : `${(executionRatio * 100).toFixed(0)}%`}
          </span>
          <span className="telemetry-metric-sub">
            progress / total events (30d)
          </span>
        </div>
        {/* Action Velocity */}
        <div className="telemetry-metric">
          <span className="telemetry-metric-label">Action Velocity</span>
          <span
            className={`telemetry-metric-value ${actionVelocity >= 1 ? "positive" : "negative"}`}
          >
            {isNaN(actionVelocity) ? "—" : `${actionVelocity.toFixed(1)}/hr`}
          </span>
          <span className="telemetry-metric-sub">progress vs focus (7d)</span>
        </div>
      </div>

      {/* ── Vector Stats ── */}
      <div className="divider" />
      <div className="telemetry-section">
        <div className="telemetry-section-label">Vectors</div>
        <div className="telemetry-stat-row">
          <div className="telemetry-stat">
            <span className="telemetry-stat-label">Active</span>
            <span
              className="telemetry-stat-value"
              style={{ color: "var(--status-active)" }}
            >
              {activeCount}
            </span>
          </div>
          <div className="telemetry-stat">
            <span className="telemetry-stat-label">Stale</span>
            <span
              className="telemetry-stat-value"
              style={{ color: "var(--status-stale)" }}
            >
              {staleCount}
            </span>
          </div>
        </div>

        {/* Top Performing Vector */}
        {topVector && (
          <div className="telemetry-metric" style={{ marginTop: 0 }}>
            <span className="telemetry-metric-label">Top Vector</span>
            <span
              className="telemetry-metric-value"
              style={{ fontSize: "14px", color: "var(--text-primary)" }}
            >
              {topVector.title}
            </span>
            <span
              className="telemetry-metric-sub"
              style={{ color: "var(--momentum-positive)" }}
            >
              momentum: +{topVector.momentum?.toFixed(1) ?? "0.0"}
            </span>
          </div>
        )}
      </div>

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Data Hub ── */}
      <div className="telemetry-section" style={{ paddingBottom: "0" }}>
        <div
          className="divider"
          style={{ marginBottom: "16px", marginLeft: 0, marginRight: 0 }}
        />
        <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
          <button
            className="filter-btn"
            style={{ flex: 1 }}
            onClick={exportData}
          >
            Export Backup
          </button>
          <label
            className="filter-btn"
            style={{ flex: 1, textAlign: "center" }}
          >
            Import JSON
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      {/* ── Insights Button ── */}
      <div className="telemetry-section" style={{ paddingBottom: "20px" }}>
        <div
          className="divider"
          style={{ marginBottom: "16px", marginLeft: 0, marginRight: 0 }}
        />
        <button
          id="btn-sidebar-insights"
          className="btn-insight"
          onClick={handleInsights}
          disabled={vectors.length === 0}
          aria-label="Open telemetry terminal"
          title={
            vectors.length === 0
              ? "Initialize vectors first"
              : "Open integrated data terminal"
          }
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
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Data Terminal</span>
        </button>
      </div>
    </aside>
  );
};

export default TelemetrySidebar;
