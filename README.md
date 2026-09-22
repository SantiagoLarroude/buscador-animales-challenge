# 🐾 Buscador de Animales — Full-Stack Challenge (CustomsWatch)

Aplicación full-stack interactiva con autenticación de usuarios (registro y login con JWT) y buscador avanzado de un catálogo de fauna con filtros combinables, construida con **Node.js + Express** en el backend y **React (Vite)** en el frontend.

---

## 🛠️ Tecnologías y Arquitectura

* **Backend:**
  * **Runtime & Framework:** Node.js & Express
  * **Seguridad & Auth:** JSON Web Tokens (JWT) y cifrado unidireccional de contraseñas con `bcryptjs`
  * **CORS:** Configurado para comunicación segura con el cliente React
  * **Testing:** Suite de tests de integración con `supertest` y el ejecutor nativo `node:test` (Node.js 22+)
* **Frontend:**
  * **Core:** React 18 + Vite (SPA rápida con recarga en caliente HMR)
  * **Enrutamiento:** React Router v6 con rutas protegidas (`<ProtectedRoute>`)
  * **Estado Global:** Context API (`AuthContext`) para gestión centralizada de sesión y persistencia en `localStorage`
  * **Estilos:** CSS puro moderno con variables de diseño, diseño responsive (desktop y mobile), feedback de carga con spinner y estados vacíos
* **Persistencia:**
  * Base de datos en archivos JSON locales (`database/animals.json` y `database/users.json`), con inicialización automática en runtime y lecturas/escrituras atómicas seguras.

---

## 📂 Estructura del Proyecto

```text
/buscador-animales-challenge
  ├── README.md                     <-- Documentación general del proyecto
  ├── package.json                  <-- Scripts de conveniencia en la raíz
  ├── .gitignore                    <-- Exclusión de dependencias, builds y variables
  ├── /docs
  │     ├── consigna_Customswatch.md<-- Consigna original del challenge
  │     └── roadmap_mejoras.md      <-- Especificación técnica de mejoras futuras
  ├── /backend
  │     ├── /database
  │     │     ├── animals.json      <-- Dataset provisto de fauna
  │     │     └── users.json        <-- Usuarios registrados (creado dinámicamente)
  │     ├── /src
  │     │     ├── /controllers
  │     │     │     ├── animals.controller.js
  │     │     │     └── auth.controller.js
  │     │     ├── /middlewares
  │     │     │     └── auth.middleware.js
  │     │     ├── /routes
  │     │     │     ├── animals.routes.js
  │     │     │     └── auth.routes.js
  │     │     └── /utils
  │     │           └── db.js
  │     ├── /test
  │     │     └── api.test.js       <-- Suite de tests de integración (16 tests)
  │     ├── .env.example
  │     ├── server.js
  │     └── package.json
  └── /frontend
        ├── /src
        │     ├── /api
        │     │     └── client.js
        │     ├── /components
        │     │     ├── Navbar.jsx
        │     │     └── ProtectedRoute.jsx
        │     ├── /context
        │     │     └── AuthContext.jsx
        │     ├── /pages
        │     │     ├── BuscarAnimales.jsx
        │     │     ├── Login.jsx
        │     │     └── Signup.jsx
        │     ├── App.jsx
        │     ├── main.jsx
        │     └── index.css
        ├── .env.example
        ├── index.html
        ├── vite.config.js
        └── package.json
```

---

## 🚀 Guía de Instalación y Ejecución

### Requisitos previos
* **Node.js** v18 o superior (recomendado v20+)
* **npm** v9 o superior

### Opción A: Ejecución Rápida desde la Raíz (Recomendada)

1. **Instalar dependencias de backend y frontend:**
   ```bash
   npm run install:all
   ```

2. **Iniciar el Backend (en una terminal):**
   ```bash
   npm run backend
   ```
   *Disponible en `http://localhost:3000`*

3. **Iniciar el Frontend (en otra terminal):**
   ```bash
   npm run frontend
   ```
   *Disponible en `http://localhost:5173`*

---

### Opción B: Ejecución Manual Tradicional

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Tests Automatizados

El proyecto cuenta con una suite completa de **16 tests de integración automatizados** que validan todas las consignas del backend:

```bash
npm test
```
*(O desde la carpeta `backend`: `cd backend && npm test`)*

### Cobertura de la Suite:
* `GET /health`: Verificación de salud del servidor.
* `POST /api/auth/signup`:
  * Validación de formato de email (400).
  * Validación de contraseña mínima de 6 caracteres (400).
  * Registro exitoso con hash bcrypt (201).
  * Rechazo de emails duplicados (400).
* `POST /api/auth/login`:
  * Rechazo por usuario inexistente con mensaje genérico (401).
  * Rechazo por contraseña incorrecta con mensaje genérico (401).
  * Login exitoso con entrega de token JWT (200).
* `GET /api/animales`:
  * Rechazo sin token de autorización (401).
  * Rechazo con token inválido/manipulado (401).
  * Obtención completa de catálogo con token válido (200).
  * Filtro por búsqueda parcial de nombre común (`nombre`).
  * Filtro exacto por clase (`clase`).
  * Filtro exacto por dieta (`dieta`).
  * Filtro por rango numérico de peso (`pesoMin` y `pesoMax`).
  * Filtro por estado de peligro de extinción (`enPeligro=true`).

---

## 📋 Documentación de la API

### 1. Autenticación (`/api/auth`)

#### `POST /api/auth/signup`
Registra un nuevo usuario en `database/users.json`.
* **Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }
  ```
* **Respuesta exitosa (`201 Created`):**
  ```json
  { "message": "Usuario registrado correctamente." }
  ```

#### `POST /api/auth/login`
Autentica un usuario existente y genera un JWT.
* **Body:**
  ```json
  {
    "email": "usuario@ejemplo.com",
    "password": "password123"
  }
  ```
* **Respuesta exitosa (`200 OK`):**
  ```json
  {
    "message": "Login exitoso.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": { "id": 1726960000000, "email": "usuario@ejemplo.com" }
  }
  ```

---

### 2. Catálogo de Animales (`/api/animales`)

#### `GET /api/animales` *(Ruta Protegida)*
Devuelve los animales filtrados según los parámetros de consulta.
* **Headers:** `Authorization: Bearer <TOKEN_JWT>`
* **Query Params Disponibles (Opcionales y combinables entre sí):**
  * `nombre` *(string)*: Búsqueda parcial e insensible a mayúsculas sobre `nombreComun`.
  * `clase` *(string)*: Coincidencia exacta (`Mamífero`, `Ave`, `Reptil`, `Anfibio`, `Pez`, `Insecto`).
  * `dieta` *(string)*: Coincidencia exacta (`Carnívoro`, `Herbívoro`, `Omnívoro`).
  * `continente` *(string)*: Coincidencia exacta (`África`, `América`, `Oceanía`, `Asia`, `Europa`, `Antártida`).
  * `pesoMin` *(number)*: Filtro de peso promedio $\ge$ valor.
  * `pesoMax` *(number)*: Filtro de peso promedio $\le$ valor.
  * `enPeligro` *(string)*: `'true'` o `'false'`.
* **Ejemplo de consulta cURL:**
  ```bash
  curl -X GET "http://localhost:3000/api/animales?continente=África&enPeligro=true&pesoMin=100" \
    -H "Authorization: Bearer <TOKEN_JWT>"
  ```

---

## 💡 Decisiones Técnicas y Criterios de Diseño

1. **Seguridad en Autenticación:**
   * Las contraseñas se hashean utilizando `bcryptjs` con 10 rondas de salt antes de persistirlas.
   * Los tokens JWT firman la identidad del usuario y tienen tiempo de expiración (2 horas).
   * En el login, tanto el error de usuario inexistente como el de contraseña errónea responden con un mensaje genérico `401 ("Credenciales inválidas.")` para prevenir ataques de enumeración de cuentas.

2. **Persistencia Atómica y Resiliente:**
   * La utilidad `db.js` implementa `ensureDbExists()` que garantiza la creación del directorio `/database` y los archivos iniciales `users.json` sin romper la ejecución en entornos de despliegue limpios.
   * La escritura se realiza en formato JSON indentado para mantener la legibilidad y trazabilidad de los datos.

3. **Experiencia de Usuario (Frontend):**
   * **Dropdowns semánticos:** Se reemplazaron inputs de texto libre por `<select>` pre-poblados con las categorías reales del dataset (`clase`, `dieta`, `continente`).
   * **Mapeo completo de atributos:** La tabla expone todos los campos relevantes (nombres científicos, esperanza de vida, hábitats y badges visuales para especies en peligro).
   * **Navegación e Interacción:** Enlaces cruzados entre Login y Registro, navbar con información del usuario conectado, botón de reseteo rápido de filtros y contador dinámico de coincidencias.

---

## 🔮 Roadmap y Futuras Mejoras (Backlog Técnico)

Para ver el diseño y especificación técnica detallada de futuras mejoras, consultar [docs/roadmap_mejoras.md](file:///c:/Users/santi/Proyectos/buscador-animales-challenge/docs/roadmap_mejoras.md):

1. **📊 Exportación a CSV / Excel:** Descarga instantánea de los resultados filtrados para análisis aduanero/ecológico.
2. **↕️ Ordenamiento interactivo de columnas:** Sort ascendente y descendente por peso, nombre y esperanza de vida.
3. **🔍 Ficha Técnica / Modal de Detalle:** Vista expandida de cada animal con datos bio-geográficos y taxonomía.
4. **⚡ Búsqueda Reactiva con Debounce:** Filtrado en tiempo real mientras el usuario escribe (300ms debounce).
5. **🗄️ Persistencia Dual con Base de Datos Real (SQLite):** Adaptador de base de datos configurable vía `.env` (`DB_DRIVER=json` o `DB_DRIVER=sqlite`).
6. **🤖 CI/CD con GitHub Actions:** Pipeline automatizado para ejecutar tests y validaciones de build en cada push o pull request.
