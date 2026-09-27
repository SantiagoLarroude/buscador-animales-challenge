import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import BuscarAnimales from './pages/BuscarAnimales.jsx';
import GuestRoute from './components/GuestRoute.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route
        path="/signup"
        element={
          <GuestRoute>
            <Signup />
          </GuestRoute>
        }
      />
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/animales"
        element={
          <ProtectedRoute>
            <BuscarAnimales />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={isAuthenticated ? <Navigate to="/animales" replace /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
export default App;
