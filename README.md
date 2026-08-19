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
| `style.css` | Paletas + alias de tokens + layout. Modo por `data-theme`, paleta por `data-palette` |
| `theme.js` | Modo, paleta y panel de debug. Bloqueante en el `<head>` de cada página |
| `script.js` | Idioma, reveal al hacer scroll, borde del nav, diagramas. Sin dependencias |
| `tools/gen_palettes.py` | Genera el bloque de paletas de `style.css` desde una tabla |
| `tools/gen_swatch.py` | Genera las muestras del panel desde la misma tabla |
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

## Temas y panel de debug

Dos ejes independientes en `<html>`, ambos aplicados por `theme.js` antes del
primer pintado:

| Atributo | Valores | Ausente significa |
|---|---|---|
| `data-theme` | `light` \| `dark` | manda `prefers-color-scheme` |
| `data-palette` | `maremoto` \| `default` \| `monochrome` \| `ocean` \| `warm` \| `rose` \| `lowcontrast` | `DEFAULTS.palette` (hoy `default`) |

`maremoto` es la paleta de marca. Las otras seis son las de GhostShell
(`Ghost/docs/reference/ghostshell-style.md` §3.1), para poder mirar la landing y
el cockpit lado a lado sin que parezcan dos productos.

### Lo que ve un visitante nuevo

Lo define **`DEFAULTS` en `theme.js`** y nada más:

```js
var DEFAULTS = {
  palette: 'default',   // Ghost — mono, máximo contraste
  mode: 'auto',         // sigue a prefers-color-scheme
  lang: 'auto',         // sigue a navigator.language
  calm: false
};
```

Cualquier preferencia guardada gana sobre esto; vaciar `localStorage` vuelve
acá. `window.maremotoTheme.get()` incluye `siteDefaults`, así que al leer un
estado copiado se distingue de un vistazo qué es el sitio y qué es la
preferencia de quien lo copió.

Tres cosas hay que mover **juntas** al cambiar la paleta por defecto —el CSS es
el camino sin JS y las metas las lee el navegador antes de todo:

1. `DEFAULTS.palette` en `theme.js`
2. `DEFAULT` en `tools/gen_palettes.py`, y regenerar (abajo)
3. `<meta name="theme-color">` en las 6 páginas — el color de la barra del
   navegador en móvil

`mode: 'auto'` no escribe `data-theme`: "auto" es la *ausencia* del atributo, y
así lo resuelve el CSS con `prefers-color-scheme` sin que JS tenga que
reaccionar. Igual el idioma: `'auto'` es la ausencia de `maremoto-lang` en
`localStorage`. Guardar el valor resuelto sería mentir —quien cambie el idioma
de su navegador mañana seguiría viendo el de hoy.

**El panel de debug se abre con `Ctrl+Alt+D`** (o `?debug=1` en la URL; `Esc`
cierra). Trae selector de paleta, modo, modo quieto —el equivalente del
`ghost-calm` del dashboard—, idioma en tres estados (`auto` / ES / EN; el botón
de la barra solo sabe ES/EN, así que volver a `auto` solo se hace acá), y el
**contraste medido** de cada nivel de
tinta contra el fondo real, en verde o rojo según el piso AA de 4.5:1. No existe
en el DOM hasta que se abre por primera vez; el visitante solo ve el botón de
modo en la barra.

`Ctrl+Alt+D` y no `Ctrl+Shift+D`, que en Chrome es "marcar todas las pestañas".

### Al desplegar: subir `?v=` de los assets

Los `<link>`/`<script>` de las 6 páginas llevan `?v=AAAAMMDD`. **Cambiar
`style.css`, `script.js` o `theme.js` sin subir ese número deja el sitio a medio
desplegar**: el HTML tiene `max-age=600` pero Cloudflare estaba sirviendo un
`style.css` con `age` de 2,4 días pese a su `max-age=3600` —edge TTL propio—, así
que el 2026-08-19 salió el markup nuevo con la hoja vieja. La query string es una
URL distinta y el edge no la tiene.

```bash
cd D:/ware/ware-landing-page; grep -rn "?v=" --include=*.html . #
```

Para que el cambio se vea *ya* en vez de al expirar el caché, purgar el caché de
Cloudflare de la zona `maremoto.dev` (dashboard → Caching → Purge Everything).

### Cambiar o agregar una paleta

Los valores viven en `tools/gen_palettes.py`, no a mano en el CSS:

```bash
cd D:/ware/ware-landing-page; python tools/gen_palettes.py > /tmp/pal.css; python tools/gen_swatch.py > /tmp/sw.css #
```

y se pegan sobre los dos bloques generados de `style.css` (`--g-*` y `.dbg-sw`).
Después medir: abrir el panel y recorrer las 7 paletas × 2 modos mirando la
lectura de contraste. Así se corrigieron dos acentos claros que no llegaban al
piso AA (marca 4.06 → 4.61, `warm` 4.27 → 4.75). `lowcontrast` falla a propósito
—reproduce el default viejo de GhostShell— y por eso está rotulado en el panel.

Nadie fuera del bloque de paletas escribe un hex: el resto de la hoja usa los
alias (`--ink`, `--fg`, `--line`, `--accent`…). Un color literal en una regla es
un bug que solo aparece en el tema que no probaste.

## Antes de tocar el contenido

- El posicionamiento, las tres líneas y las condiciones que el sitio enuncia ("salida a 60 días",
  "sin exclusividad", "sin guardia por defecto") tienen que coincidir con
  `docs/maremoto/comercial/oferta-y-precios.md`. Si difieren, manda la carta de tarifas.
- **No publicar ningún caso de cliente identificable** sin permiso escrito del cliente y sin
  revisar el NDA vigente. La prueba actual está deliberadamente anonimizada.

## El inglés está CONGELADO (S1, decisión 2026-08-15)

Google sólo ve el español: el inglés vive en atributos `data-en*` sobre la MISMA URL, y así
se queda **a propósito**. La decisión (MAREMOTO-FUNNEL OQ-2) es congelar, no elegir:

- **No se indexa.** Sin `/en/`, sin `hreflang` — un `hreflang` sobre una traducción por JS
  sería mentirle al robot.
- **No se borra nada.** Los ~277 `data-en*` y `applyLang` quedan como comodidad del visitante.
- **Nada nuevo nace en inglés.** Toda página nueva es ES-only (ver la sección siguiente).
  El conteo `grep -o 'data-en' index.html | wc -l` no puede BAJAR (gate 3 de SEO-ADS); tampoco
  tiene por qué subir.

**Disparadores de reapertura** (escritos para no re-litigar): construir `/en/` con HTML propio +
`hreflang` cruzado cuando aparezca un prospecto nearshore no hispanohablante o EE.UU./LatAm
angloparlante entre al plan de adquisición; retirar el inglés sólo si el sitio adquiere build o
los `data-en` empiezan a frenar cambios de copy.

## Páginas nuevas: el patrón ES-only (S2/S3)

Toda página nueva del sitio (páginas por intención, artículos) se instancia así — precedente
`404.html`:

- `<html lang="es">`, **sin** conmutador de idioma ni de tema, **sin** atributos `data-en*`.
- `<title>` + `meta description` + `<link rel="canonical">` propios de la página.
- Un solo bloque JSON-LD `@graph` por página, según las convenciones de SEO-ADS: sin `vatID`,
  sin `priceRange`, cero cifras en `Offer`.
- El formulario (si lleva) apunta al mismo Worker (`api.maremoto.dev/v1/contact`).
- Declarada en `sitemap.xml` con su `lastmod` a mano (no hay build ni CI, y eso no cambia);
  enlazada desde el inicio y enlazando de vuelta, sin canibalizar el `<h1>` de la portada.
- Cero librerías JS; Lighthouse Performance ≥ 90 contra producción o se revierte.

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
