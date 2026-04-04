import { evaluateStatus } from './momentumMath';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Groups events by day for the last N days.
 * Returns: [{ date: 'Mon', progressEvents: 5, edits: 2 }]
 * (Wait: user defined edits = progress + regress events. Wait, no: "Edits = progress + regress events. Shows Progress Actions and Total Edits overlapping." 
 * Actually, progressEvents: count of type==='progress', edits: count of type==='progress' || type==='regress'.
 * @param {Array} activityLog
 * @param {number} days
 */
export function getActivityTimeline(activityLog, days = 14) {
  const now = new Date();
  // Normalize 'now' to start of today for aligned buckets
  now.setHours(23, 59, 59, 999);
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const bucketDate = new Date(now.getTime() - i * MS_PER_DAY);
    const startOfDay = bucketDate.getTime() - MS_PER_DAY + 1; // start of that day
    const endOfDay = bucketDate.getTime();
    
    let progressCount = 0;
    let editCount = 0;

    for (const event of activityLog) {
      if (event.timestamp >= startOfDay && event.timestamp <= endOfDay) {
        if (event.type === 'progress') progressCount++;
        if (event.type === 'progress' || event.type === 'regress') editCount++;
      }
    }

    data.push({
      date: bucketDate.toLocaleDateString('en-US', { weekday: 'short' }),
      progressEvents: progressCount,
      edits: editCount
    });
  }

  return data;
}

/**
 * Returns: [{ name: 'Ongoing', value: 2 }, { name: 'Completed', value: 1 }, { name: 'Archived', value: 3 }]
 */
export function getVectorStatusDistribution(vectors) {
  const counts = { ongoing: 0, completed: 0, stale: 0 };
  
  for (const v of vectors) {
    counts[evaluateStatus(v)]++;
  }

  return [
    { name: 'Ongoing', value: counts.ongoing },
    { name: 'Completed', value: counts.completed },
    { name: 'Archived', value: counts.stale }
  ];
}

/**
 * Filters for completed vectors. Calculates duration in days.
 * Returns: [{ name: 'Vector Name', days: 4 }]
 */
export function getVectorCompletionTime(vectors) {
  const completedVectors = vectors.filter(v => evaluateStatus(v) === 'completed' && v.completedAt != null);
  
  return completedVectors.map(v => {
    const durationMs = v.completedAt - v.createdAt;
    const days = Math.max(1, Math.round(durationMs / MS_PER_DAY));
    return {
      name: v.title.length > 15 ? v.title.substring(0, 15) + '...' : v.title,
      days
    };
  });
}

/**
 * Returns task completion volume per vector.
 * Returns: [{ name: 'Vector 1', totalTasks: 10, completedTasks: 8 }]
 */
export function getTaskVolume(vectors) {
  return vectors.map(v => {
    const checklist = v.checklist || [];
    return {
      name: v.title.length > 15 ? v.title.substring(0, 15) + '...' : v.title,
      totalTasks: checklist.length,
      completedTasks: checklist.filter(i => i.done).length,
    };
  });
}

/**
 * Returns heatmap data for a given number of days.
 * 1 progress event = 1 point, 1 focus_session = 2 points.
 * Returns: [{ date, count, intensity }] where intensity is 0-4.
 */
export function getContributionHeatmap(activityLog, days = 90) {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const bucketDate = new Date(now.getTime() - i * MS_PER_DAY);
    const startOfDay = bucketDate.getTime() - MS_PER_DAY + 1;
    const endOfDay = bucketDate.getTime();
    
    let count = 0;

    for (const event of activityLog) {
      if (event.timestamp >= startOfDay && event.timestamp <= endOfDay) {
        if (event.type === 'progress') count += 1;
        if (event.type === 'focus_session') count += 2;
      }
    }

    let intensity = 0;
    if (count > 0) intensity = 1;
    if (count >= 3) intensity = 2;
    if (count >= 6) intensity = 3;
    if (count >= 10) intensity = 4;

    data.push({
      date: bucketDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      count,
      intensity
    });
  }

  return data;
}
