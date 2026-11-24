#!/bin/sh
# Pone en index.html la versión de app.js y de los íconos (los primeros 8 caracteres del hash de cada uno), para
# que los navegadores que ya los tenían guardados bajen los nuevos; los íconos los guarda aparte y no los revisa
# aunque el servidor diga max-age=0. Correrlo antes de cada commit que cambie alguno:
#   sh scripts/version.sh   (lo corre solo el hook pre-commit)
cd "$(dirname "$0")/.." || exit 1
for F in app.js favicon.svg favicon.ico apple-touch-icon.png; do
  V=$(shasum "$F" | cut -c1-8)
  E=$(printf '%s' "$F" | sed 's/\./\\./g')
  sed -i '' -E "s#/$E(\?v=[0-9a-f]+)?\"#/$F?v=$V\"#" index.html
  echo "$F?v=$V"
done
