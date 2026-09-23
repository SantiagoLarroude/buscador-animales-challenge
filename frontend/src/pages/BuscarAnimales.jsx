import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { downloadAnimalsCsv } from '../utils/exportCsv.js';

const CLASES = ['Mamífero', 'Ave', 'Reptil', 'Anfibio', 'Pez', 'Insecto'];
const DIETAS = ['Carnívoro', 'Herbívoro', 'Omnívoro'];
const CONTINENTES = ['África', 'América', 'Oceanía', 'Asia', 'Europa', 'Antártida'];
const NUMERIC_SORT_KEYS = new Set(['pesoPromedioKg', 'esperanzaVidaAnios']);

function SortableHeader({ label, sortKey, sortConfig, onSort, className }) {
  const isActive = sortConfig.key === sortKey;
  const directionLabel = isActive && sortConfig.direction === 'asc' ? '▲' : '▼';

  return (
    <th className={className} aria-sort={isActive ? (sortConfig.direction === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" className="sort-button" onClick={() => onSort(sortKey)}>
        {label}
        <span aria-hidden="true" className="sort-indicator">{isActive ? directionLabel : '↕'}</span>
      </button>
    </th>
  );
}

export default function BuscarAnimales() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [clase, setClase] = useState('');
  const [dieta, setDieta] = useState('');
  const [continente, setContinente] = useState('');
  const [pesoMin, setPesoMin] = useState('');
  const [pesoMax, setPesoMax] = useState('');
  const [enPeligro, setEnPeligro] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'nombreComun', direction: 'asc' });

  const fetchAnimals = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
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
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { sessionExpired: true } });
        return;
      }
      setError(err.message || 'Error al obtener animales');
    } finally {
      setLoading(false);
    }
  }, [nombre, clase, dieta, continente, pesoMin, pesoMax, enPeligro, logout, navigate]);

  useEffect(() => {
    fetchAnimals();
  }, []); // La búsqueda inicial debe ejecutarse sólo al montar la ruta protegida.

  const sortedResults = useMemo(() => {
    const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true });
    return [...results].sort((first, second) => {
      const firstValue = first[sortConfig.key];
      const secondValue = second[sortConfig.key];
      const comparison = NUMERIC_SORT_KEYS.has(sortConfig.key)
        ? Number(firstValue) - Number(secondValue)
        : collator.compare(String(firstValue), String(secondValue));
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [results, sortConfig]);

  const validateFilters = () => {
    const min = pesoMin === '' ? null : Number(pesoMin);
    const max = pesoMax === '' ? null : Number(pesoMax);
    if ((min !== null && (!Number.isFinite(min) || min < 0)) ||
        (max !== null && (!Number.isFinite(max) || max < 0))) {
      return 'Los pesos deben ser números mayores o iguales a 0.';
    }
    if (min !== null && max !== null && min > max) {
      return 'El peso mínimo no puede ser mayor que el peso máximo.';
    }
    return null;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const validationError = validateFilters();
    if (validationError) {
      setError(validationError);
      return;
    }
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

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const hasActiveFilters = Boolean(
    nombre || clase || dieta || continente || pesoMin !== '' || pesoMax !== '' || enPeligro
  );

  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <section className="search-section card" aria-labelledby="filters-title">
          <div className="section-header">
            <h2 id="filters-title">Filtros de Búsqueda</h2>
            <p className="text-muted">
              Filtrá el catálogo de fauna por múltiples atributos simultáneamente
            </p>
          </div>

          <form onSubmit={handleSubmit} className="filters-form" aria-busy={loading}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="filter-nombre">Nombre común</label>
                <input
                  id="filter-nombre"
                  type="text"
                  placeholder="Ej: León, Delfín..."
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="filter-clase">Clase</label>
                <select id="filter-clase" value={clase} onChange={(event) => setClase(event.target.value)}>
                  <option value="">Todas las clases</option>
                  {CLASES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-dieta">Dieta</label>
                <select id="filter-dieta" value={dieta} onChange={(event) => setDieta(event.target.value)}>
                  <option value="">Todas las dietas</option>
                  {DIETAS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-continente">Continente</label>
                <select id="filter-continente" value={continente} onChange={(event) => setContinente(event.target.value)}>
                  <option value="">Todos los continentes</option>
                  {CONTINENTES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-pesomin">Peso mín. (kg)</label>
                <input
                  id="filter-pesomin"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={pesoMin}
                  onChange={(event) => setPesoMin(event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="filter-pesomax">Peso máx. (kg)</label>
                <input
                  id="filter-pesomax"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="5000"
                  value={pesoMax}
                  onChange={(event) => setPesoMax(event.target.value)}
                />
              </div>
            </div>

            <div className="checkbox-row">
              <label className="checkbox-label" htmlFor="filter-enpeligro">
                <input
                  id="filter-enpeligro"
                  type="checkbox"
                  checked={enPeligro}
                  onChange={(event) => setEnPeligro(event.target.checked)}
                />
                <span>⚠️ Mostrar solo especies en peligro de extinción</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={loading}>
                🔍 {loading ? 'Buscando...' : 'Aplicar Filtros'}
              </button>
              {hasActiveFilters && (
                <button type="button" onClick={handleReset} className="btn btn-secondary" disabled={loading}>
                  Limpiar Filtros
                </button>
              )}
            </div>
          </form>
        </section>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <section className="results-section card" aria-labelledby="results-title" aria-busy={loading}>
          <div className="results-header">
            <h3 id="results-title">Catálogo de Animales</h3>
            <div className="results-actions">
              <span className="results-badge">
                {results.length} {results.length === 1 ? 'resultado' : 'resultados'}
              </span>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => downloadAnimalsCsv(sortedResults)}
                disabled={loading || sortedResults.length === 0}
              >
                Exportar CSV
              </button>
            </div>
          </div>

          {loading ? (
            <div className="loading-state" role="status" aria-live="polite">
              <div className="spinner" aria-hidden="true"></div>
              <p>Consultando base de datos...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state" role="status">
              <span className="empty-icon" aria-hidden="true">🍃</span>
              <h4>No se encontraron animales</h4>
              <p>Probá modificando los criterios de búsqueda o limpiando los filtros.</p>
              {hasActiveFilters && (
                <button onClick={handleReset} className="btn btn-secondary btn-sm">
                  Restablecer filtros
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive" tabIndex="0" aria-label="Resultados desplazables horizontalmente">
              <table className="animals-table">
                <caption className="sr-only">Resultados del buscador de animales</caption>
                <thead>
                  <tr>
                    <SortableHeader label="Especie" sortKey="nombreComun" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Clase" sortKey="clase" sortConfig={sortConfig} onSort={handleSort} />
                    <SortableHeader label="Dieta" sortKey="dieta" sortConfig={sortConfig} onSort={handleSort} />
                    <th scope="col">Hábitat</th>
                    <th scope="col">Continente</th>
                    <SortableHeader label="Peso Promedio" sortKey="pesoPromedioKg" sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                    <SortableHeader label="Esperanza de Vida" sortKey="esperanzaVidaAnios" sortConfig={sortConfig} onSort={handleSort} className="text-right" />
                    <th scope="col">Estado de Conservación</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedResults.map((animal) => (
                    <tr key={animal.id}>
                      <td>
                        <div className="animal-names">
                          <span className="animal-common">{animal.nombreComun}</span>
                          <span className="animal-scientific">{animal.nombreCientifico}</span>
                        </div>
                      </td>
                      <td><span className="badge badge-neutral">{animal.clase}</span></td>
                      <td><span className="badge badge-info">{animal.dieta}</span></td>
                      <td>{animal.habitat}</td>
                      <td><span className="badge badge-outline">{animal.continente}</span></td>
                      <td className="text-right"><strong>{animal.pesoPromedioKg}</strong> kg</td>
                      <td className="text-right"><strong>{animal.esperanzaVidaAnios}</strong> años</td>
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
