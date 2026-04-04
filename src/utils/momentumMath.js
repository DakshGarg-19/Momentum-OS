// ============================================================
// momentumMath.js — Pure Computation Engine (v2 — Checklist Model)
// Checklist-driven progress. No manual counters stored.
// ============================================================

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_7_DAYS  = 7  * MS_PER_DAY;
const MS_30_DAYS = 30 * MS_PER_DAY;

/** @param {number} n @returns {number} */
function round1(n) { return Math.round(n * 10) / 10; }

// ─────────────────────────────────────────────────────────────
// calculateMomentum
// ─────────────────────────────────────────────────────────────

/**
 * Compute momentum score from the activityLog.
 * "Ironclad Math" & Natural Decay:
 *
 * @param {object}       vector         Full vector object
 * @param {Array}        activityLog    Full activity log
 * @param {number|null}  lastActionAt   Unix ms — null if never touched
 * @param {number}       createdAt      Unix ms
 * @returns {number}
 */
export function calculateMomentum(vector, activityLog, lastActionAt, createdAt) {
  const now    = Date.now();
  const cutoff = now - MS_7_DAYS;

  // 1. Identify all checklist items where done === true.
  const doneItems = (vector.checklist || []).filter(i => i.done);

  // 2. For each, find its single MOST RECENT 'progress' event in the activityLog.
  let validRecentProgressCount = 0;
  for (const item of doneItems) {
    const itemEvents = activityLog.filter(
      e => e.vectorId === vector.id && e.itemId === item.id && e.type === 'progress'
    );
    if (itemEvents.length > 0) {
      itemEvents.sort((a, b) => b.timestamp - a.timestamp);
      // 3. If that event's timestamp is within the last 7 days: add +3.0
      if (itemEvents[0].timestamp >= cutoff) {
        validRecentProgressCount++;
      }
    }
  }

  // 4. Calculate daysInactive
  const referenceTime = lastActionAt ?? createdAt;
  const daysInactive  = (now - referenceTime) / MS_PER_DAY;

  // 5. Return formula
  return round1(
    (validRecentProgressCount * 3) - (daysInactive * 1.5)
  );
}

// ─────────────────────────────────────────────────────────────
// evaluateStatus
// ─────────────────────────────────────────────────────────────

/**
 * Derive vector status.
 *
 * Priority:
 *   1. vector.completedAt != null → 'completed'
 *   2. daysInactive > 7           → 'stale'
 *   3. Otherwise                  → 'ongoing'
 *
 * @param {{ checklist?: Array<{done:boolean}>, lastActionAt:number|null, createdAt:number, completedAt?:number|null }} vector
 * @returns {'ongoing'|'completed'|'stale'}
 */
export function evaluateStatus(vector) {
  // Rule 1: Custom completion
  if (vector.completedAt) {
    return 'completed';
  }

  // Rule 2: Stale when untouched for > 7 days
  const now           = Date.now();
  const referenceTime = vector.lastActionAt ?? vector.createdAt;
  const daysInactive  = (now - referenceTime) / MS_PER_DAY;

  if (daysInactive > 7) return 'stale';

  return 'ongoing';
}

// ─────────────────────────────────────────────────────────────
// computeTelemetry
// ─────────────────────────────────────────────────────────────

/**
 * Aggregate system telemetry across all vectors.
 *
 * @param {Array} vectors
 * @param {Array} activityLog
 * @returns {{
 *   totalSystemMomentum: number,
 *   focusIndex:          number,
 *   executionRatio:      number,
 *   activeCount:         number,
 *   staleCount:          number,
 *   completedCount:      number,
 *   topVector:           {title:string, momentum:number}|null,
 * }}
 */
export function computeTelemetry(vectors, activityLog) {
  const now      = Date.now();
  const cutoff30 = now - MS_30_DAYS;
  const cutoff7  = now - MS_7_DAYS;

  // Annotate each vector with computed status + momentum
  const annotated = vectors.map((v) => ({
    ...v,
    _status:   evaluateStatus(v),
    _momentum: calculateMomentum(v, activityLog, v.lastActionAt, v.createdAt),
  }));

  const ongoing   = annotated.filter((v) => v._status === 'ongoing');
  const stale     = annotated.filter((v) => v._status === 'stale');
  const completed = annotated.filter((v) => v._status === 'completed');

  // Total System Momentum (ALL vectors, to reflect natural decay of completed goals)
  const totalSystemMomentum = round1(
    annotated.reduce((sum, v) => sum + v._momentum, 0)
  );

  // Focus Index — top-3 / total × 100
  const sortedAll = [...annotated].sort((a, b) => b._momentum - a._momentum);
  const top3Sum   = sortedAll.slice(0, 3).reduce((sum, v) => sum + v._momentum, 0);
  let focusIndex = 0;
  if (totalSystemMomentum !== 0 && annotated.length > 0) {
    focusIndex = round1((top3Sum / totalSystemMomentum) * 100);
  }

  // Execution Ratio & Action Velocity
  const recentEvents  = activityLog.filter((e) => e.timestamp >= cutoff30);
  const events7Days   = activityLog.filter((e) => e.timestamp >= cutoff7);
  
  const progressCount = recentEvents.filter((e) => e.type === 'progress').length;
  const regressCount  = recentEvents.filter((e) => e.type === 'regress').length;
  const totalEvents   = progressCount + regressCount;
  const executionRatio = totalEvents > 0 ? progressCount / totalEvents : 0;

  // Total Focus Hours This Week
  const focusSessions7 = events7Days.filter((e) => e.type === 'focus_session');
  const totalFocusHoursThisWeek = focusSessions7.reduce((sum, e) => sum + (e.durationMinutes / 60), 0);

  // Action Velocity = (Valid Progress Events Last 7 Days) / (Total Focus Hours This Week)
  const progress7DaysCount = events7Days.filter((e) => e.type === 'progress').length;
  const effectiveHours     = Math.max(totalFocusHoursThisWeek, 0.5);
  const actionVelocity     = round1(progress7DaysCount / effectiveHours);

  const topVector = sortedAll.length > 0
    ? { title: sortedAll[0].title, momentum: sortedAll[0]._momentum }
    : null;

  return {
    totalSystemMomentum,
    focusIndex,
    executionRatio,
    totalFocusHoursThisWeek,
    actionVelocity,
    activeCount:    ongoing.length,
    staleCount:     stale.length,
    completedCount: completed.length,
    topVector,
  };
}
