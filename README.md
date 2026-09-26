# Buscador de Animales

Challenge fullstack de CustomsWatch para registrar usuarios, iniciar sesión y consultar un catálogo de animales mediante filtros combinables. La solución prioriza un arranque reproducible, contratos HTTP explícitos, persistencia JSON segura y una experiencia accesible.

## Funcionalidades

- Registro y login con contraseñas hasheadas y sesiones JWT de 2 horas.
- Ruta del buscador protegida; cierre de sesión y recuperación ante tokens ausentes, inválidos o vencidos.
- Catálogo de 30 animales con filtros por nombre, clase, dieta, continente, rango de peso y peligro de extinción.
- Estado de filtros explícito: aplicar sólo se habilita ante cambios pendientes y limpiar recupera inmediatamente el catálogo completo.
- Validación consistente en frontend y API, incluidos rangos y booleanos estrictos.
- Ordenamiento accesible ascendente/descendente por especie, clase, dieta, peso y esperanza de vida, con indicadores visibles y columna activa destacada.
- Exportación del subconjunto visible a CSV UTF-8 y a un archivo Excel `.xlsx` con encabezados, tipos y acentos preservados.
- Estados de carga, error y resultado vacío; chips pastel por categoría, navegación por teclado y diseño responsive.
- Tests de integración backend y tests de componentes/utilidades frontend.
- CI en Node 20 y 22 con instalación limpia, tests, build y auditoría de vulnerabilidades altas/críticas.

## Arquitectura

```text
React 18 + React Router + Axios
          │ HTTP/JSON + Bearer JWT
          ▼
Node.js + Express
          │ lecturas y escrituras serializadas/atómicas
          ▼
backend/database/*.json
```

La persistencia JSON respeta el alcance de la consigna y evita infraestructura externa. `DB_DIR` permite aislar los datos de test. Las escrituras de usuarios se serializan y se reemplaza el archivo sólo después de completar la escritura temporal.

## Stack y decisiones

| Capa | Tecnología |
| --- | --- |
| Frontend | React 18, React Router 6.30.6, Axios, Vite 8, write-excel-file 4.1.1 |
| Backend | Node.js, Express 4, JWT, bcryptjs, CORS, dotenv |
| Calidad | Node Test Runner, Supertest, Vitest 5, Testing Library, jsdom |
| CI | GitHub Actions, matriz Node 20.19 y 22 |

Se mantiene React Router 6.30.6 para evitar una migración mayor inmediatamente antes de la entrega. `npm audit` informa dos alertas moderadas asociadas a redirecciones/SSR; esta aplicación es CSR, usa rutas internas fijas y no construye redirecciones con entradas externas. No quedan vulnerabilidades altas ni críticas conocidas.

## Inicio rápido

Requisitos: Node.js `20.19+` o `22.12+` y npm `10+`.

```powershell
git clone https://github.com/SantiagoLarroude/buscador-animales-challenge.git
Set-Location buscador-animales-challenge
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
npm run install:all
```

Antes de iniciar, reemplazá `JWT_SECRET` en `backend/.env` por un valor aleatorio largo. Después abrí dos terminales desde la raíz:

```powershell
# Terminal 1
npm run backend

# Terminal 2
npm run frontend
```

- Frontend: <http://localhost:5173>
- Health check: <http://localhost:3000/health>
- API: <http://localhost:3000/api>

La guía completa, incluyendo comandos Unix y solución de problemas, está en [docs/guia-instalacion.md](docs/guia-instalacion.md).

## Variables de entorno

### `backend/.env`

| Variable | Requerida | Ejemplo seguro | Uso |
| --- | --- | --- | --- |
| `JWT_SECRET` | Sí | `reemplazar_por_un_valor_aleatorio_largo` | Firma y validación de JWT |
| `CLIENT_ORIGIN` | No | `http://localhost:5173` | Origen permitido por CORS |
| `PORT` | No | `3000` | Puerto de la API |
| `DB_DIR` | No | Ruta absoluta | Directorio alternativo de JSON; usado por tests |

### `frontend/.env`

| Variable | Requerida | Valor por defecto |
| --- | --- | --- |
| `VITE_API_URL` | No | `http://localhost:3000/api` |

Los archivos `.env` no se versionan. Los `.env.example` contienen sólo valores de referencia, nunca secretos reales.

## Comandos

| Comando | Acción |
| --- | --- |
| `npm run install:all` | Ejecuta `npm ci` en backend y frontend |
| `npm run backend` | Inicia Express con recarga |
| `npm run frontend` | Inicia Vite |
| `npm run test:backend` | Ejecuta 29 tests de integración backend |
| `npm run test:frontend` | Ejecuta 25 tests frontend |
| `npm test` | Ejecuta ambas suites |
| `npm run build` | Genera el build de producción del frontend |
| `npm run audit` | Falla ante vulnerabilidades altas o críticas |
| `npm run check` | Ejecuta todos los tests y el build |

## API

Todas las respuestas, incluidos los errores controlados, usan JSON con `message`. Los endpoints de animales requieren `Authorization: Bearer <token>`.

| Método | Endpoint | Cuerpo/query | Respuestas principales |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `200` con `status: "OK"` |
| `POST` | `/api/auth/signup` | `{ "email", "password" }` | `201`; `400` entrada inválida o duplicado |
| `POST` | `/api/auth/login` | `{ "email", "password" }` | `200` con token y usuario; `401` genérico |
| `GET` | `/api/animales` | filtros opcionales | `200` con array; `400` query inválida; `401/403` token |

Filtros de `/api/animales`:

- `nombre`: coincidencia parcial, sin distinguir mayúsculas.
- `clase`, `dieta`, `continente`: coincidencia exacta, sin distinguir mayúsculas.
- `pesoMin`, `pesoMax`: números mayores o iguales a cero; límites inclusivos.
- `enPeligro`: únicamente `true` o `false`.

Ejemplo:

```http
GET /api/animales?continente=África&pesoMin=100&enPeligro=true
Authorization: Bearer <token>
```

## Calidad y estado verificado

La validación local final se ejecuta con:

```powershell
npm run install:all
npm run check
npm run audit
```

El detalle de cada escenario, fecha, entorno, evidencia y estado está en [docs/casos-de-uso-verificados.md](docs/casos-de-uso-verificados.md). El workflow está definido en [`.github/workflows/ci.yml`](.github/workflows/ci.yml) y fue verificado en verde sobre Node 20.19 y 22 en el repositorio privado.

Limitaciones deliberadas:

- Persistencia JSON apropiada para el challenge, no para despliegues multiinstancia.
- Sin refresh token ni recuperación de contraseña.
- Los filtros se procesan en memoria sobre un catálogo pequeño.
- Las dos alertas moderadas de React Router se aceptan con exposición baja en esta CSR; se recomienda migrar en una iteración separada con regresión completa.

## Documentación

- [Guía de instalación y troubleshooting](docs/guia-instalacion.md)
- [Casos de uso verificados](docs/casos-de-uso-verificados.md)
- [Consigna original](docs/consigna_Customswatch.md)
- [Roadmap y mejoras futuras](docs/roadmap_mejoras.md)

## Demo en vivo (8–10 minutos)

### Checklist previa

- [ ] Ejecutar `npm run install:all` y `npm run check`.
- [ ] Confirmar `/health`, frontend en `:5173` y API en `:3000`.
- [ ] Revisar que `git status --short` esté vacío.
- [ ] Abrir GitHub Actions y la [matriz de casos](docs/casos-de-uso-verificados.md).
- [ ] Preparar `demo+AAAAMMDD@customswatch.test` con contraseña ficticia; nunca usar credenciales personales.
- [ ] Tener dos terminales visibles y el navegador al 100 % de zoom.

### Guion

1. **Introducción — 1 min.** Explicar el problema, el flujo y el esquema React → API Express → JSON. Señalar que JSON responde al alcance explícito de la consigna.
2. **Autenticación — 2 min.** Mostrar una validación de registro, crear la cuenta ficticia, intentar una contraseña incorrecta para ver el mensaje genérico e iniciar sesión correctamente. Destacar la ruta protegida.
3. **Búsqueda — 3 min.** Mostrar los 30 animales. Aplicar continente `África`, peligro activo y peso mínimo `100`: el resultado esperado es Elefante africano, Jirafa y León. Buscar luego un nombre inexistente y restablecer filtros. Explicar estados de carga/error y el contrato con la API.
4. **Plus — 1–2 min.** Ordenar por peso en ambos sentidos. Exportar el subconjunto visible a CSV y a `animales-filtrados-AAAA-MM-DD.xlsx`; abrir el Excel para comprobar encabezados en la primera fila, orden, tipos numéricos y acentos.
5. **Calidad y cierre — 1–2 min.** Mostrar `npm run check`, Actions y la matriz de casos. Cerrar sesión y resumir decisiones, límites y próximos pasos.

### Contingencias

- Sin red o GitHub no disponible: ejecutar `npm run check` y mostrar el workflow localmente.
- Email ya registrado: cambiar el sufijo de fecha, por ejemplo `demo+AAAAMMDD-2@customswatch.test`.
- Puerto ocupado: seguir la sección correspondiente de la [guía de instalación](docs/guia-instalacion.md#problemas-frecuentes).
- Si la descarga del navegador está restringida: mostrar los tests de CSV/XLSX y su contenido esperado en la matriz.
- Si un plus se retirara antes de entregar: eliminarlo tanto de este guion como del listado de funcionalidades.

## Estructura resumida

```text
backend/                 API, middleware, persistencia y tests
frontend/                aplicación React, estilos y tests
docs/                    consigna, instalación, casos y roadmap
.github/workflows/       integración continua
package.json             comandos coordinados del proyecto
```
