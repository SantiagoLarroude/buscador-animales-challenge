# Casos de uso verificados

Esta matriz registra resultados ejecutados sobre la versión indicada en cada fila. **Aprobado** significa que existe evidencia automática o manual sobre esa versión; una implementación o inspección de código por sí sola no cuenta como aprobación.

## Registro de ejecuciones

| Ejecución | Fecha | Sistema | Versiones | Commit | Resultado |
| --- | --- | --- | --- | --- | --- |
| Instalación limpia | 2026-09-23 | Windows 11 x64 | Node 22.23.2; npm 11.16.0 | `9388bbe` (mismo lockfile) | `npm run install:all` completó tras cerrar Vite, que bloqueaba un binario nativo |
| Suite final local | 2026-09-24 | Windows 11 x64 | Node 22.23.2; npm 11.16.0; Vite 8.3.0; Vitest 5.0.1 | `9388bbe` | 29 backend + 14 frontend y build aprobados |
| Auditoría | 2026-09-24 | Windows 11 x64 | npm audit | `9388bbe` | 0 backend; 2 moderadas frontend; 0 altas/críticas |
| UAT visual | 2026-09-23 | Chrome, Windows 11 x64 | Desktop y viewport 390×844 | `9388bbe` (código de UI sin cambios desde UAT) | Flujo principal, orden, responsive y logout aprobados |
| CI remoto | 2026-09-24 | GitHub Actions Ubuntu | Node 20.19.0 y 22.x | `256018a` | [Run 36002901937](https://github.com/SantiagoLarroude/buscador-animales-challenge/actions/runs/36002901937) aprobado |
| Suite local CSV/XLSX | 2026-09-26 | Windows 11 x64 | Node 22.23.2; npm 11.16.0; Vite 8.3.0; Vitest 5.0.1 | Working tree sobre `05da18a` | 29 backend + 20 frontend y build aprobados |
| Auditoría post-XLSX | 2026-09-26 | Windows 11 x64 | npm audit | Working tree sobre `05da18a` | 0 backend; 2 moderadas frontend ya documentadas; 0 altas/críticas |
| UAT exportación XLSX | 2026-09-26 | Microsoft Excel, Windows 11 x64 | Versión de Excel no informada | Working tree sobre `05da18a` | El usuario confirmó que el archivo descargado abre y funciona correctamente |
| Suite final de interfaz | 2026-09-26 | Windows 11 x64 | Node 22.23.2; npm 11.16.0; Vite 8.3.0; Vitest 5.0.1 | Working tree sobre `ed57f2c` | 29 backend + 25 frontend y build aprobados |
| Auditoría post-interfaz | 2026-09-26 | Windows 11 x64 | npm audit | Working tree sobre `ed57f2c` | 0 backend; 2 moderadas frontend ya documentadas; 0 altas/críticas; sin dependencias nuevas |
| UAT visual de interfaz | 2026-09-26 | Chrome headless 153, Windows 11 x64 | Desktop 1382×904 y viewport 390×844 | Working tree sobre `ed57f2c` | Jerarquía de acciones, hover de logout, orden, chips y responsive aprobados |

Las cuentas y bases usadas por tests/UAT fueron temporales. No se publicaron secretos ni credenciales personales.

## Matriz

| ID | Precondiciones y datos | Pasos | Resultado esperado | Evidencia y tipo | Estado |
| --- | --- | --- | --- | --- | --- |
| AUTH-01 Registro válido | Base aislada; email único y contraseña ≥6 | `POST /api/auth/signup` | `201`, email normalizado y hash persistido | `api.test.js`: “registra un usuario válido…”; automática | Aprobado |
| AUTH-02 Email inválido | `correo-invalido` | Enviar registro | `400` JSON explicativo | `api.test.js`: “rechaza registros con email inválido”; automática | Aprobado |
| AUTH-03 Contraseña corta | Contraseña `123` | Enviar registro | `400`, mínimo 6 caracteres | `api.test.js`: “rechaza contraseñas…”; automática | Aprobado |
| AUTH-04 Email duplicado | Email previamente creado con distinto casing | Repetir registro | `400`, sin segundo usuario | Tests de duplicado y concurrencia; automática | Aprobado |
| AUTH-05 Login válido | Usuario registrado | Enviar credenciales correctas | `200`, JWT y usuario normalizado | Test backend + login real de UAT; mixta | Aprobado |
| AUTH-06 Credenciales inválidas | Usuario inexistente o contraseña errónea | Intentar login | `401` y mensaje genérico | 2 tests backend + UAT con contraseña errónea; mixta | Aprobado |
| AUTH-07 Ruta protegida | Sin sesión local | Abrir `/animales` | Redirección a `/login`, sin pedir catálogo | `app.test.jsx`: “redirige la ruta protegida…”; automática | Aprobado |
| AUTH-08 Token ausente | Sin `Authorization` | `GET /api/animales` | `401` JSON | Test backend; automática | Aprobado |
| AUTH-09 Token manipulado | Bearer inválido | Consultar catálogo | `401` JSON | Test backend; automática | Aprobado |
| AUTH-10 Token expirado | JWT firmado con expiración pasada | Consultar catálogo | `401`; UI limpia sesión y avisa | Tests backend/frontend; automática | Aprobado |
| AUTH-11 Almacenamiento corrupto | `user` no es JSON válido | Abrir `/animales` | Elimina sesión y vuelve al login | Test frontend; automática | Aprobado |
| AUTH-12 Logout | Sesión válida | Activar “Cerrar Sesión” | Elimina token/usuario y muestra login | Test frontend + UAT visual; mixta | Aprobado |
| CAT-01 Catálogo completo | JWT válido, sin query | Consultar `/api/animales` | 30 elementos | Test backend + UAT visual; mixta | Aprobado |
| CAT-02 Nombre | `nombre=LEÓN` | Aplicar filtro | Coincidencia parcial sin distinguir casing | Test backend; automática | Aprobado |
| CAT-03 Clase | `clase=Ave` | Aplicar filtro | Sólo clase Ave | Test backend; automática | Aprobado |
| CAT-04 Dieta | `dieta=Carnívoro` | Aplicar filtro | Sólo dieta Carnívoro | Test backend; automática | Aprobado |
| CAT-05 Continente | `continente=África` | Aplicar filtro | Sólo África | Test backend; automática | Aprobado |
| CAT-06 `enPeligro=true` | Query booleana válida | Aplicar filtro | Todos con peligro `true` | Test backend; automática | Aprobado |
| CAT-07 `enPeligro=false` | Query booleana válida | Aplicar filtro | Todos con peligro `false` | Test backend; automática | Aprobado |
| CAT-08 Rango inclusivo | `pesoMin=190&pesoMax=190` | Aplicar filtro | Incluye exactamente peso 190 | Test backend; automática | Aprobado |
| CAT-09 Combinación | África, peligro, peso mínimo 100 | Aplicar filtros | Elefante africano, Jirafa y León | Test backend + UAT visual; mixta | Aprobado |
| CAT-10 Parámetros inválidos | Peso texto/negativo; booleano desconocido | Consultar API | `400` JSON consistente | 3 tests backend; automática | Aprobado |
| CAT-11 Rango invertido | Mínimo 500, máximo 100 | Aplicar/consultar | UI no llama API; API devuelve `400` | Tests frontend/backend; automática | Aprobado |
| CAT-12 Sin resultados | Nombre inexistente | Aplicar filtro | Cero resultados, estado vacío y exportación deshabilitada | Test backend + UAT visual; mixta | Aprobado |
| CAT-13 Restablecer | Filtros activos | Activar limpiar/restablecer | Controles vacíos y catálogo completo | Test frontend + UAT visual; mixta | Aprobado |
| PLUS-01 Orden ascendente | Dos o más resultados | Activar encabezado Peso una vez | Menor a mayor; `aria-sort` coherente | Test frontend + UAT 190/800/5000; mixta | Aprobado |
| PLUS-02 Orden descendente | Orden ascendente activo | Activar mismo encabezado | Mayor a menor | Test frontend + UAT 5000/800/190; mixta | Aprobado |
| PLUS-03 CSV contenido | Subconjunto ordenado con `Ñ`, acentos, comas y comillas | Serializar | BOM UTF-8, encabezados españoles en la primera fila, escapes y orden conservado | `exportCsv.test.js`; automática | Aprobado |
| PLUS-04 CSV descarga | Uno o más resultados | Activar exportar | Nombre fechado, Blob y URL temporal liberada | Test de `downloadAnimalsCsv`; automática | Aprobado |
| PLUS-05 CSV vacío | Sin resultados | Intentar exportar | Botón deshabilitado/no descarga | Test unitario + UAT visual; mixta | Aprobado |
| PLUS-06 XLSX contenido | Subconjunto ordenado con `Ñ`, acentos y números | Generar Excel | Encabezados en fila 1, textos Unicode, pesos y años numéricos, fila fija y anchos legibles | `exportXlsx.test.js` + apertura en Excel; mixta | Aprobado |
| PLUS-07 XLSX descarga | Uno o más resultados | Activar “Exportar Excel (.xlsx)” | Archivo XLSX real, nombre fechado, orden visible conservado y URL temporal liberada | Tests de utilidad/componente + UAT del usuario; mixta | Aprobado |
| PLUS-08 XLSX error/vacío | Falla de generación o cero resultados | Exportar | Alerta accesible ante error; sin resultados no genera archivo | Tests de utilidad y componente; automática | Aprobado |
| UX-01 Carga | Respuesta pendiente | Abrir catálogo | Estado `role=status`, `aria-busy` y acciones deshabilitadas | Test frontend; automática | Aprobado |
| UX-02 Error de red | `fetch` rechaza | Abrir catálogo | Alerta accesible en español, sin crash | Test frontend; automática | Aprobado |
| UX-03 Respuesta no JSON | Error HTTP con texto plano | Abrir catálogo | Mensaje visible, sin error de parseo | Test frontend; automática | Aprobado |
| UX-04 Teclado | Catálogo cargado | Recorrer desde Nombre con Tab | Orden Nombre → Clase → Dieta → Continente | Test frontend; automática | Aprobado |
| UX-05 Responsive | Sesión válida | Abrir a 390×844 | Filtros apilados, cabecera utilizable y tabla desplazable | UAT visual Chrome; manual | Aprobado |
| UX-06 Estado de filtros | Catálogo inicial cargado | Editar, aplicar con éxito, provocar error y limpiar | Ambos botones parten deshabilitados; los cambios habilitan acciones; el éxito sincroniza; el error permite reintentar; limpiar consulta el catálogo | `app.test.jsx`; automática | Aprobado |
| UX-07 Jerarquía visual | Catálogo cargado | Revisar logout, CSV, Excel, flechas y chips | Colores diferenciados, hover rojo, columna activa visible, indicadores comprensibles y tonos estables por categoría/valor | Tests de componentes/utilidad + UAT desktop/mobile; mixta | Aprobado |
| QA-01 Instalación limpia | Servidores detenidos; lockfiles presentes | `npm run install:all` | Ambos `npm ci` completan | Registro de ejecución; manual/terminal | Aprobado |
| QA-02 Tests y build | Dependencias limpias | `npm run check` | 29 backend + 25 frontend + Vite build | Salida de suite final; automática | Aprobado |
| QA-03 Auditoría | Acceso a registry npm | `npm run audit` | Sin vulnerabilidades altas/críticas | 0 backend; 2 moderadas RR; automática | Aprobado con riesgo aceptado |
| QA-04 CI Node 20/22 | Repositorio privado publicado | Push a rama principal | Instalación, tests, build y audit verdes en ambas versiones | [GitHub Actions run 36002901937](https://github.com/SantiagoLarroude/buscador-animales-challenge/actions/runs/36002901937); automática | Aprobado |

## Riesgo aceptado de dependencias

React Router 6.30.6 mantiene dos avisos moderados:

1. redirección abierta mediante backslash en destinos controlados externamente;
2. inyección de constructor durante hidratación SSR.

La exposición actual es baja: esta solución es CSR, no hidrata errores SSR y navega únicamente a rutas internas literales (`/login`, `/signup`, `/animales`). La corrección disponible requiere React Router 7 y se difiere para no introducir una migración mayor sin una regresión específica. La CI sí bloquea alertas altas o críticas.

## Evidencia manual UAT

- Login inválido mostró “Credenciales inválidas.”; el válido abrió `/animales`.
- El catálogo inicial mostró 30 resultados.
- África + peligro + peso mínimo 100 devolvió Elefante africano, Jirafa y León.
- La búsqueda inexistente mostró estado vacío; restablecer devolvió los 30 resultados.
- El orden por peso se comprobó en ambas direcciones.
- Los encabezados inactivos mostraron `▲▼`; la columna activa mostró una sola flecha, fondo tenue y `aria-sort` coherente.
- Logout usó rojo pastel y cambió a `rgb(220, 38, 38)` con texto blanco en hover; CSV y Excel quedaron diferenciados en violeta y verde pastel.
- Los chips de clase, dieta y continente conservaron texto y bordes legibles, con tonos pastel determinísticos por valor.
- Aplicar y limpiar comenzaron deshabilitados; editar habilitó las acciones, aplicar sincronizó el estado y limpiar recuperó el catálogo completo.
- El archivo `.xlsx` descargado abrió y funcionó correctamente en Microsoft Excel según confirmación del usuario.
- A 390×844 los filtros quedaron apilados, las acciones de exportación ocuparon el ancho disponible y no hubo desborde horizontal de página; la tabla conservó su desplazamiento interno.
- Logout eliminó la sesión y volvió a `/login`.

La estructura, contenido, tipos, orden y mecanismo de descarga de CSV/XLSX quedaron cubiertos por tests automatizados. La apertura del `.xlsx` también quedó aceptada manualmente en el Excel instalado; el CSV conserva su evidencia automatizada y el diagnóstico de codificación documentado.
