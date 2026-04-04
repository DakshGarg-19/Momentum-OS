import { MomentumProvider } from './context/MomentumContext';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <MomentumProvider>
      <Dashboard />
    </MomentumProvider>
  );
}

export default App;
