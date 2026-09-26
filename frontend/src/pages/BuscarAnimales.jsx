import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import apiFetch from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getChipToneClass } from '../utils/chipTones.js';
import { downloadAnimalsCsv } from '../utils/exportCsv.js';
import { downloadAnimalsXlsx } from '../utils/exportXlsx.js';

const CLASES = ['Mamífero', 'Ave', 'Reptil', 'Anfibio', 'Pez', 'Insecto'];
const DIETAS = ['Carnívoro', 'Herbívoro', 'Omnívoro'];
const CONTINENTES = ['África', 'América', 'Oceanía', 'Asia', 'Europa', 'Antártida'];
const NUMERIC_SORT_KEYS = new Set(['pesoPromedioKg', 'esperanzaVidaAnios']);
const EMPTY_FILTERS = Object.freeze({
  nombre: '',
  clase: '',
  dieta: '',
  continente: '',
  pesoMin: '',
  pesoMax: '',
  enPeligro: false,
});

function normalizeNumberFilter(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  const numericValue = Number(trimmed);
  return Number.isFinite(numericValue) ? String(numericValue) : trimmed;
}

function normalizeFilters(filters) {
  return {
    nombre: String(filters.nombre ?? '').trim(),
    clase: filters.clase || '',
    dieta: filters.dieta || '',
    continente: filters.continente || '',
    pesoMin: normalizeNumberFilter(filters.pesoMin),
    pesoMax: normalizeNumberFilter(filters.pesoMax),
    enPeligro: Boolean(filters.enPeligro),
  };
}

function filtersAreEqual(first, second) {
  return JSON.stringify(normalizeFilters(first)) === JSON.stringify(normalizeFilters(second));
}

function hasActiveFilters(filters) {
  const normalized = normalizeFilters(filters);
  return Boolean(
    normalized.nombre || normalized.clase || normalized.dieta || normalized.continente ||
    normalized.pesoMin || normalized.pesoMax || normalized.enPeligro
  );
}

function SortableHeader({ label, sortKey, sortConfig, onSort, className }) {
  const isActive = sortConfig.key === sortKey;
  const isAscending = isActive && sortConfig.direction === 'asc';
  const directionLabel = isAscending ? '▲' : '▼';
  const nextDirection = isActive && isAscending ? 'descendente' : 'ascendente';
  const headerClassName = [className, isActive ? 'is-sorted' : ''].filter(Boolean).join(' ');

  return (
    <th className={headerClassName} aria-sort={isActive ? (isAscending ? 'ascending' : 'descending') : 'none'}>
      <button
        type="button"
        className="sort-button"
        onClick={() => onSort(sortKey)}
        aria-label={`${label}: ordenar ${nextDirection}`}
      >
        {label}
        <span aria-hidden="true" className={`sort-indicator ${isActive ? 'is-active' : ''}`}>
          {isActive ? directionLabel : (
            <span className="sort-pair"><span>▲</span><span>▼</span></span>
          )}
        </span>
      </button>
    </th>
  );
}

export default function BuscarAnimales() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exportingXlsx, setExportingXlsx] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'nombreComun', direction: 'asc' });

  const fetchAnimals = useCallback(async (requestedFilters) => {
    const normalizedFilters = normalizeFilters(requestedFilters);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (normalizedFilters.nombre) params.append('nombre', normalizedFilters.nombre);
      if (normalizedFilters.clase) params.append('clase', normalizedFilters.clase);
      if (normalizedFilters.dieta) params.append('dieta', normalizedFilters.dieta);
      if (normalizedFilters.continente) params.append('continente', normalizedFilters.continente);
      if (normalizedFilters.pesoMin !== '') params.append('pesoMin', normalizedFilters.pesoMin);
      if (normalizedFilters.pesoMax !== '') params.append('pesoMax', normalizedFilters.pesoMax);
      if (normalizedFilters.enPeligro) params.append('enPeligro', 'true');

      const queryString = params.toString();
      const endpoint = queryString ? `/animales?${queryString}` : '/animales';
      const data = await apiFetch(endpoint);
      setResults(data);
      setAppliedFilters(normalizedFilters);
      return true;
    } catch (err) {
      if (err.status === 401) {
        logout();
        navigate('/login', { replace: true, state: { sessionExpired: true } });
        return false;
      }
      setError(err.message || 'Error al obtener animales');
      return false;
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    fetchAnimals(EMPTY_FILTERS);
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

  const validateFilters = (filtersToValidate) => {
    const min = filtersToValidate.pesoMin === '' ? null : Number(filtersToValidate.pesoMin);
    const max = filtersToValidate.pesoMax === '' ? null : Number(filtersToValidate.pesoMax);
    if ((min !== null && (!Number.isFinite(min) || min < 0)) ||
        (max !== null && (!Number.isFinite(max) || max < 0))) {
      return 'Los pesos deben ser números mayores o iguales a 0.';
    }
    if (min !== null && max !== null && min > max) {
      return 'El peso mínimo no puede ser mayor que el peso máximo.';
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateFilters(filters);
    if (validationError) {
      setError(validationError);
      return;
    }
    await fetchAnimals(filters);
  };

  const handleReset = async () => {
    const emptyFilters = { ...EMPTY_FILTERS };
    setFilters(emptyFilters);
    await fetchAnimals(emptyFilters);
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleXlsxExport = async () => {
    setExportingXlsx(true);
    setError(null);
    try {
      await downloadAnimalsXlsx(sortedResults);
    } catch {
      setError('No se pudo generar el archivo Excel. Intentá nuevamente.');
    } finally {
      setExportingXlsx(false);
    }
  };

  const hasPendingChanges = !filtersAreEqual(filters, appliedFilters);
  const canClearFilters = hasActiveFilters(filters) || hasActiveFilters(appliedFilters);

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
                  value={filters.nombre}
                  onChange={(event) => updateFilter('nombre', event.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="filter-clase">Clase</label>
                <select
                  id="filter-clase"
                  value={filters.clase}
                  onChange={(event) => updateFilter('clase', event.target.value)}
                >
                  <option value="">Todas las clases</option>
                  {CLASES.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-dieta">Dieta</label>
                <select
                  id="filter-dieta"
                  value={filters.dieta}
                  onChange={(event) => updateFilter('dieta', event.target.value)}
                >
                  <option value="">Todas las dietas</option>
                  {DIETAS.map((value) => <option key={value} value={value}>{value}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="filter-continente">Continente</label>
                <select
                  id="filter-continente"
                  value={filters.continente}
                  onChange={(event) => updateFilter('continente', event.target.value)}
                >
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
                  value={filters.pesoMin}
                  onChange={(event) => updateFilter('pesoMin', event.target.value)}
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
                  value={filters.pesoMax}
                  onChange={(event) => updateFilter('pesoMax', event.target.value)}
                />
              </div>
            </div>

            <div className="checkbox-row">
              <label className="checkbox-label" htmlFor="filter-enpeligro">
                <input
                  id="filter-enpeligro"
                  type="checkbox"
                  checked={filters.enPeligro}
                  onChange={(event) => updateFilter('enPeligro', event.target.checked)}
                />
                <span>⚠️ Mostrar solo especies en peligro de extinción</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !hasPendingChanges}
              >
                🔍 {loading ? 'Buscando...' : 'Aplicar Filtros'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                disabled={loading || !canClearFilters}
              >
                Limpiar Filtros
              </button>
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
              <div className="export-actions">
                <button
                  type="button"
                  className="btn btn-export-csv btn-sm"
                  onClick={() => downloadAnimalsCsv(sortedResults)}
                  disabled={loading || exportingXlsx || sortedResults.length === 0}
                >
                  Exportar CSV
                </button>
                <button
                  type="button"
                  className="btn btn-export-excel btn-sm"
                  onClick={handleXlsxExport}
                  disabled={loading || exportingXlsx || sortedResults.length === 0}
                  aria-busy={exportingXlsx}
                >
                  {exportingXlsx ? 'Generando Excel...' : 'Exportar Excel (.xlsx)'}
                </button>
              </div>
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
              {canClearFilters && (
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
                      <td>
                        <span className={`badge badge-toned ${getChipToneClass('clase', animal.clase)}`}>
                          {animal.clase}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-toned ${getChipToneClass('dieta', animal.dieta)}`}>
                          {animal.dieta}
                        </span>
                      </td>
                      <td>{animal.habitat}</td>
                      <td>
                        <span className={`badge badge-toned ${getChipToneClass('continente', animal.continente)}`}>
                          {animal.continente}
                        </span>
                      </td>
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
