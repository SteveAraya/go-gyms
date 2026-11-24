# Go-Gyms · Muy pronto

La página que va en el dominio mientras la app está en desarrollo. Gogo prende las luces de su sala y hace un recorrido por lo que viene, en 11 paradas, hasta la puerta entreabierta del final.

Es estática: HTML, CSS y JS sin dependencias ni paso de build. Vercel sirve la raíz tal cual (`vercel.json` solo pone los headers de caché).

- `index.html`: el texto de cada parada, las pantallas holográficas y el dibujo de Gogo (el mismo de la app).
- `app.js`: la sala, el esqueleto de Gogo y lo que hace en cada parada.
- `fonts/`: Barlow Condensed, Space Grotesk y Outfit (solo las letras de "Go-Gyms"), locales.
- `og.jpg`: la imagen para compartir en redes.

## Verla local

```sh
python3 -m http.server 4173
```

y abrir http://localhost:4173.

## Versión de `app.js` y de los íconos

`index.html` carga `app.js`, `favicon.svg`, `favicon.ico` y `apple-touch-icon.png` con `?v=<hash>` de cada uno: así
los navegadores que ya los tenían guardados bajan los nuevos (los íconos van a un caché aparte que no se renueva
solo, aunque el servidor diga `max-age=0`). La versión la
pone `scripts/version.sh`. Para que corra solo antes de cada commit, instalá el hook una vez:

```sh
printf '#!/bin/sh\nsh scripts/version.sh >/dev/null && git add index.html\n' > .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
```
