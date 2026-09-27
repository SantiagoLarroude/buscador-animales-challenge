# Roadmap de mejoras

Este documento reúne únicamente mejoras futuras. La funcionalidad entregada, sus límites y la evidencia de validación están documentados en el [README](../README.md) y en los [casos de uso verificados](casos-de-uso-verificados.md).

## Estado actual

| Capacidad | Estado |
| --- | --- |
| Autenticación JWT y rutas protegidas | Implementada |
| Filtros combinables y validación | Implementada |
| Ordenamiento accesible | Implementado |
| Exportación CSV UTF-8 | Implementada |
| Exportación Excel `.xlsx` | Implementada |
| Tests backend/frontend y build | Implementados |
| CI en Node 20 y 22 | Implementada |

## Mejoras futuras priorizadas

### 1. Migración controlada a React Router 7

**Objetivo:** resolver las alertas moderadas asociadas a React Router 6.30.6.

**Alcance:**

- Migrar rutas, redirecciones y navegación autenticada.
- Verificar login, logout, historial y rutas de visitante.
- Ejecutar regresión responsive y de accesibilidad.

**Criterio de aceptación:** `npm run check` y la auditoría deben quedar verdes sin introducir regresiones de navegación.

### 2. Tema claro y oscuro

**Objetivo:** permitir elegir la apariencia sin agregar controles incompletos.

**Alcance:**

- Convertir los colores actuales en tokens semánticos.
- Respetar `prefers-color-scheme` como valor inicial.
- Persistir la preferencia local.
- Verificar contraste, foco, tabla, chips y estados de error.

### 3. Internacionalización español/inglés

**Objetivo:** externalizar todos los textos y formatos antes de mostrar un selector de idioma.

**Alcance:** interfaz, validaciones, mensajes de error, encabezados de exportación y documentación de uso.

### 4. Ficha de detalle del animal

**Objetivo:** mostrar información ampliada sin sobrecargar la tabla.

**Alcance:** modal accesible, foco controlado, cierre con `Escape` y contenido responsive.

### 5. Búsqueda reactiva opcional

**Objetivo:** permitir búsqueda con debounce manteniendo una experiencia predecible.

**Alcance:** cancelación de peticiones anteriores, indicador de carga y conservación del botón explícito como alternativa.

### 6. Persistencia relacional

**Objetivo:** preparar el proyecto para mayor volumen o despliegues multiinstancia.

**Alcance:** repositorio de datos intercambiable, migración desde JSON y pruebas de compatibilidad. SQLite sería la primera opción por su instalación simple.

## Principios para futuras iteraciones

- Preservar los contratos HTTP existentes o versionar cualquier ruptura.
- Agregar cobertura automatizada para cada comportamiento nuevo.
- No publicar secretos ni datos runtime.
- Mantener instalación limpia, build y auditoría dentro del gate de entrega.
