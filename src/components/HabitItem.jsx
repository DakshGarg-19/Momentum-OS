import { useState } from "react";
import { useHabit } from "../context/HabitContext";

/* ─── BUG: The entire JSX return was a <div> with no Tailwind classes. Habit
   name, streak, and buttons were bare inline text nodes — no card styling,
   no priority badge, no goal display, no progress indication. The browser
   rendered them as unstyled stacked text.
   BUG: `today` used split("T")[1] → TIME string → isDoneToday always false.
   BUG: `setEditing(true)` after save → user locked in edit mode forever.
   BUG: Direct object mutation `editData.name = e.target.value` → no re-render. */

const PRIORITY_STYLES = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const HabitItem = ({ habit }) => {
  const { toggleHabit, deleteHabit, updateHabit, getStreak } = useHabit();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState(habit);

  /* BUG FIX: split("T")[1] → TIME. Corrected to split("T")[0] → "YYYY-MM-DD" */
  const today = new Date().toISOString().split("T")[0];
  const isDoneToday = habit.completedDates.includes(today);
  const streak = getStreak(habit.completedDates);

  const handleSave = () => {
    updateHabit(habit.id, editData);
    /* BUG FIX: was `setEditing(true)` — locked user in edit mode permanently.
       Corrected to `setEditing(false)` to return to view mode after saving. */
    setEditing(false);
  };

  /* ── Edit mode ─────────────────────────────────────────────────────────── */
  if (editing) {
    return (
      <div className="bg-white border border-indigo-300 rounded-lg p-4 shadow-sm space-y-3">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Editing
        </p>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Habit Name
          </label>
          {/* BUG FIX: was `editData.name = e.target.value` (direct mutation,
              no re-render). Corrected to use `setEditData` setter with spread. */}
          <input
            value={editData.name}
            onChange={(e) =>
              setEditData({ ...editData, name: e.target.value })
            }
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Goal
            </label>
            <input
              type="number"
              value={editData.goalValue || ""}
              onChange={(e) =>
                setEditData({ ...editData, goalValue: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Unit
            </label>
            <input
              value={editData.unit || ""}
              onChange={(e) =>
                setEditData({ ...editData, unit: e.target.value })
              }
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-md transition-colors"
          >
            Save
          </button>
          <button
            onClick={() => setEditing(false)}
            className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-md transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  /* ── View mode ─────────────────────────────────────────────────────────── */
  const priorityLabel = habit.priority || "medium";
  const priorityStyle =
    PRIORITY_STYLES[priorityLabel] || PRIORITY_STYLES.medium;

  return (
    <div
      className={`bg-white border rounded-lg p-4 shadow-sm transition-opacity ${
        isDoneToday
          ? "border-indigo-200 opacity-60"
          : "border-slate-200 opacity-100"
      }`}
    >
      {/* ── Top row: badges + streak ──────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {habit.category && (
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {habit.category}
            </span>
          )}
          <span
            className={`text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${priorityStyle}`}
          >
            {priorityLabel}
          </span>
        </div>
        <div className="flex items-center gap-1 text-amber-500">
          <span className="text-sm font-bold">{streak}</span>
          <span className="text-xs">🔥</span>
          <span className="text-xs text-slate-400 font-medium">STREAK</span>
        </div>
      </div>

      {/* ── Habit name ────────────────────────────────────────────────────── */}
      <h3
        className={`text-base font-bold mb-3 ${
          isDoneToday
            ? "line-through text-slate-400"
            : "text-slate-800"
        }`}
      >
        {habit.name}
      </h3>

      {/* ── Goal + actions ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            Goal
          </p>
          <p className="text-sm text-slate-600 font-medium">
            {habit.goalValue || "—"} {habit.unit || ""}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-700 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => deleteHabit(habit.id)}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => toggleHabit(habit.id)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              isDoneToday
                ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {isDoneToday ? "✓ Done" : "Complete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HabitItem;