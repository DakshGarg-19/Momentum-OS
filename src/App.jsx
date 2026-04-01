// BUG FIX 21: App.jsx imported HabitProvider but never used it.
// The Provider is already correctly placed in main.jsx wrapping <App />.
// Importing it here is dead code and causes a misleading read of the tree.
import Dashboard from "./pages/Dashboard";

function App() {
  return <Dashboard />;
}

export default App;
