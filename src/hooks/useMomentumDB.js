import { useState, useCallback } from 'react';

// ============================================================
// useMomentumDB — localStorage Persistence Engine (v2)
// Checklist-driven model. Progress events are fired by
// toggleChecklistItem, not by manual +/- buttons.
// ============================================================

const DB_KEY = 'momentum_os_db';

/** @type {{ vectors: Array, activityLog: Array }} */
const DEFAULT_STATE = { vectors: [], activityLog: [] };

// ─────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────

function loadState() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return (parsed && Array.isArray(parsed.vectors) && Array.isArray(parsed.activityLog))
      ? parsed
      : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state) {
  try { localStorage.setItem(DB_KEY, JSON.stringify(state)); } catch { /* quota */ }
}

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export function useMomentumDB() {
  const [state, setState] = useState(loadState);

  /** Atomic updater: applies updater, persists, returns new state. */
  const commit = useCallback((updater) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  }, []);

  // ── addVector ──────────────────────────────────────────────
  /**
   * Create a new Vector with the holistic goal model.
   *
   * @param {{
   *   title:       string,
   *   buildText:   string,   // Execution strategy
   *   exploreText: string,   // Research / vague aspects
   *   avoidText:   string,   // Distractions to avoid
   *   targetDate:  string,   // ISO date string (YYYY-MM-DD)
   *   energy:      number,   // 1–5
   * }} data
   */
  const addVector = useCallback((data) => {
    const newVector = {
      id:          crypto.randomUUID(),
      title:       data.title.trim(),
      buildText:   data.buildText?.trim()   ?? '',
      exploreText: data.exploreText?.trim() ?? '',
      avoidText:   data.avoidText?.trim()   ?? '',
      targetDate:  data.targetDate          ?? '',
      energy:      Number(data.energy)      || 3,
      createdAt:   Date.now(),
      lastActionAt: null,
      completedAt: null,
      // status is NOT stored — computed by evaluateStatus()
      checklist:   [],  // Array<{ id, text, done }>
    };

    commit((prev) => ({
      ...prev,
      vectors: [...prev.vectors, newVector],
    }));
  }, [commit]);

  // ── addChecklistItem ───────────────────────────────────────
  /**
   * Append a new unchecked item to a vector's checklist.
   * This is planning — no ActivityEvent is fired.
   *
   * @param {string} vectorId
   * @param {string} text
   */
  const addChecklistItem = useCallback((vectorId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const newItem = {
      id:   crypto.randomUUID(),
      text: trimmed,
      done: false,
    };

    commit((prev) => ({
      ...prev,
      vectors: prev.vectors.map((v) =>
        v.id !== vectorId
          ? v
          : { ...v, checklist: [...(v.checklist ?? []), newItem] }
      ),
    }));
  }, [commit]);

  // ── toggleChecklistItem ────────────────────────────────────
  /**
   * Flip a checklist item's done state.
   * Automatically fires an ActivityEvent:
   *   false → true  →  { type: 'progress' }
   *   true  → false →  { type: 'regress'  }
   *
   * @param {string} vectorId
   * @param {string} itemId
   */
  const toggleChecklistItem = useCallback((vectorId, itemId) => {
    const now = Date.now();

    commit((prev) => {
      const vector = prev.vectors.find((v) => v.id === vectorId);
      if (!vector) return prev;

      const item = (vector.checklist ?? []).find((i) => i.id === itemId);
      if (!item) return prev;

      const newDone   = !item.done;
      const eventType = newDone ? 'progress' : 'regress';

      /** @type {ActivityEvent} */
      const event = {
        id:        crypto.randomUUID(),
        vectorId,
        itemId,    // Track the item to prevent infinite momentum farming
        type:      eventType,
        timestamp: now,
      };

      return {
        ...prev,
        vectors: prev.vectors.map((v) => {
          if (v.id !== vectorId) return v;
          return {
            ...v,
            lastActionAt: now,
            checklist: (v.checklist ?? []).map((i) =>
              i.id !== itemId ? i : { ...i, done: newDone }
            ),
          };
        }),
        activityLog: [...prev.activityLog, event],
      };
    });
  }, [commit]);

  // ── deleteChecklistItem ────────────────────────────────────
  /**
   * Remove a checklist item (no activity event — it was planning).
   * @param {string} vectorId
   * @param {string} itemId
   */
  const deleteChecklistItem = useCallback((vectorId, itemId) => {
    commit((prev) => ({
      ...prev,
      vectors: prev.vectors.map((v) =>
        v.id !== vectorId
          ? v
          : { ...v, checklist: (v.checklist ?? []).filter((i) => i.id !== itemId) }
      ),
    }));
  }, [commit]);

  // ── markVectorComplete ──────────────────────────────────────
  /**
   * Complete the vector, setting completedAt and firing a 'complete' activity event.
   * @param {string} vectorId
   */
  const markVectorComplete = useCallback((vectorId) => {
    const now = Date.now();
    commit((prev) => {
      const vector = prev.vectors.find((v) => v.id === vectorId);
      if (!vector) return prev;

      /** @type {ActivityEvent} */
      const event = {
        id:        crypto.randomUUID(),
        vectorId,
        type:      'complete',
        timestamp: now,
      };

      return {
        ...prev,
        vectors: prev.vectors.map((v) =>
          v.id === vectorId ? { ...v, completedAt: now, lastActionAt: now } : v
        ),
        activityLog: [...prev.activityLog, event],
      };
    });
  }, [commit]);

  // ── deleteVector ───────────────────────────────────────────
  /**
   * Permanently remove a vector and ALL its activity events.
   * @param {string} vectorId
   */
  const deleteVector = useCallback((vectorId) => {
    commit((prev) => ({
      ...prev,
      vectors:     prev.vectors.filter((v) => v.id !== vectorId),
      activityLog: prev.activityLog.filter((e) => e.vectorId !== vectorId),
    }));
  }, [commit]);

  // ── logFocusSession ────────────────────────────────────────
  const logFocusSession = useCallback((vectorId, durationMinutes) => {
    const now = Date.now();
    commit((prev) => {
      const event = {
        id: crypto.randomUUID(),
        vectorId,
        type: 'focus_session',
        durationMinutes,
        timestamp: now,
      };
      return { ...prev, activityLog: [...prev.activityLog, event] };
    });
  }, [commit]);

  // ── Data Portability ───────────────────────────────────────
  const exportData = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'momentum_os_backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }, [state]);

  const importData = useCallback((jsonData) => {
    try {
      const parsedData = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (!parsedData || !Array.isArray(parsedData.vectors) || !Array.isArray(parsedData.activityLog)) {
        throw new Error("Invalid Momentum OS backup file.");
      }
      setState(parsedData);
      saveState(parsedData);
      return true;
    } catch (e) {
      console.error(e);
      alert("Import failed: Corrupted or invalid JSON.");
      return false;
    }
  }, []);

  return {
    state,
    addVector,
    addChecklistItem,
    toggleChecklistItem,
    deleteChecklistItem,
    markVectorComplete,
    deleteVector,
    logFocusSession,
    exportData,
    importData,
  };
}
