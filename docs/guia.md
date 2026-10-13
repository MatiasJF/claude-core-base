# Guía de uso

[English](guide.en.md)

Cómo convertir esta base en tu núcleo, instalarlo en varias máquinas y decidir
qué entra en él.

## 1. Cómo encajan las piezas

| Pieza | Qué es | Cómo llega a la máquina |
|---|---|---|
| `.claude-plugin/marketplace.json` | Catálogo: lista de plugins propios y externos | `claude plugin marketplace add` |
| `plugins/<nombre>/` | Un plugin: skills, comandos, agentes, workflows o servidores MCP | `claude plugin install <nombre>@<marketplace>` |
| `global/` | `CLAUDE.md`, rules y settings de usuario | `install.sh` los copia a `~/.claude/` |
| `templates/` | Esqueletos que copias a mano en proyectos nuevos | A mano |
| `guidebooks/` | Lectura para personas | No se instala |

Los plugins no pueden traer `CLAUDE.md`, rules ni settings de usuario. Por eso
existen `global/` e `install.sh`: cubren lo que el sistema de plugins no cubre.

## 2. Crear tu repo

1. Crea tu copia con «Use this template» (historial nuevo) o con un fork, y
   clónala. Decide si será pública o privada: un núcleo privado puede llevar
   convenciones internas; uno público no debe llevar nada que no enseñarías.
2. Personaliza:

   ```bash
   bash personalizar.sh tu-usuario                 # solo el propietario
   bash personalizar.sh tu-usuario mi-nucleo       # y además renombra el marketplace
   ```

   Sustituye el marcador `TU_USUARIO` (propietario del marketplace, autor de los
   plugins y URLs) y, con el segundo argumento, el nombre `claude-core-base`.
   Si renombras, renombra también el repo en GitHub para que las URLs coincidan.
3. Edita `global/CLAUDE.md` y `global/rules/` a tu gusto. Son un ejemplo.
4. Valida y sube:

   ```bash
   claude plugin validate .
   git add -A && git commit -m "chore: personalize core" && git push
   ```

## 3. Instalar en una máquina

```bash
claude plugin marketplace add https://github.com/TU_USUARIO/claude-core-base.git
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh
```

Con argumentos, `install.sh` instala esos plugins en lugar de los dos por
defecto:

```bash
bash ~/.claude/plugins/marketplaces/claude-core-base/install.sh core-tools orchestrator webdev-toolkit
```

Después, fusiona a mano `global/settings.template.json` en
`~/.claude/settings.json` si quieres que el marketplace y los plugins queden
declarados en settings. Los cambios solo se ven en sesiones nuevas de Claude
Code: cierra y abre.

Para actualizar una máquina, vuelve a ejecutar `install.sh`: actualiza el
marketplace, instala lo que falte y recopia las rules.

## 4. Según el tipo de acceso

| Situación | Cómo registrar el marketplace |
|---|---|
| Repo público | URL HTTPS; no hace falta clave |
| Repo privado, máquina personal | URL SSH con tu clave habitual: `git@github.com:TU_USUARIO/claude-core-base.git` |
| Repo privado, servidor | Clave de despliegue de solo lectura y alias SSH propio (abajo) |

La forma abreviada `usuario/repo` clona por SSH. En una máquina sin clave de
GitHub falla aunque el repo sea público: usa la URL HTTPS. Por lo mismo, los
plugins externos del manifiesto usan `{"source": "url"}` con HTTPS y no
`{"source": "github"}`.

### Servidor con clave de despliegue

Una clave de despliegue da acceso a un único repo. En solo lectura, un servidor
comprometido no puede modificar tu núcleo.

```bash
ssh-keygen -t ed25519 -f ~/.ssh/claude_core_deploy -N "" -C "claude-core@$(hostname)"
cat ~/.ssh/claude_core_deploy.pub
```

Pega la clave pública en GitHub: repo → Settings → Deploy keys → Add deploy key,
sin marcar «Allow write access». Luego, en `~/.ssh/config` del servidor:

```
Host github-claude-core
  HostName github.com
  User git
  IdentityFile ~/.ssh/claude_core_deploy
  IdentitiesOnly yes
```

Y registra el marketplace por el alias:

```bash
claude plugin marketplace add git@github-claude-core:TU_USUARIO/claude-core-base.git
```

El alias evita que esta clave choque con otras claves de GitHub de la misma
máquina.

### Windows

- Git Bash ejecuta `install.sh` sin cambios.
- Si la red corta el puerto 22, usa SSH sobre el 443 en `~/.ssh/config`:

  ```
  Host github-claude-core
    HostName ssh.github.com
    Port 443
    User git
    IdentityFile ~/.ssh/claude_core_deploy
    IdentitiesOnly yes
  ```

- Si Git no ve el alias (usa su propio SSH y no lee la configuración del
  OpenSSH de Windows), apúntalo al de Windows:

  ```bash
  git config --global core.sshCommand "C:/Windows/System32/OpenSSH/ssh.exe"
  ```

## 5. Qué va al núcleo y qué se queda local

| Pregunta | Si la respuesta es sí |
|---|---|
| ¿Lo usarías igual en todas tus máquinas y proyectos? | Núcleo |
| ¿Nombra una empresa, un cliente, una máquina, una ruta o una cuenta? | Local: en la máquina o en el repo del proyecto |
| ¿Depende de una estructura de carpetas que solo existe en un sitio? | Local |
| ¿Lleva una credencial, o un valor de ejemplo que parece real? | En ningún repo |
| ¿Es de un tercero? | Referencia externa por URL, con licencia y origen; no se copia |
| ¿Es una regla de un proyecto concreto? | El `CLAUDE.md` de ese proyecto |

En la duda, local. Subir algo al núcleo más tarde es fácil; sacarlo del
historial de un repo publicado no lo es.

## 6. Añadir plugins

Plugin propio:

```
plugins/mi-plugin/
  .claude-plugin/plugin.json     nombre, descripción, versión, autor
  skills/<skill>/SKILL.md        skills (frontmatter con name y description)
  commands/<comando>.md          comandos /mi-plugin:<comando>
  agents/<agente>.md             agentes
  .mcp.json                      servidores MCP
```

Añade su entrada en `marketplace.json` con `"source": "./plugins/mi-plugin"` y
valida con `claude plugin validate .`.

Plugin externo: no lo copies. Añade una entrada con la URL HTTPS del repo de su
autor, su licencia y su página:

```json
{
  "name": "nombre",
  "source": { "source": "url", "url": "https://github.com/autor/repo.git" },
  "description": "Externo (licencia, autor): qué hace.",
  "license": "MIT",
  "homepage": "https://github.com/autor/repo"
}
```

Las skills y comandos de un plugin van con espacio de nombres
(`plugin:skill`). Si antes tenías esas mismas skills como copias sueltas en
`~/.claude/skills/`, pasan a llamarse distinto: borra las copias sueltas para no
tener duplicados.

## 7. Antes de cada push

- `/scan-secrets` sobre el repo.
- Busca tu usuario, rutas personales (`/Users/`, `/home/`, `C:\Users\`) y
  nombres de máquina.
- `claude plugin validate .`

## 8. Problemas frecuentes

| Síntoma | Causa y arreglo |
|---|---|
| `Permission denied (publickey)` al añadir el marketplace o un plugin externo | Se está clonando por SSH sin clave. Usa la URL HTTPS, o configura la clave |
| `install.sh` dice que el marketplace no está registrado | Falta `claude plugin marketplace add <URL>` en esa máquina |
| Instalado, pero las skills no aparecen | Los cambios solo se ven en sesiones nuevas |
| Una skill aparece dos veces o con otro nombre | Copia suelta antigua en `~/.claude/skills/`; bórrala |
| Una rule tuya ha cambiado tras instalar | `install.sh` la sobrescribió; la anterior está al lado como `.bak-<fecha>` |
| Timeout de SSH en Windows o en redes corporativas | Puerto 22 cortado: `ssh.github.com:443` |
