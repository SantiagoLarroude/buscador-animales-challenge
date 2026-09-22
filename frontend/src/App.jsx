import { Routes, Route, Navigate } from 'react-router-dom';
import Signup from './pages/Signup.jsx';
import Login from './pages/Login.jsx';
import BuscarAnimales from './pages/BuscarAnimales.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import { useAuth } from './context/AuthContext.jsx';

function App() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
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
        element={isAuthenticated ? <Navigate to="/animales" /> : <Navigate to="/login" />}
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
export default App;

