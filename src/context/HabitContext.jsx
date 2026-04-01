import { createContext, useContext, useState } from "react";

const HabitContext = createContext();

// BUG FIX 1: getToday was splitting on "T" and taking index [1] (the TIME part).
// It must take index [0] to get the date string "YYYY-MM-DD".
const getToday = () => new Date().toISOString().split("T")[0];

export const HabitProvider = ({ children }) => {
  // BUG FIX 2: useState() with no argument initializes habits as `undefined`.
  // An empty array [] is the correct default for a collection.
  const [habits, setHabits] = useState([]);
  const [showAll, setShowAll] = useState(false);

  const addHabit = (habit) => {
    const newHabit = {
      // BUG FIX 3: `Date.now` is a function reference, not an invocation.
      // Must be `Date.now()` to get the numeric timestamp as an ID.
      id: Date.now(),
      // BUG FIX 4: `completedDates: null` causes `.includes()` to crash with
      // "Cannot read properties of null". Must be an empty array [].
      completedDates: [],
      ...habit,
    };

    setHabits((prev) => [...prev, newHabit]);
  };

  const toggleHabit = (id) => {
    const today = getToday();

    setHabits((prev) =>
      prev.map((h) => {
        // BUG FIX 5: `if (h.id != id) return;` returns `undefined` for
        // non-matching habits, corrupting the entire habits array in state.
        // The correct logic is to return the unchanged habit `h`.
        if (h.id !== id) return h;

        const alreadyDone = h.completedDates.includes(today);

        return {
          ...h,
          completedDates: alreadyDone
            // BUG FIX 6: The filter condition was `d === today`, which keeps
            // ONLY today's date (the opposite of what un-toggling requires).
            // The correct condition is `d !== today` to REMOVE today's date.
            ? h.completedDates.filter((d) => d !== today)
            // BUG FIX 7: `Array.push()` mutates the array in place and returns
            // the new length (a number), not a new array. React cannot detect
            // this mutation and won't re-render. Use spread syntax instead.
            : [...h.completedDates, today],
        };
      }),
    );
  };

  const getStreak = (completedDates) => {
    let streak = 0;
    let currentDate = new Date();

    while (true) {
      const dateStr = currentDate.toISOString().split("T")[0];

      if (completedDates.includes(dateStr)) {
        streak++;
        // BUG FIX 8: Streak was going FORWARD in time (`getDate() + 1`),
        // which moves away from today into the future — those dates will never
        // be completed. A streak is consecutive PAST days, so we must go
        // BACKWARD: `getDate() - 1`.
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const updateHabit = (id, data) => {
    // BUG FIX 9 (minor): Using `==` (loose equality) for ID comparison can
    // cause subtle bugs when IDs are numbers. Strict equality `===` is safer.
    setHabits((prev) => prev.map((h) => (h.id === id ? data : h)));
  };

  const deleteHabit = (id) => {
    // BUG FIX 10: The filter condition was `h.id == id`, which KEEPS the habit
    // that matches the ID — deleting every OTHER habit instead. The correct
    // condition is `h.id !== id` to exclude the deleted habit.
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <HabitContext.Provider
      value={{
        habits,
        addHabit,
        toggleHabit,
        updateHabit,
        deleteHabit,
        getStreak,
        showAll,
        setShowAll,
      }}
    >
      {children}
    </HabitContext.Provider>
  );
};

// BUG FIX 11: `useContext()` was called with NO argument. It must receive the
// context object as its argument: `useContext(HabitContext)`.
export const useHabit = () => useContext(HabitContext);