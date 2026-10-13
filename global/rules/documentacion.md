# Documentación

Concisa, técnica y fácil de recorrer; sin relleno. Debe poder leerse sin ejecutar herramientas.

- **Diagramas.** Se escriben como fuentes Mermaid (`.mmd`) y se renderizan a PNG; fuente e imagen se guardan juntas en `docs/diagrams/`. Como mínimo: arquitectura general, entidad-relación, secuencias de autenticación y flujos, dependencias entre capas y recorrido de una petición.
  - Render: `npx mmdc -i fichero.mmd -o fichero.png -p puppeteer-config.json -b white -w 2048`.
  - Como root, la configuración de puppeteer necesita `{"args": ["--no-sandbox"]}`. Ese fichero no se sube al repo.
- **API.** Especificación OpenAPI 3.1 en `docs/api/openapi.yaml`, con cada endpoint documentado: esquemas de petición y respuesta, ejemplos, errores, esquemas reutilizables y esquemas de seguridad. Se sirve el YAML y una interfaz Swagger que lo carga.
- **Arquitectura.** `docs/architecture.md` con los diagramas incrustados y secciones de visión general, stack, módulos, recorrido de una petición, base de datos, autenticación y despliegue. Tablas para la información estructurada.
- **Estado.** `docs/STATUS.md` con la fase actual, lo construido, lo siguiente, los problemas conocidos y las notas de entorno. Es el documento de relevo: una sesión nueva lo lee para arrancar en frío.
- **Decisiones.** Un ADR por fichero en `docs/adr/`.
