# Guía de instalación

Esta guía permite instalar, validar y ejecutar el Buscador de Animales en una máquina sin configuración previa del proyecto.

## Entorno soportado y verificado

| Elemento | Mínimo soportado | Verificado el 2026-09-23 |
| --- | --- | --- |
| Node.js | `20.19.0` o `22.12.0` | `22.23.2` en Windows 11 x64 |
| npm | `10` | `11.16.0` |
| Git | Versión reciente | Requerido para clonar |
| Navegador | Chrome, Edge o Firefox moderno | Chrome en escritorio y viewport 390×844 |

No se requiere Docker ni una base de datos externa.

## 1. Clonar e instalar

### PowerShell

```powershell
git clone https://github.com/SantiagoLarroude/buscador-animales-challenge.git
Set-Location buscador-animales-challenge
npm ci --prefix backend
npm ci --prefix frontend
```

### Bash, zsh o sh

```bash
git clone https://github.com/SantiagoLarroude/buscador-animales-challenge.git
cd buscador-animales-challenge
npm ci --prefix backend
npm ci --prefix frontend
```

Desde la raíz, `npm run install:all` ejecuta los dos `npm ci` anteriores. Se usa `npm ci`, no `npm install`, para respetar exactamente los lockfiles.

## 2. Configurar variables

### PowerShell

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

### Bash, zsh o sh

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Editá `backend/.env`:

```dotenv
PORT=3000
JWT_SECRET=reemplazar_por_un_valor_aleatorio_largo_y_unico
CLIENT_ORIGIN=http://localhost:5173
```

`JWT_SECRET` es obligatorio. Debe ser un valor largo, aleatorio y distinto del ejemplo; no lo publiques ni lo confirmes en Git. `CLIENT_ORIGIN` debe coincidir exactamente con el origen del frontend, sin `/` final.

El archivo `frontend/.env` debe contener:

```dotenv
VITE_API_URL=http://localhost:3000/api
```

Variables opcionales del backend:

- `PORT`: cambia el puerto de Express; si lo modificás, actualizá también `VITE_API_URL`.
- `DB_DIR`: ruta absoluta a un directorio que contenga `animals.json` y `users.json`. Los tests la usan para no tocar datos de desarrollo.

## 3. Iniciar la aplicación

Abrí dos terminales en la raíz del repositorio.

Terminal 1 — API:

```powershell
npm run backend
```

Terminal 2 — frontend:

```powershell
npm run frontend
```

Los mismos comandos funcionan en shells Unix. Las URLs esperadas son:

- API: <http://localhost:3000>
- Health check: <http://localhost:3000/health>
- Frontend: <http://localhost:5173>

## 4. Verificar la comunicación

### PowerShell

```powershell
Invoke-RestMethod http://localhost:3000/health
```

### Bash, zsh o sh

```bash
curl --fail http://localhost:3000/health
```

Respuesta esperada:

```json
{
  "status": "OK",
  "message": "Servidor Express corriendo correctamente"
}
```

Después abrí <http://localhost:5173>, registrá una cuenta ficticia y verificá que el login lleve a `/animales`. Si el frontend carga pero las operaciones fallan, revisá `VITE_API_URL`, `CLIENT_ORIGIN` y las consolas de ambas terminales.

## 5. Ejecutar la validación completa

```powershell
npm run check
npm run audit
```

`npm run check` ejecuta las suites backend/frontend y el build de producción. `npm run audit` falla si encuentra una vulnerabilidad alta o crítica. Dos alertas moderadas de React Router 6.30.6 están documentadas y aceptadas para esta entrega CSR; no se ocultan ni se clasifican como cero vulnerabilidades.

También se pueden ejecutar partes por separado:

```powershell
npm run test:backend
npm run test:frontend
npm run build
```

## Problemas frecuentes

### Puerto 3000 o 5173 ocupado

En PowerShell:

```powershell
Get-NetTCPConnection -LocalPort 3000,5173 -State Listen | Select-Object LocalPort,OwningProcess
```

Cerrá sólo el proceso que hayas identificado como propio. Como alternativa, cambiá `PORT` y `VITE_API_URL`; para Vite podés usar `npm run frontend -- --port 5174` y ajustar `CLIENT_ORIGIN`.

En Unix:

```bash
lsof -i :3000
lsof -i :5173
```

### `JWT_SECRET es obligatorio`

Falta `backend/.env`, está mal ubicado o no contiene un valor. Copiá el ejemplo, reemplazá el placeholder y reiniciá el backend.

### Error de CORS

Confirmá que `CLIENT_ORIGIN` coincida con la URL visible del frontend. `http://localhost:5173` y `http://127.0.0.1:5173` son orígenes distintos. Reiniciá Express después de modificar `.env`.

### Sesión vencida o token inválido

La UI elimina la sesión local, redirige a `/login` y muestra un aviso. Iniciá sesión de nuevo. Para una limpieza manual, eliminá las claves `token` y `user` del almacenamiento local del sitio; no pegues tokens en capturas ni tickets.

### Email duplicado

El archivo `backend/database/users.json` persiste registros entre reinicios. Usá otro email ficticio, por ejemplo `demo+AAAAMMDD-2@customswatch.test`. No edites ni borres el archivo mientras el servidor escribe.

### `npm ci` falla con `EPERM` en Windows

Cerrá Vite, tests en modo watch y procesos Node de este repositorio; un binario nativo de Rollup/Rolldown puede quedar cargado. Identificá el PID exacto antes de detenerlo y repetí `npm run install:all`. El caso se reprodujo y resolvió durante la verificación del 2026-09-23.

### Dependencias inconsistentes o build extraño

Detené los servidores y ejecutá nuevamente:

```powershell
npm ci --prefix backend
npm ci --prefix frontend
npm run check
```

No borres lockfiles. Si la descarga desde npm falla por red, reintentá cuando haya conectividad; no sustituyas paquetes manualmente.

### Datos ausentes o JSON inválido

`backend/database/animals.json` debe existir y contener un array JSON. Los errores de datos no se reemplazan silenciosamente por un catálogo vacío. Recuperá el archivo versionado con Git sólo después de confirmar que no hay cambios locales que deban conservarse.

## Actualización limpia

Guardá o confirmá primero cualquier cambio propio. Luego:

```powershell
git pull --ff-only
npm run install:all
npm run check
```

En Unix los comandos son idénticos. `--ff-only` evita crear un merge accidental durante una actualización de entrega.

## Estructura resumida

```text
backend/
  database/              catálogo y usuarios JSON
  src/controllers/       autenticación y filtros
  src/middlewares/       validación JWT
  src/routes/            rutas Express
  src/utils/db.js        acceso JSON atómico y serializado
  test/api.test.js       integración HTTP
frontend/
  src/api/               cliente HTTP y errores normalizados
  src/context/           sesión local
  src/pages/             registro, login y buscador
  src/test/              componentes y CSV
  src/utils/             exportación CSV
docs/                    documentación de entrega
.github/workflows/       CI para Node 20 y 22
```
