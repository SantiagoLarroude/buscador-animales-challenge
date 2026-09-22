import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigate, Link } from 'react-router-dom';
import apiFetch from '../api/client.js';

function Signup() {
export default function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      navigate('/login');
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(err.message || 'Error al registrar');
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: 'auto', padding: '1rem' }}>
      <h2>Registro</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label><br/>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🐾</span>
          <h2>Crear Cuenta</h2>
          <p>Registrate para acceder al catálogo de animales</p>
        </div>
        <div>
          <label>Contraseña:</label><br/>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña (mínimo 6 caracteres)</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary btn-block">
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            ¿Ya tenés una cuenta? <Link to="/login">Iniciá sesión acá</Link>
          </p>
        </div>
        <button type="submit" disabled={loading} style={{ marginTop: '1rem' }}>
          {loading ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
      </div>
    </div>
  );
}

export default Signup;

