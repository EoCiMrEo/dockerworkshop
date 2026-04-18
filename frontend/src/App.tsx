import { AuthPanel } from './components/AuthPanel';
import { useAuth } from './context/AuthContext';
import { TodoDashboard } from './pages/TodoDashboard';

const App = () => {
  const { isAuthenticated } = useAuth();

  return <>{isAuthenticated ? <TodoDashboard /> : <AuthPanel />}</>;
};

export default App;
