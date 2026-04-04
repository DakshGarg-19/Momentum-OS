import TelemetrySidebar from "../components/TelemetrySidebar";
import VectorList from "../components/VectorList";
import VectorForm from "../components/VectorForm";
import TelemetryTerminal from "../components/TelemetryTerminal";
import FocusEngine from "../components/FocusEngine";

// ============================================================
// Dashboard — Three-column OS shell layout
// Left: Telemetry  |  Center: Vectors  |  Right: Create Form
// ============================================================

const Dashboard = () => {
  return (
    <div className="mos-shell">
      {/* ── Left Sidebar: Telemetry ── */}
      <TelemetrySidebar />

      {/* ── Main Content ── */}
      <main className="mos-main">
        {/* Topbar */}
        <div className="mos-topbar">
          <span className="mos-topbar-title">Mission Control</span>
          <div className="mos-topbar-badge">System Online</div>
        </div>

        {/* Center + Right panes */}
        <div className="mos-content-area">
          {/* Center: Vector List */}
          <VectorList />

          {/* Right Sidebar: Create Vector */}
          <div className="mos-sidebar-right">
            <VectorForm />
          </div>
        </div>
      </main>

      {/* ── Terminal Modal (overlay) ── */}
      <TelemetryTerminal />

      {/* ── Focus Engine (floating draggable widget) ── */}
      <FocusEngine />
    </div>
  );
};

export default Dashboard;
