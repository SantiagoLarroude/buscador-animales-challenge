import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <span className="brand-icon">🐾</span>
          <span className="brand-text">Buscador de Animales</span>
        </div>
        <div className="navbar-user">
          {user?.email && (
            <span className="user-badge" title={user.email}>
              👤 {user.email}
            </span>
          )}
          <button onClick={handleLogout} className="btn btn-danger-soft btn-sm">
            Cerrar Sesión
          </button>
        </div>
      </div>
    </header>
  );
}
