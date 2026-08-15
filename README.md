# ware-landing-page

Landing comercial de **Maremoto SpA** — el modelo "somos tu departamento de ingeniería".
Sitio estático, sin build, sin dependencias. Servido por GitHub Pages.

Tracker: [`d:/ware/docs/DEPT-ENGAGEMENT-PROTOCOL-IMPL.md`](https://github.com/waremoto) fase 7.

## Ver en local

Abrir `index.html` en el navegador. No hay paso de build.

## Estructura

| Archivo | Rol |
|---|---|
| `index.html` | El sitio completo — 10 secciones |
| `style.css` | Tokens de diseño + layout. Tema claro/oscuro por `data-theme` y `prefers-color-scheme` |
| `script.js` | Toggle de tema, reveal al hacer scroll, borde del nav. Sin dependencias |
| `CNAME` | Dominio canónico de GitHub Pages |
| `portfolio/` | Redirect legado al portafolio gamedev en Notion. No enlazado desde el landing |

## Dominios

Decisión del operador, 2026-08-12 — consistente con
[`docs/reference/naming-and-branding.md` §5](https://github.com/waremoto):

| Dominio | Rol | Estado |
|---|---|---|
| **`maremoto.dev`** | **Canónico.** La cara pública del negocio | En `CNAME`. Falta apuntar el DNS |
| `ware.cl` | Redirige al canónico. Reservado como hub interno (`ghost.`, `code.`, `harness.`) | DNS ya existe; apuntar a Pages para que GitHub redirija |
| `maremoto.cl` | Cara corporativa / entidad legal | Sin decidir |

GitHub Pages admite **un solo** dominio en `CNAME`. Los demás dominios que apunten al mismo
sitio son redirigidos por GitHub al canónico automáticamente.

### Estado: ✅ desplegado (2026-08-12)

| Hostname | Comportamiento | Verificado |
|---|---|---|
| `maremoto.dev` | **Sirve el landing** | `200` |
| `www.maremoto.dev` | 301 → `maremoto.dev` | `301` |
| `ware.cl` · `www.ware.cl` | 301 → `maremoto.dev` | `301` |
| `github.ware.cl` | Sin tocar. Apunta a Pages y hoy responde 404 — era un alias en desuso | — |

### Lo que había antes, y qué se hizo

`maremoto.dev` estaba **parqueado en Namecheap** (`A` a `192.0.2.1` — rango de documentación RFC 5737 — y a
`192.64.119.117`, más `www` a `parkingpage.namecheap.com`) **y además** tenía una Redirect Rule catch-all
`301 → https://ware.cl/`. `ware.cl` era el que servía el sitio.

Cambios aplicados vía API de Cloudflare:

1. **Eliminada la Redirect Rule** catch-all de `maremoto.dev`. Iba primero a propósito: con el `CNAME` del repo ya
   apuntando a `maremoto.dev`, dejarla viva habría producido un bucle `ware.cl → maremoto.dev → ware.cl`.
2. **Borrados los dos registros `A` del parking** y creado `CNAME maremoto.dev → waremoto.github.io` (proxied),
   replicando exactamente cómo `ware.cl` ya funcionaba.
3. **`www.maremoto.dev`** repuntado y además redirigido en el edge — GitHub Pages no tiene certificado para ese
   host y devolvía `525`. La redirección se resuelve en Cloudflare antes de llegar al origen.
4. **Redirect Rule en la zona `ware.cl`**, acotada a `ware.cl` y `www.ware.cl` — deliberadamente **no** toca
   subdominios, para no romper el plan de `ghost.ware.cl` / `code.ware.cl` de
   [naming-and-branding.md §5](https://github.com/waremoto).
5. **Purga de caché** en `maremoto.dev`.

> **Google Workspace quedó intacto.** Los `MX`, `SPF`, `DKIM`, `DMARC` y los `google-site-verification` de
> `maremoto.dev` no se tocaron: el correo sigue funcionando.

### Notas de operación

- **Proxy naranja activo, SSL en modo `full`.** Funciona porque Cloudflare termina el TLS con su propio
  certificado. La contrapartida: en Settings → Pages de GitHub, *Enforce HTTPS* no se puede activar, porque GitHub
  no logra validar el dominio a través del proxy. No es un problema práctico —el visitante siempre habla HTTPS con
  Cloudflare— pero conviene saberlo antes de intentar activarlo.
- **`always_use_https` está en `off`** en ambas zonas. Si se quiere forzar HTTP→HTTPS en el edge, hay que
  encenderlo; hoy lo cubre `automatic_https_rewrites`.
- Tras cada push, si el contenido no aparece: purgar caché de la zona.

## Antes de tocar el contenido

- El posicionamiento, las tres líneas y las condiciones que el sitio enuncia ("salida a 60 días",
  "sin exclusividad", "sin guardia por defecto") tienen que coincidir con
  `docs/maremoto/comercial/oferta-y-precios.md`. Si difieren, manda la carta de tarifas.
- **No publicar ningún caso de cliente identificable** sin permiso escrito del cliente y sin
  revisar el NDA vigente. La prueba actual está deliberadamente anonimizada.

## Cifras de prueba social (L4)

La `proof-strip` del hero publica cifras de la operación real. Regla: **si una cifra no se
puede verificar con el comando de su fila, se saca del sitio** — un número de prueba social
que envejece en silencio es peor que no tenerlo. Refresco: mensual, a mano, con el push.

| Cifra | Fuente | Comando de verificación |
|---|---|---|
| proyectos bajo gestión | `d:/ware/ware.json` `projects[]` | `python -c "import json; print(len(json.load(open('ware.json'))['projects']))"` (desde `d:/ware`) |
| corridas automatizadas registradas | `d:/ware/.runs/*.jsonl` | `ls d:/ware/.runs/*.jsonl \| wc -l` |
| pruebas automatizadas en verde | suite `ware` (293) + `maremoto-api` (75) | `python -m unittest bin.test_ware` (en `d:/ware`) + `npm test` (en `maremoto-api`) — sumar los totales en verde |

Lo que NUNCA entra aquí: precios de tarifario (la carta se cotiza en reunión), nombres de
cliente, testimonios, ni nada que no salga de datos propios (NDA Cognity: cláusula penal 150 UF).

## GIF del tablero (L5) — receta de captura

El tablero (`#day` + `.kb`, sección "la jornada") es DOM puro, así que `MediaRecorder` no
sirve; la captura es por cuadros. El binario NO vive en el repo todavía — producirlo es paso
del operador (idealmente **MP4 o WebP animado**, no GIF: un GIF de 15 s de esta fidelidad
pesa 3–8 MB y rompe el presupuesto de Performance ≥ 90).

1. Abrir el sitio local y fijar el slider: en consola, `for` sobre `#dayRange.value = 0…1435`
   en ~150 pasos, con un screenshot del nodo `.shell` por paso (Playwright `locator.screenshot()`
   o el navegador embebido de la sesión).
2. Ensamblar: `ffmpeg -framerate 10 -i frame-%03d.png -vf "palettegen/paletteuse" tablero.gif`
   (ffmpeg 4.4.1 ya está en esta máquina) — o mejor `-c:v libx264 -pix_fmt yuv420p tablero.mp4`.
3. Publicar como asset del repo + el bloque que lo ofrece para compartir (pendiente con el asset).

## Historial

El landing anterior (efecto blob + link a Spawn) está preservado en el tag `v1-blob-landing`
y en la rama `legacy/v1-blob-landing`.
