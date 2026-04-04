import { createContext, useContext, useState } from 'react';
import { useMomentumDB } from '../hooks/useMomentumDB';

// ============================================================
// MomentumContext — Thin wrapper over useMomentumDB (v2)
// Exposes checklist-driven DB API + AI modal state
// ============================================================

const MomentumContext = createContext(null);

export const MomentumProvider = ({ children }) => {
  const db = useMomentumDB();
  const [terminalOpen, setTerminalOpen] = useState(false);

  return (
    <MomentumContext.Provider
      value={{
        // ── DB state ──
        state: db.state,

        // ── Vector actions ──
        addVector:          db.addVector,
        markVectorComplete: db.markVectorComplete,
        deleteVector:       db.deleteVector,

        // ── Checklist actions ──
        addChecklistItem:    db.addChecklistItem,
        toggleChecklistItem: db.toggleChecklistItem,
        deleteChecklistItem: db.deleteChecklistItem,

        // ── Advanced / Portability ──
        logFocusSession: db.logFocusSession,
        exportData:      db.exportData,
        importData:      db.importData,

        // ── Terminal modal ──
        terminalOpen, setTerminalOpen,
      }}
    >
      {children}
    </MomentumContext.Provider>
  );
};

export const useMomentum = () => {
  const ctx = useContext(MomentumContext);
  if (!ctx) throw new Error('useMomentum must be used inside <MomentumProvider>');
  return ctx;
};
