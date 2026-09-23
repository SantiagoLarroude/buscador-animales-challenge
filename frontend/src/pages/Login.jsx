import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import apiFetch from '../api/client.js';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const registeredMessage = location.state?.registered
    ? '¡Cuenta creada con éxito! Ahora podés iniciar sesión.'
    : null;
  const sessionMessage = location.state?.sessionExpired
    ? 'Tu sesión venció o dejó de ser válida. Iniciá sesión nuevamente.'
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.token && response.user) {
        login(response.user, response.token);
        navigate('/animales');
      } else {
        setError('Respuesta inesperada del servidor');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🦁</span>
          <h2>Iniciar Sesión</h2>
          <p>Ingresá con tus credenciales para acceder al buscador</p>
        </div>
        {(registeredMessage || sessionMessage) && (
          <div className="alert alert-success" role="status">
            {registeredMessage || sessionMessage}
          </div>
        )}

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Ingresando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿No tenés una cuenta? <Link to="/signup">Registrate acá</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
