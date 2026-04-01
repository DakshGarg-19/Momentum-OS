import { useForm } from "react-hook-form";
import { useHabit } from "../context/HabitContext";

const UNITS = ["Minutes", "Hours", "Reps", "Pages", "km"];
const CATEGORIES = ["Health", "Fitness", "Mindset", "Learning", "Creativity", "Productivity"];

const HabitForm = () => {
  const { addHabit } = useHabit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      unit: "Minutes",
      category: "Mindset",
      priority: "medium",
      startDate: new Date().toLocaleDateString("en-GB").split("/").join("-"),
    },
  });

  const onCommit = (values) => {
    const payload = {
      ...values,
      id: crypto.randomUUID(),
      completedDates: [],
      goalValue: Number(values.goalValue) || 0,
    };
    addHabit(payload);

    reset();
  };

  return (
    <form onSubmit={handleSubmit(onCommit)} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Habit Name
        </label>
        <input
          {...register("name", { required: "Please enter a name" })}
          placeholder="e.g. Morning Exercise"
          className={`w-full px-3 py-2 text-sm border rounded-md outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.name
              ? "border-red-400 bg-red-50"
              : "border-slate-300 bg-white"
          }`}
        />
        {errors.name && (
          <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Daily Goal
          </label>
          <input
            {...register("goalValue")}
            type="number"
            min="0"
            placeholder="30"
            className="w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Unit
          </label>
          <select
            {...register("unit")}
            className="w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Start Date
          </label>
          <input
            {...register("startDate")}
            type="date"
            className="w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md outline-none transition focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">
            Category
          </label>
          <select
            {...register("category")}
            className="w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md outline-none transition focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1">
          Motivation
        </label>
        <textarea
          {...register("motivation")}
          rows={3}
          placeholder="Why is this important to you?"
          className="w-full px-3 py-2 text-sm border border-slate-300 bg-white rounded-md outline-none transition resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-2">
          Priority Level
        </label>
        <div className="flex items-center gap-5">
          {["low", "medium", "high"].map((level) => (
            <label
              key={level}
              className="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer capitalize"
            >
              <input
                {...register("priority")}
                type="radio"
                value={level}
                className="accent-indigo-600"
              />
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-md transition-colors"
      >
        Create Habit
      </button>
    </form>
  );
};

export default HabitForm;