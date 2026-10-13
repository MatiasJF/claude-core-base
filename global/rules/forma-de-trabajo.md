# Forma de trabajo

- Si el repositorio tiene un fichero de estado (por ejemplo `docs/STATUS.md`), léelo antes de tocar nada: dice en qué fase está el proyecto, qué hay en curso y qué es lo siguiente.
- Lee el documento del área que vas a tocar antes de cambiarla.
- Al terminar la sesión, actualiza el fichero de estado. Una sesión que no lo actualiza no está terminada.
- Si el `CLAUDE.md` del proyecto choca con lo que parece razonable, gana el `CLAUDE.md`. Si de verdad está mal, se cambia ahí primero y después se cambia el código.

## Definición de «hecho»

Una tarea no está terminada hasta que:

- La comprobación de tipos, el linter y los tests del proyecto pasan.
- Si toca la API: la ruta está en la especificación y tiene al menos un test de contrato.
- Si toca el modelo de datos: hay migración, los datos semilla siguen funcionando y la documentación del modelo está al día.
- Si toca la interfaz: tiene estado de carga, estado vacío y estado de error, funciona a 375 px de ancho, es navegable por teclado y se ve bien en tema claro y oscuro.
- Si es una decisión con alternativas reales: queda registrada en un ADR.
- El fichero de estado refleja el nuevo estado.
