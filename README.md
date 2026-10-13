# claude-core-base

[English](README.en.md)

Base para montar tu propio núcleo de Claude Code: un marketplace de plugins, unas
rules globales, plantillas y un instalador. Lo copias a tu cuenta, lo
personalizas una vez y lo instalas igual en todas tus máquinas.

La idea: lo que es común a todas tus máquinas vive en un repo; lo que es de una
empresa, un cliente o un proyecto se queda en su máquina o en su repo.

## Empezar

```bash
# 1. Crea tu copia (botón «Use this template» en GitHub, o un fork) y clónala
git clone https://github.com/TU_USUARIO/claude-core-base.git
cd claude-core-base

# 2. Sustituye los marcadores por tu usuario (y, si quieres, renombra el marketplace)
bash personalizar.sh tu-usuario-de-github

# 3. Valida, haz commit y sube
claude plugin validate .
```

En cada máquina:

```bash
claude plugin marketplace add https://github.com/TU_USUARIO/claude-core-base.git
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh
```

`install.sh` instala `core-tools` y `orchestrator` (o los plugins que le pases
como argumentos), copia las rules a `~/.claude/rules/` y, si la máquina no tiene
`~/.claude/CLAUDE.md`, copia la plantilla. No toca settings ni borra nada: si
una rule ya existe y es distinta, guarda la anterior como `.bak-<fecha>`.

Repos privados, servidores con clave de despliegue, Windows y cómo decidir qué
va al núcleo: [docs/guia.md](docs/guia.md).

## Plugins

Propios (viven en este repo, licencia MIT):

| Plugin | Contenido | Requisitos |
|---|---|---|
| `core-tools` | `/generate-tech-docs`, `/scan-secrets` | Python 3 para la documentación |
| `orchestrator` | Orquestación multiagente: planner, worker, verifier, synthesizer y cuatro workflows | — |
| `mcp-n8n` | Servidor MCP `n8n-mcp` | Docker |
| `webdev-toolkit`, `scraping-toolkit`, `analytics-toolkit`, `database-toolkit`, `security-toolkit`, `devops-toolkit`, `maintenance-toolkit` | Una skill de disciplina por dominio | — |

Externos (no se copian; se instalan desde el repo de su autor):

| Plugin | Origen | Licencia |
|---|---|---|
| `taste-skill` | github.com/Leonxlnx/taste-skill | MIT |
| `hyperframes` | github.com/heygen-com/hyperframes | Apache-2.0 |
| `impeccable` | github.com/pbakaus/impeccable | Apache-2.0 |

Cómo pensar la orquestación multiagente: [guidebooks/orchestration.md](guidebooks/orchestration.md).

## Fuera de los plugins

Un plugin no puede aportar `CLAUDE.md`, rules ni settings de usuario, así que
esas piezas viven en `global/` y las copia `install.sh`:

| Fichero | Destino |
|---|---|
| `global/CLAUDE.md` | `~/.claude/CLAUDE.md` (solo si no existe) |
| `global/rules/*.md` | `~/.claude/rules/` |
| `global/settings.template.json` | Se fusiona a mano en `~/.claude/settings.json` |

Las rules (forma de trabajo, código, commits, tests y documentación) son un
ejemplo opinado: edítalas o sustitúyelas por las tuyas. `templates/CLAUDE.proyecto.md`
es el esqueleto para el `CLAUDE.md` de un proyecto nuevo.

## Reglas del repo

- Ni credenciales, ni nombres de clientes, ni rutas de una máquina concreta.
- Material de terceros: solo con su licencia y su origen anotados.
- Pasa `/scan-secrets` antes de cada push.

## Licencia

MIT. Los plugins externos conservan la licencia de su autor.
