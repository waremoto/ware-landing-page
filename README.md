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

### Pasos de despliegue pendientes

1. Confirmar la titularidad de `maremoto.dev`.
2. DNS de `maremoto.dev` → GitHub Pages (`A` a las IP de Pages, o `CNAME` a `waremoto.github.io`).
3. DNS de `ware.cl` → mismo destino, para que redirija.
4. En Settings → Pages del repo: fijar el dominio y activar **Enforce HTTPS**.
5. Probar en móvil real, no sólo en el emulador del navegador.

## Antes de tocar el contenido

- El posicionamiento, las tres líneas y las condiciones que el sitio enuncia ("salida a 60 días",
  "sin exclusividad", "sin guardia por defecto") tienen que coincidir con
  `docs/maremoto/comercial/oferta-y-precios.md`. Si difieren, manda la carta de tarifas.
- **No publicar ningún caso de cliente identificable** sin permiso escrito del cliente y sin
  revisar el NDA vigente. La prueba actual está deliberadamente anonimizada.

## Historial

El landing anterior (efecto blob + link a Spawn) está preservado en el tag `v1-blob-landing`
y en la rama `legacy/v1-blob-landing`.
