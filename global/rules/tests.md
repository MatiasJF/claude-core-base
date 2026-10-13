# Tests

No se persigue un porcentaje de cobertura global. Se persigue que la lógica de dominio esté cubierta al detalle y que cada ruta de la API tenga su test.

| Tipo | Qué se prueba |
|---|---|
| Unidad | La capa de dominio al completo: es lógica pura, sin excusas |
| Servicio | Invariantes de negocio, contra una base de datos de test real |
| Contrato | Cada ruta: forma de la respuesta, códigos de error y aislamiento entre usuarios |
| Regresión | Componentes no deterministas, sobre un banco fijo de casos |
| E2E | Los caminos críticos en navegador real, con base de datos y puerto propios |

## Tests de integración

- Atacan al servidor de desarrollo en marcha y a una base de datos real. No se simula la base de datos: los dobles esconden desajustes de esquema, errores de consulta y problemas de cookies. Los dobles quedan para lógica aislada.
- Un fichero de preparación común con la URL base configurable por entorno y ayudantes para llamar a la API, iniciar sesión y hacer peticiones autenticadas.
- Un fichero de test por grupo de endpoints.
- Por cada endpoint: camino feliz, fallos de autenticación, errores de validación (campos ausentes, formato inválido, JSON mal formado) y casos límite (idempotencia, aislamiento entre usuarios, persistencia entre peticiones).
- Las aserciones sobre la forma de la respuesta admiten campos añadidos; no exigen igualdad exacta.
- Carpetas separadas para unidad, integración y E2E, con un script para cada una y otro que las ejecute todas.
