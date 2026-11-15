#!/bin/sh
# Pone en index.html la versión de app.js (los primeros 8 caracteres de su hash), para que los navegadores
# que ya lo tenían guardado bajen el nuevo. Correrlo antes de cada commit que cambie app.js:
#   sh scripts/version.sh   (lo corre solo el hook pre-commit)
cd "$(dirname "$0")/.." || exit 1
V=$(shasum app.js | cut -c1-8)
sed -i '' -E "s#/app\.js(\?v=[0-9a-f]+)?\"#/app.js?v=$V\"#" index.html
echo "app.js?v=$V"
