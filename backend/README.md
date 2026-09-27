# Backend del Buscador de Animales

API REST construida con Node.js y Express. La configuración, instalación completa y resolución de problemas están centralizadas en el [README principal](../README.md) y la [guía de instalación](../docs/guia-instalacion.md).

## Inicio rápido

Desde la raíz del repositorio:

```powershell
Copy-Item backend/.env.example backend/.env
npm ci --prefix backend
npm run backend
```

Antes de iniciar, reemplazá el valor de ejemplo de `JWT_SECRET` en `backend/.env`. La API queda disponible en <http://localhost:3000> y el health check en <http://localhost:3000/health>.

## Endpoints

| Método | Ruta | Autenticación |
| --- | --- | --- |
| `POST` | `/api/auth/signup` | No |
| `POST` | `/api/auth/login` | No |
| `GET` | `/api/animales` | `Authorization: Bearer <token>` |

Los filtros opcionales de animales son `nombre`, `clase`, `dieta`, `continente`, `pesoMin`, `pesoMax` y `enPeligro`.

## Validación

Desde la raíz:

```powershell
npm run test:backend
```

El catálogo vive en `database/animals.json`. `database/users.json` se crea localmente en runtime y está ignorado por Git para no publicar cuentas ni hashes.
