import { useHabit } from "../context/HabitContext";
import HabitItem from "./HabitItem";

const HabitList = () => {
  const { habits, showAll, setShowAll } = useHabit();

  const today = new Date().toISOString().split("T")[0];

  const completedToday = habits.filter((h) =>
    h.completedDates.includes(today)
  ).length;

  const progressPercent =
    habits.length > 0
      ? Math.round((completedToday / habits.length) * 100)
      : 0;

  const categoryCount = habits.reduce((acc, h) => {
    const cat = h.category || "Uncategorised";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const mainFocus =
    Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).reduce((a, b) =>
          categoryCount[a] >= categoryCount[b] ? a : b
        )
      : "None";

  const highPriorityCount = habits.filter(
    (h) => h.priority === "high"
  ).length;

  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
          <span className="text-2xl">📋</span>
        </div>
        <p className="text-slate-600 font-semibold mb-1">No habits yet</p>
        <p className="text-slate-400 text-sm">
          Start your journey by adding a new habit above.
        </p>
      </div>
    );
  }

  const visibleHabits = showAll ? habits : habits.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-2">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
          Daily Progress
        </p>
        <div className="flex justify-between items-center">
          <p className="text-lg font-bold text-slate-800">
            {progressPercent >= 100
              ? "All done! 🎉"
              : progressPercent > 50
              ? "Keep going"
              : "Get started"}
          </p>
          <span className="text-sm font-semibold text-slate-500">
            {completedToday} / {habits.length}
          </span>
        </div>

        <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 pt-3 border-t border-slate-200">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Focus
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {mainFocus}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Priority
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">
              {highPriorityCount} High Tasks
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
        Your Routine
      </p>

      <div className="space-y-3">
        {visibleHabits.map((habit) => (
          <HabitItem key={habit.id} habit={habit} />
        ))}
      </div>

      {habits.length > 3 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {showAll ? "Show Less ↑" : `Show All (${habits.length}) ↓`}
        </button>
      )}
    </div>
  );
};

export default HabitList;