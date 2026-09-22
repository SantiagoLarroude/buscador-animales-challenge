# 🐾 Buscador de Animales — Full-Stack Challenge (CustomsWatch)

Aplicación full-stack interactiva con autenticación de usuarios (registro y login con JWT) y buscador avanzado de un catálogo de fauna con filtros combinables, construida con **Node.js + Express** en el backend y **React (Vite)** en el frontend.

---

## 🛠️ Tecnologías y Arquitectura

* **Backend:**
  * Node.js & Express
  * Autenticación con JSON Web Tokens (JWT) y cifrado de contraseñas con `bcryptjs`
  * CORS habilitado para comunicación segura con el cliente
  * Suite de tests de integración automatizados con `supertest` y `node:test` (Node.js 22+)
* **Frontend:**
  * React 18 + Vite (SPA rápida y optimizada)
  * React Router v6 con rutas protegidas (`<ProtectedRoute>`)
  * Context API (`AuthContext`) para gestión centralizada de sesión y persistencia en `localStorage`
  * CSS puro moderno con variables de diseño, diseño responsive (desktop y mobile), feedback de carga con spinner y estados vacíos
* **Persistencia:**
  * Base de datos en archivos JSON locales (`database/animals.json` y `database/users.json`), con inicialización automática en runtime y lecturas/escrituras atómicas.

---

## 📂 Estructura del Proyecto

```text
/buscador-animales-challenge
  ├── README.md                     <-- Documentación principal
  ├── package.json                  <-- Scripts de conveniencia globales
  ├── .gitignore                    <-- Exclusión de dependencias, builds y variables
  ├── /docs
  │     └── consigna_Customswatch.md<-- Consigna original del challenge
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
* Node.js v18 o superior (recomendado v20+)
* npm v9 o superior

### Opción A: Ejecución Rápida desde la Raíz

1. **Instalar todas las dependencias (backend y frontend):**
   ```bash
   npm run install:all
   ```

2. **Iniciar el Backend:**
   ```bash
   npm run backend
   ```
   *(Disponible en `http://localhost:3000`)*

3. **Iniciar el Frontend (en otra terminal):**
   ```bash
   npm run frontend
   ```
   *(Disponible en `http://localhost:5173`)*

---

### Opción B: Ejecución Manual Tradicional

#### 1. Levantar Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Levantar Frontend
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
o desde el backend:
```bash
cd backend && npm test
```

### Cobertura de los tests:
* `GET /health`: Estado del servidor.
* `POST /api/auth/signup`:
  * Validación de formato de email (400).
  * Validación de longitud de contraseña $\ge 6$ caracteres (400).
  * Registro exitoso con hash bcrypt (201).
  * Rechazo de emails duplicados (400).
* `POST /api/auth/login`:
  * Rechazo por credenciales inexistentes con mensaje genérico (401).
  * Rechazo por contraseña errónea con mensaje genérico (401).
  * Login exitoso con entrega de token JWT (200).
* `GET /api/animales`:
  * Rechazo sin token de autorización (401).
  * Rechazo con token inválido/manipulado (401).
  * Obtención completa de catálogo con token válido (200).
  * Filtro por búsqueda parcial de nombre común.
  * Filtro exacto por clase.
  * Filtro exacto por dieta.
  * Filtro numérico por rango de peso (`pesoMin` y `pesoMax`).
  * Filtro por estado de peligro de extinción (`enPeligro=true`).

---

## 📋 Documentación de la API

### Autenticación (`/api/auth`)

#### `POST /api/auth/signup`
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
    "user": {
      "id": 1726960000000,
      "email": "usuario@ejemplo.com"
    }
  }
  ```

---

### Catálogo de Animales (`/api/animales`)

#### `GET /api/animales` *(Requiere autenticación)*
* **Headers:** `Authorization: Bearer <TOKEN_JWT>`
* **Query Params soportados (todos opcionales y combinables):**
  * `nombre` *(string)*: Búsqueda parcial insensible a mayúsculas/minúsculas sobre `nombreComun`.
  * `clase` *(string)*: Filtro exacto (`Mamífero`, `Ave`, `Reptil`, `Anfibio`, `Pez`, `Insecto`).
  * `dieta` *(string)*: Filtro exacto (`Carnívoro`, `Herbívoro`, `Omnívoro`).
  * `continente` *(string)*: Filtro exacto (`África`, `América`, `Oceanía`, `Asia`, `Europa`, `Antártida`).
  * `pesoMin` *(number)*: Peso mínimo en kg.
  * `pesoMax` *(number)*: Peso máximo en kg.
  * `enPeligro` *(string)*: `'true'` o `'false'`.
* **Ejemplo:**
  ```bash
  curl -X GET "http://localhost:3000/api/animales?continente=África&enPeligro=true&pesoMin=100" \
    -H "Authorization: Bearer <TOKEN_JWT>"
  ```

---

## 💡 Decisiones Técnicas y Criterios de Diseño

1. **Seguridad en Autenticación:**
   * Las contraseñas se hashean utilizando `bcryptjs` con salt rounds de 10. Nunca se almacenan ni viajan en texto plano.
   * Los tokens JWT tienen tiempo de expiración (2 horas) y firman la identidad del usuario.
   * En el login, las respuestas de credenciales incorrectas responden con un mensaje genérico `401 ("Credenciales inválidas.")` para evitar enumeración de cuentas.

2. **Persistencia Atómica y Resiliente:**
   * `db.js` implementa un helper `ensureDbExists()` que garantiza la creación del directorio `/database` y los archivos iniciales `users.json` sin romper la ejecución si se despliega en un entorno limpio.

3. **Experiencia de Usuario en Frontend:**
   * Formularios validados en tiempo real.
   * Dropdowns (`<select>`) pre-poblados con las categorías exactas del dominio biológico.
   * Tabla responsive completa con nombres comunes y científicos, tags para dietas y hábitats, y badges visuales para destacar especies en peligro de extinción.
   * Botón de reseteo rápido de filtros y contador dinámico de resultados.
