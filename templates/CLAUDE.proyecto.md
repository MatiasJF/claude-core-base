# <Nombre del proyecto>

Este fichero es el contrato de cómo se trabaja en este repositorio. Léelo entero antes de tocar nada.

## Lo primero, siempre

1. Leer `<fichero-de-estado>`.
2. Leer el documento de `<carpeta-de-docs>` del área que se va a tocar.
3. Al terminar la sesión, actualizar `<fichero-de-estado>`.

## Base de conocimiento

| Documento | Qué contiene |
|---|---|
| `<docs>/01-<visión-y-alcance>` | Qué es la app, qué entra y qué no |
| `<docs>/02-<arquitectura>` | Stack, capas, estructura de carpetas, seguridad |
| `<docs>/03-<modelo-de-datos>` | Esquema, invariantes, índices |
| `<docs>/04-<contrato-api>` | Endpoints, convenciones, errores |
| `<docs>/05-<sistema-de-diseño>` | Tokens, componentes, movimiento, accesibilidad |
| `<docs>/NN-<área-propia>` | Una fila por subsistema del proyecto |
| `<docs>/NN-<roadmap>` | Fases y criterios de aceptación |
| `<docs>/adr/` | Decisiones arquitectónicas, una por fichero |

## Comandos

`<comando-de-typecheck>`, `<comando-de-lint>`, `<comando-de-test>`, `<comando-de-arranque>`.

## Reglas propias del proyecto

Parten de las reglas globales de `claude-core-base` (`global/rules/codigo.md`: capas, contratos, validación, errores, estados de carga, comentarios, idioma). Aquí va solo lo que las concrete o se aparte de ellas: librería de esquemas, ORM, librería de iconos, reglas de dominio.

## Ámbitos de commit

`<lista-cerrada-de-ámbitos>`

## Errores conocidos en los que no volver a caer

Una entrada por lección: qué pasó, por qué y la regla que sale de ahí.
