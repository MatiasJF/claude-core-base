#!/usr/bin/env bash
# Instala el núcleo en esta máquina: plugins, rules y plantilla de CLAUDE.md.
# Uso: install.sh [plugin ...]     (por defecto: core-tools orchestrator)
# Requiere que el marketplace ya esté registrado:
#   claude plugin marketplace add https://github.com/TU_USUARIO/claude-core-base.git
# No toca settings y no borra nada.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
STAMP="$(date +%Y%m%d-%H%M%S)"

# El nombre del marketplace sale del manifiesto: si renombras el repo, basta con cambiarlo allí.
MARKET="$(sed -n 's/^  "name": "\([^"]*\)".*/\1/p' "$ROOT/.claude-plugin/marketplace.json" | head -n 1)"
if [ -z "$MARKET" ]; then
  echo "error: no puedo leer el nombre del marketplace en $ROOT/.claude-plugin/marketplace.json" >&2
  exit 1
fi

if ! command -v claude >/dev/null 2>&1; then
  echo "error: no encuentro el CLI 'claude' en el PATH" >&2
  exit 1
fi

if ! claude plugin marketplace list 2>/dev/null | grep -qF -- "$MARKET"; then
  echo "error: el marketplace $MARKET no está registrado. Ejecuta antes:" >&2
  echo "  claude plugin marketplace add <URL de tu repo>" >&2
  exit 1
fi
claude plugin marketplace update "$MARKET"

if [ "$#" -eq 0 ]; then
  set -- core-tools orchestrator
fi
for plugin in "$@"; do
  if claude plugin list 2>/dev/null | grep -qF -- "${plugin}@${MARKET}"; then
    echo "ya instalado: ${plugin}@${MARKET}"
  else
    claude plugin install "${plugin}@${MARKET}"
  fi
done

mkdir -p "$CLAUDE_DIR/rules"
for rule in "$ROOT"/global/rules/*.md; do
  dest="$CLAUDE_DIR/rules/$(basename "$rule")"
  if [ -f "$dest" ] && ! cmp -s "$rule" "$dest"; then
    cp "$dest" "$dest.bak-$STAMP"
    echo "rule distinta, copia anterior en: $dest.bak-$STAMP"
  fi
  cp "$rule" "$dest"
  echo "rule instalada: $(basename "$rule")"
done

if [ -f "$CLAUDE_DIR/CLAUDE.md" ]; then
  echo "CLAUDE.md global ya existe: no se toca (plantilla en $ROOT/global/CLAUDE.md)"
else
  cp "$ROOT/global/CLAUDE.md" "$CLAUDE_DIR/CLAUDE.md"
  echo "CLAUDE.md global instalado desde la plantilla"
fi

echo
echo "Hecho. Settings recomendados (fusionar a mano): $ROOT/global/settings.template.json"
echo "Los cambios se ven en sesiones nuevas de Claude Code."
