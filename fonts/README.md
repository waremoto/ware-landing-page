# Fuentes

Tres familias variables, servidas desde este dominio. **No hay ninguna petición a Google** — ni CSS ni
`gstatic`: se descargaron una vez y viven en el repositorio. Eso quita el bloqueo de render (~1,2 s medidos
con Lighthouse) y saca un tercero del camino entre el visitante y el sitio.

| Archivo | Familia | Pesos | Licencia |
|---|---|---|---|
| `space-grotesk-*.woff2` | Space Grotesk | 500–700 (variable) | SIL Open Font License 1.1 |
| `inter-*.woff2` | Inter | 400–600 (variable) | SIL Open Font License 1.1 |
| `jetbrains-mono-*.woff2` | JetBrains Mono | 400–500 (variable) | SIL Open Font License 1.1 |

Las tres son OFL 1.1: se pueden redistribuir e incrustar en un sitio web, incluso comercial, siempre que no
se vendan por separado y se conserve la licencia. Texto completo:
<https://openfontlicense.org/open-font-license-official-text/>.

Cada familia trae dos subconjuntos, `latin` y `latin-ext`, separados por `unicode-range` — el navegador
descarga `latin-ext` sólo si la página usa algún carácter de ese rango. Los `@font-face` están al principio
de [`../style.css`](../style.css); las dos fuentes de la primera pantalla van con `<link rel="preload">` en
[`../index.html`](../index.html).

## Actualizarlas

```bash
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
curl -A "$UA" "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500..700&family=Inter:wght@400..600&family=JetBrains+Mono:wght@400..500&display=swap"
```

El User-Agent moderno es lo que hace que Google devuelva `woff2` variable en vez de `ttf`. De la respuesta se
conservan sólo los bloques `latin` y `latin-ext`, se descargan sus `.woff2` acá y se reemplazan las URLs por
rutas locales.
