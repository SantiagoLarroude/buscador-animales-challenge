# 🚀 Especificación Técnica de Mejoras Futuras (Roadmap)

Este documento detalla el diseño de arquitectura y la guía paso a paso para implementar las mejoras y pluses propuestos para el **Buscador de Animales**, orientados a un estándar de calidad senior y adaptados a las necesidades analíticas de **CustomsWatch**.

---

## Índice de Mejoras Propuestas

1. [Exportación de Resultados a CSV](#1-exportación-de-resultados-a-csv)
2. [Ordenamiento Interactivo por Columnas (Sorting)](#2-ordenamiento-interactivo-por-columnas-sorting)
3. [Ficha Técnica / Modal de Detalle](#3-ficha-técnica--modal-de-detalle)
4. [Búsqueda Reactiva en Vivo con Debounce](#4-búsqueda-reactiva-en-vivo-con-debounce)
5. [Soporte para Base de Datos Relacional (SQLite)](#5-soporte-para-base-de-datos-relacional-sqlite)
6. [Pipeline de Integración Continua (CI con GitHub Actions)](#6-pipeline-de-integración-continua-ci-con-github-actions)

---

## 1. Exportación de Resultados a CSV

### Objetivo
Permitir a los analistas de CustomsWatch descargar el subconjunto de animales actualmente filtrados en formato CSV para su posterior análisis en Excel o herramientas de BI.

### Implementación Técnica en Frontend
1. **Función utilitaria `exportToCsv`:**
   - Convierte el array `results` en una cadena de texto separada por comas con encoding UTF-8 (incluyendo BOM `\uFEFF` para compatibilidad nativa con Microsoft Excel en español).
   - Crea un `Blob`, genera una URL temporal con `URL.createObjectURL(blob)` y dispara la descarga con un elemento `<a>` dinámico.
2. **Ubicación recomendada:** `frontend/src/utils/exportCsv.js`.
3. **Botón en UI:** Ubicado en la cabecera de la sección de resultados (`results-header` en `BuscarAnimales.jsx`).

```javascript
// Ejemplo de implementación de exportToCsv.js
export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    'sep=,\n' +
    keys.join(separator) +
    '\n' +
    rows
      .map(row => {
        return keys
          .map(k => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

## 2. Ordenamiento Interactivo por Columnas (Sorting)

### Objetivo
Permitir a los usuarios ordenar los resultados en orden ascendente y descendente haciendo clic en los encabezados de columna (`Nombre`, `Clase`, `Dieta`, `Peso`, `Esperanza de Vida`).

### Implementación Técnica
1. **Estado en `BuscarAnimales.jsx`:**
   ```javascript
   const [sortConfig, setSortConfig] = useState({ key: 'nombreComun', direction: 'asc' });
   ```
2. **Función de Orden:**
   - Si se hace clic en la misma columna, invierte la dirección (`asc` $\leftrightarrow$ `desc`).
   - Si se hace clic en otra columna, establece esa columna en `asc`.
3. **Cálculo memoizado con `useMemo`:**
   ```javascript
   const sortedResults = useMemo(() => {
     if (!sortConfig.key) return results;
     return [...results].sort((a, b) => {
       const aVal = a[sortConfig.key];
       const bVal = b[sortConfig.key];
       if (typeof aVal === 'string') {
         return sortConfig.direction === 'asc'
           ? aVal.localeCompare(bVal)
           : bVal.localeCompare(aVal);
       }
       return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
     });
   }, [results, sortConfig]);
   ```
4. **Indicador Visual en `<th>`:**
   - Mostrar iconos `▲` o `▼` según la columna activa.

---

## 3. Ficha Técnica / Modal de Detalle

### Objetivo
Visualizar información enriquecida del animal seleccionado (datos biológicos, estado de conservación ampliado y hábitat) sin saturar la tabla principal.

### Implementación Técnica
1. **Componente:** `frontend/src/components/AnimalDetailModal.jsx`.
2. **Accesibilidad (a11y):**
   - Manejo del evento `Escape` para cerrar.
   - Bloqueo de scroll en el body (`document.body.style.overflow = 'hidden'`) mientras esté abierto.
   - Enfoque accesible y atributos ARIA (`role="dialog"`, `aria-modal="true"`).
3. **Contenido:**
   - Título con `nombreComun` y `nombreCientifico`.
   - Grid de métricas clave: Barra gráfica para comparar peso respecto a la media del reino animal, indicador circular de esperanza de vida, mapa/tag de continente y hábitat.

---

## 4. Búsqueda Reactiva en Vivo con Debounce

### Objetivo
Eliminar la fricción de hacer clic en "Aplicar Filtros" en cada cambio, realizando la búsqueda conforme el usuario tipea el nombre o modifica los dropdowns.

### Implementación Técnica
1. **Hook personalizado `useDebounce`:**
   ```javascript
   // frontend/src/hooks/useDebounce.js
   import { useState, useEffect } from 'react';

   export function useDebounce(value, delay = 300) {
     const [debouncedValue, setDebouncedValue] = useState(value);
     useEffect(() => {
       const handler = setTimeout(() => setDebouncedValue(value), delay);
       return () => clearTimeout(handler);
     }, [value, delay]);
     return debouncedValue;
   }
   ```
2. **Integración:**
   - Disparar `fetchAnimals` en un `useEffect` que observe `debouncedNombre`, `clase`, `dieta`, `continente`, `pesoMin`, `pesoMax` y `enPeligro`.
   - El delay de 300ms evita saturar la API con peticiones innecesarias en cada pulsación de tecla.

---

## 5. Soporte para Base de Datos Relacional (SQLite)

### Objetivo
Cumplir con el "plus" explícito de la consigna (`"No hace falta una base de datos real... usarla es un plus"`), ofreciendo persistencia relacional SQL sin requerir instalaciones pesadas como PostgreSQL o MongoDB en la máquina del evaluador.

### Arquitectura Propuesta (Repository Pattern)
1. **Abstracción del Repositorio:**
   Crear una interfaz común `backend/src/repositories/`:
   - `json.repository.js` (implementación actual con archivos).
   - `sqlite.repository.js` (implementación con `better-sqlite3` o `sqlite3`).
2. **Selector dinámico vía `.env`:**
   ```javascript
   // backend/src/utils/db.js
   const driver = process.env.DB_DRIVER || 'json';
   const repository = driver === 'sqlite' 
     ? require('../repositories/sqlite.repository')
     : require('../repositories/json.repository');

   module.exports = repository;
   ```
3. **Esquema Relacional SQLite:**
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY,
     email TEXT UNIQUE NOT NULL,
     passwordHash TEXT NOT NULL
   );

   CREATE TABLE IF NOT EXISTS animals (
     id INTEGER PRIMARY KEY,
     nombreComun TEXT NOT NULL,
     nombreCientifico TEXT NOT NULL,
     clase TEXT NOT NULL,
     habitat TEXT NOT NULL,
     dieta TEXT NOT NULL,
     pesoPromedioKg REAL NOT NULL,
     esperanzaVidaAnios INTEGER NOT NULL,
     continente TEXT NOT NULL,
     enPeligroExtincion INTEGER NOT NULL
   );
   ```

---

## 6. Pipeline de Integración Continua (CI con GitHub Actions)

### Objetivo
Asegurar que cada commit o Pull Request ejecute automáticamente las pruebas y verifique la compilación de la aplicación antes de cualquier despliegue.

### Configuración: `.github/workflows/ci.yml`
```yaml
name: CI Suite - CustomsWatch Challenge

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]

jobs:
  test-backend:
    name: Backend Tests (Node.js 22)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm run install:all
      - run: npm test

  build-frontend:
    name: Frontend Build (Vite)
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm run install:all
      - run: npm run build
```

---

*Documento preparado como guía de referencia técnica para el proyecto Buscador de Animales (CustomsWatch Challenge).*
