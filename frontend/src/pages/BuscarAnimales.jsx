import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import apiFetch from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import Navbar from '../components/Navbar.jsx';

const CLASES = ['Mamífero', 'Ave', 'Reptil', 'Anfibio', 'Pez', 'Insecto'];
const DIETAS = ['Carnívoro', 'Herbívoro', 'Omnívoro'];
const CONTINENTES = ['África', 'América', 'Oceanía', 'Asia', 'Europa', 'Antártida'];

export default function BuscarAnimales() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Filter fields
  // Filtros
  const [nombre, setNombre] = useState('');
  const [clase, setClase] = useState('');
  const [dieta, setDieta] = useState('');
  const [continente, setContinente] = useState('');
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [enPeligro, setEnPeligro] = useState(false);

  // Estados de datos
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (nombre) params.append('nombre', nombre);
    if (clase) params.append('clase', clase);
    if (dieta) params.append('dieta', dieta);
    if (continente) params.append('continente', continente);
    if (pesoMin) params.append('pesoMin', pesoMin);
    if (pesoMax) params.append('pesoMax', pesoMax);
    if (enPeligro) params.append('enPeligro', 'true');
    return params.toString();
  };

  const fetchAnimals = async () => {
  const fetchAnimals = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const query = buildQuery();
      const endpoint = query ? `/animales?${query}` : '/animales';
      const params = new URLSearchParams();

      const n = filters.nombre !== undefined ? filters.nombre : nombre;
      const c = filters.clase !== undefined ? filters.clase : clase;
      const d = filters.dieta !== undefined ? filters.dieta : dieta;
      const cont = filters.continente !== undefined ? filters.continente : continente;
      const pMin = filters.pesoMin !== undefined ? filters.pesoMin : pesoMin;
      const pMax = filters.pesoMax !== undefined ? filters.pesoMax : pesoMax;
      const pDanger = filters.enPeligro !== undefined ? filters.enPeligro : enPeligro;

      if (n.trim()) params.append('nombre', n.trim());
      if (c) params.append('clase', c);
      if (d) params.append('dieta', d);
      if (cont) params.append('continente', cont);
      if (pMin !== '') params.append('pesoMin', pMin);
      if (pMax !== '') params.append('pesoMax', pMax);
      if (pDanger) params.append('enPeligro', 'true');

      const queryString = params.toString();
      const endpoint = queryString ? `/animales?${queryString}` : '/animales';
      const data = await apiFetch(endpoint);
      setResults(data);
    } catch (err) {
      setError(err.message || 'Error al obtener animales');
    } finally {
      setLoading(false);
    }
  };
  }, [nombre, clase, dieta, continente, pesoMin, pesoMax, enPeligro]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Fetch all animals on first render
  // Cargar todos los animales al montar
  useEffect(() => {
    fetchAnimals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAnimals();
  };

  const handleReset = () => {
    setNombre('');
    setClase('');
    setDieta('');
    setContinente('');
    setPesoMin('');
    setPesoMax('');
    setEnPeligro(false);
    fetchAnimals({
      nombre: '',
      clase: '',
      dieta: '',
      continente: '',
      pesoMin: '',
      pesoMax: '',
      enPeligro: false,
    });
  };

  const hasActiveFilters =
    Boolean(nombre) ||
    Boolean(clase) ||
    Boolean(dieta) ||
    Boolean(continente) ||
    pesoMin !== '' ||
    pesoMax !== '' ||
    enPeligro;

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Buscar Animales</h2>
        <button onClick={handleLogout}>Cerrar sesión</button>
      </div>
    <div className="app-layout">
      <Navbar />

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
          <input placeholder="Nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          <input placeholder="Clase" value={clase} onChange={(e) => setClase(e.target.value)} />
          <input placeholder="Dieta" value={dieta} onChange={(e) => setDieta(e.target.value)} />
          <input placeholder="Continente" value={continente} onChange={(e) => setContinente(e.target.value)} />
          <input placeholder="Peso mínimo" type="number" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} />
          <input placeholder="Peso máximo" type="number" value={pesoMax} onChange={(e) => setPesoMax(e.target.value)} />
          <label>
            <input type="checkbox" checked={enPeligro} onChange={(e) => setEnPeligro(e.target.checked)} /> En peligro
          </label>
        </div>
        <button type="submit" style={{ marginTop: '0.5rem' }}>Buscar</button>
      </form>
      <main className="main-content">
        <section className="search-section card">
          <div className="section-header">
            <h2>Filtros de Búsqueda</h2>
            <p className="text-muted">
              Filtrá el catálogo de fauna por múltiples atributos simultáneamente
            </p>
          </div>

      {loading && <p>Cargando...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
          <form onSubmit={handleSubmit} className="filters-form">
            <div className="form-grid">
              {/* Filtro de Texto: Nombre */}
              <div className="form-group">
                <label htmlFor="filter-nombre">Nombre común</label>
                <input
                  id="filter-nombre"
                  type="text"
                  placeholder="Ej: León, Delfín..."
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

      <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Clase</th>
            <th>Dieta</th>
            <th>Continente</th>
            <th>Peso (kg)</th>
            <th>En Peligro</th>
          </tr>
        </thead>
        <tbody>
          {results.length === 0 && !loading && <tr><td colSpan="6">No se encontraron animales.</td></tr>}
          {results.map((a, idx) => (
            <tr key={idx}>
              <td>{a.nombre}</td>
              <td>{a.clase}</td>
              <td>{a.dieta}</td>
              <td>{a.continente}</td>
              <td>{a.peso}</td>
              <td>{a.enPeligro ? 'Sí' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
              {/* Select: Clase */}
              <div className="form-group">
                <label htmlFor="filter-clase">Clase</label>
                <select
                  id="filter-clase"
                  value={clase}
                  onChange={(e) => setClase(e.target.value)}
                >
                  <option value="">Todas las clases</option>
                  {CLASES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select: Dieta */}
              <div className="form-group">
                <label htmlFor="filter-dieta">Dieta</label>
                <select
                  id="filter-dieta"
                  value={dieta}
                  onChange={(e) => setDieta(e.target.value)}
                >
                  <option value="">Todas las dietas</option>
                  {DIETAS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select: Continente */}
              <div className="form-group">
                <label htmlFor="filter-continente">Continente</label>
                <select
                  id="filter-continente"
                  value={continente}
                  onChange={(e) => setContinente(e.target.value)}
                >
                  <option value="">Todos los continentes</option>
                  {CONTINENTES.map((cont) => (
                    <option key={cont} value={cont}>
                      {cont}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rango de Peso Min */}
              <div className="form-group">
                <label htmlFor="filter-pesomin">Peso mín. (kg)</label>
                <input
                  id="filter-pesomin"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={pesoMin}
                  onChange={(e) => setPesoMin(e.target.value)}
                />
              </div>

              {/* Rango de Peso Max */}
              <div className="form-group">
                <label htmlFor="filter-pesomax">Peso máx. (kg)</label>
                <input
                  id="filter-pesomax"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="5000"
                  value={pesoMax}
                  onChange={(e) => setPesoMax(e.target.value)}
                />
              </div>
            </div>

            {/* Checkbox: En peligro */}
            <div className="checkbox-row">
              <label className="checkbox-label" htmlFor="filter-enpeligro">
                <input
                  id="filter-enpeligro"
                  type="checkbox"
                  checked={enPeligro}
                  onChange={(e) => setEnPeligro(e.target.checked)}
                />
                <span>⚠️ Mostrar solo especies en peligro de extinción</span>
              </label>
            </div>

            {/* Botones de acción */}
            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                🔍 {loading ? 'Buscando...' : 'Aplicar Filtros'}
              </button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Mensaje de Error */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Sección de Resultados */}
        <section className="results-section card">
          <div className="results-header">
            <h3>Catálogo de Animales</h3>
            <span className="results-badge">
              {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
            </span>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Consultando base de datos...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">🍃</span>
              <h4>No se encontraron animales</h4>
              <p>Probá modificando los criterios de búsqueda o limpiando los filtros.</p>
              {hasActiveFilters && (
                <button onClick={handleReset} className="btn btn-secondary btn-sm">
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="animals-table">
                <thead>
                  <tr>
                    <th>Especie</th>
                    <th>Clase</th>
                    <th>Dieta</th>
                    <th>Hábitat</th>
                    <th>Continente</th>
                    <th>Peso Promedio</th>
                    <th>Esperanza de Vida</th>
                    <th>Estado de Conservación</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((animal) => (
                    <tr key={animal.id}>
                      <td>
                        <div className="animal-names">
                          <span className="animal-common">{animal.nombreComun}</span>
                          <span className="animal-scientific">{animal.nombreCientifico}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{animal.clase}</span>
                      </td>
                      <td>
                        <span className="badge badge-info">{animal.dieta}</span>
                      </td>
                      <td>{animal.habitat}</td>
                      <td>
                        <span className="badge badge-outline">{animal.continente}</span>
                      </td>
                      <td className="text-right">
                        <strong>{animal.pesoPromedioKg}</strong> kg
                      </td>
                      <td className="text-right">
                        <strong>{animal.esperanzaVidaAnios}</strong> años
                      </td>
                      <td>
                        {animal.enPeligroExtincion ? (
                          <span className="badge badge-danger">⚠️ En Peligro</span>
                        ) : (
                          <span className="badge badge-success">✓ Estable</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

