# Backend del Buscador de Animales

Iniciar el proyecto con:

```bash
node server.js
# O si instalaste nodemon:
npx nodemon server.js
```

Flujo de prueba rápida con Postman / Thunder Client:

```http
POST http://localhost:3000/api/auth/signup 
{
        "email": "test@example.com", 
        "password": "password123" 
}
```

```http
POST http://localhost:3000/api/auth/login
{
        "email": "test@example.com", 
        "password": "password123" 
}
```

con las mismas credenciales → Copiar el token de respuesta.

```http
GET http://localhost:3000/api/animales
```

agregando el Header Authorization: `Bearer <TU_TOKEN>` y query params opcionales como `?continente=África&enPeligro=true`
