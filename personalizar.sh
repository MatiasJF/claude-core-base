#!/usr/bin/env bash
# Convierte esta base en tu núcleo: sustituye el marcador de usuario por tu usuario de
# GitHub y, si quieres, renombra el marketplace. Se ejecuta una vez, en tu copia del repo.
# Uso: personalizar.sh <usuario-de-github> [nombre-del-marketplace]
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SELF="$(basename "${BASH_SOURCE[0]}")"
MARKER="TU_""USUARIO"
BASE_NAME="claude-core-""base"

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "uso: $SELF <usuario-de-github> [nombre-del-marketplace]" >&2
  exit 1
fi
OWNER="$1"
NAME="${2:-$BASE_NAME}"

if ! printf '%s' "$OWNER" | grep -Eq '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$'; then
  echo "error: '$OWNER' no parece un usuario de GitHub válido" >&2
  exit 1
fi
if ! printf '%s' "$NAME" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
  echo "error: el nombre del marketplace va en minúsculas, con números y guiones" >&2
  exit 1
fi

cd "$ROOT"
# LICENSE queda fuera: el aviso de copyright original se conserva tal cual.
find . -type f -not -path './.git/*' -not -name "$SELF" -not -name 'LICENSE' -not -name '.DS_Store' -print0 |
  while IFS= read -r -d '' file; do
    if grep -qF -e "$MARKER" -e "$BASE_NAME" "$file"; then
      MARKER="$MARKER" OWNER="$OWNER" BASE_NAME="$BASE_NAME" NAME="$NAME" \
        perl -pi -e 's/\Q$ENV{MARKER}\E/$ENV{OWNER}/g; s/\Q$ENV{BASE_NAME}\E/$ENV{NAME}/g' "$file"
      echo "actualizado: ${file#./}"
    fi
  done

echo
echo "Hecho: propietario '$OWNER', marketplace '$NAME'."
echo "Revisa el diff, valida con 'claude plugin validate .' y sube el repo a tu cuenta."
