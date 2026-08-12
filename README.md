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

### Situación actual (2026-08-12, según el operador)

`maremoto.dev` **ya es del operador**, pero hoy está configurado en Cloudflare **redirigiendo hacia `ware.cl`** —
es decir, al revés de lo que queremos. `ware.cl` es el que sirve el sitio hoy.

**Hay que invertir el sentido:** que `maremoto.dev` sirva el sitio y `ware.cl` redirija hacia él.

### Pasos de despliegue

1. **Quitar la regla de redirección** `maremoto.dev → ware.cl` en Cloudflare (Rules → Redirect Rules, o la Page
   Rule antigua). Mientras exista, cualquier DNS que se configure va a ser ignorado.
2. **DNS de `maremoto.dev` → GitHub Pages.** Registros `A` del apex a las IP de Pages
   (`185.199.108/109/110/111.153`), y `CNAME` de `www` a `waremoto.github.io`.
3. ⚠️ **Poner el registro en DNS-only (nube gris), no proxied (nube naranja)** — al menos hasta que GitHub emita el
   certificado. Con el proxy activo GitHub no puede validar el dominio y "Enforce HTTPS" queda deshabilitado. Una
   vez emitido, se puede volver a activar el proxy con SSL en modo **Full (strict)**.
4. **En Settings → Pages del repo:** fijar `maremoto.dev` como custom domain y activar **Enforce HTTPS** cuando
   deje de estar en gris (puede tardar hasta ~1 h).
5. **Crear la redirección inversa** `ware.cl → maremoto.dev` en Cloudflare, con código 301.
6. **Probar en móvil real**, no sólo en el emulador del navegador.

> El `CNAME` del repo ya dice `maremoto.dev`. GitHub Pages admite **un solo** dominio ahí; el resto se resuelve con
> la redirección de Cloudflare del paso 5.

## Antes de tocar el contenido

- El posicionamiento, las tres líneas y las condiciones que el sitio enuncia ("salida a 60 días",
  "sin exclusividad", "sin guardia por defecto") tienen que coincidir con
  `docs/maremoto/comercial/oferta-y-precios.md`. Si difieren, manda la carta de tarifas.
- **No publicar ningún caso de cliente identificable** sin permiso escrito del cliente y sin
  revisar el NDA vigente. La prueba actual está deliberadamente anonimizada.

## Historial

El landing anterior (efecto blob + link a Spawn) está preservado en el tag `v1-blob-landing`
y en la rama `legacy/v1-blob-landing`.
