---
paths:
  - "**/*.{ts,tsx,js,jsx,mjs,py,cs,go,rs,java,kt,swift,php,rb}"
---

# Reglas de código

Pensadas para aplicaciones con API, base de datos e interfaz. En un script o una utilidad suelta aplica solo lo que tenga sentido (comentarios, errores, idioma).

- **Capas.** Nadie salta capas. El dominio no importa nada del resto del proyecto; solo los repositorios tocan la base de datos; los servicios no saben que existe HTTP; los componentes de interfaz no saben que existe la base de datos.
- **Contratos.** Un único esquema define cada forma de datos. No se declaran a mano tipos equivalentes: se infieren del esquema. Si un tipo aparece en la API y en el cliente, sale del mismo esquema.
- **Validación.** Toda entrada se valida en el borde. Los servicios asumen datos ya válidos y comprueban los invariantes de negocio; no se delegan en la base de datos.
- **Errores.** Errores de dominio tipados (no encontrado, validación, conflicto), lanzados por los servicios y traducidos a la respuesta en un único punto. Nada de errores genéricos con un texto suelto.
- **Estados de carga.** Todo componente que carga datos tiene su esqueleto al lado, con la misma geometría.
- **Comentarios.** Solo cuando explican por qué, nunca qué. Un comentario que repite el código se borra.
- **Sin emojis.** Ni en la interfaz, ni en los datos semilla, ni en los comentarios, ni en los mensajes de commit.
- **Idioma.** Interfaz, contenido y documentación en español. Código, nombres, esquemas y mensajes de commit en inglés.
