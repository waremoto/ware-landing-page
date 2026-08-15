# landing.md — el detalle del sitio

> Qué es cada parte de `maremoto.dev`, qué se decidió y qué queda pendiente. Es el documento de trabajo del
> landing: se edita cuando el sitio cambia. La referencia técnica larga —por qué cada pieza está construida
> así— vive fuera de este repo, en `d:/ware/docs/reference/landing-maremoto.md`.

**Estado:** en producción · sin build, sin dependencias, sin servidor de aplicación.

---

## 1 · Qué es

Un HTML, un CSS, un JS. Se despliega con `git push` a GitHub Pages y se sirve tras el proxy de Cloudflare.
El formulario de contacto no hace POST contra ningún servidor: arma un `mailto:` en el navegador. No hay
endpoint que proteger, que pagar, ni donde se pierdan mensajes en silencio.

| Archivo | Qué contiene |
|---|---|
| `index.html` | Todo el contenido, en secciones. El español vive aquí; el inglés viaja en atributos `data-en*` |
| `style.css` | Fuentes propias, tokens de color (claro y oscuro), y el diseño completo |
| `script.js` | Idioma, tema, revelado, el diagrama del hero, el tablero, la terminal, el formulario y la medición |
| `fonts/` | Tres familias variables, subconjuntos `latin` y `latin-ext`, servidas desde el propio dominio |
| `favicon.svg` · `og.png` · `icon-180.png` | La marca. Los tres se regeneran juntos o divergen |

## 2 · Las secciones, en orden

| # | Sección | Qué tiene que lograr |
|---|---|---|
| 1 | **Hero** | Decir qué es Maremoto en una frase, y mostrar el modelo: cuatro clientes, cada uno con su tablero, sus ingenieros y su flota, cada uno aislado |
| 2 | **El problema** | Tres sueldos que la empresa todavía no puede pagar. Termina en la tabla comparativa de tres caminos |
| 3 | **Cómo funciona** | El método: requerimientos, sprints, reunión semanal. Contiene el tablero en vivo con la línea del día |
| 4 | **Qué se contrata** | La rampa Fase 0–3 |
| 5 | **Cómo trabajamos** | Pruebas, documentación, trazabilidad. Con la terminal de tres actos |
| 6 | **Tu código** | El repositorio y el `LICENSE.md`: qué se cede y qué se licencia |
| 7 | **Financiamiento** | Cómo se paga |
| 8 | **Contacto** | Cuatro campos. El botón escribe el correo y abre la agenda |

## 3 · Las reglas que no se rompen

1. **Todo texto nuevo lleva su `data-en`.** Sin él se queda en español dentro de la versión en inglés, y
   nadie avisa. Vale para `data-en-html`, `-aria`, `-ph`, `-val` y `-h` según el caso.
2. **Toda promesa comercial se cruza contra `oferta-y-precios.md`.** Si divergen, manda la carta.
3. **Cero precios sin decisión explícita del operador.**
4. **Ningún caso de cliente identificable** sin permiso escrito y revisión del NDA vigente.
5. **El sitio no nombra la plataforma.** Donde hace falta, se la describe: *"nuestro sistema propio de
   orquestación modular"*. Los nombres internos se quedan puertas adentro.
6. **Tras cada `git push`, purgar la caché de la zona.** El HTML se cachea 5 minutos en el edge.

## 4 · Desplegar

```bash
git push origin main                       # 1 · GitHub Pages publica en ~30-60 s
curl -s "https://maremoto.dev/?cb=$RANDOM" | grep "lo que acabas de escribir"   # 2 · confirmar
# 3 · purgar la zona en Cloudflare (panel: Caching -> Configuration -> Purge Everything)
```

Purgar antes de que Pages termine vuelve a cachear la versión vieja. La purga no toca la caché del
navegador: para probar, recarga dura.

## 5 · Cambios del 2026-08-14

| # | Qué se pidió | Qué se hizo |
|---|---|---|
| 1 | Este documento | `landing.md` |
| 2 | Que las secciones tiendan a quedar centradas y que no haya aire muerto arriba | Ajuste de scroll por proximidad, alineado al inicio. El hero abría con hasta 120px de aire bajo la barra: ahora hasta 48px |
| 3 | Que el sitio se vea más chico en un MacBook a 100% | Escala tipográfica y de espaciado bajadas en bloque. El hero completo pasa a caber en 900px de alto |
| 4 | `contact@` en inglés, `contacto@` en español | Buzón por idioma en el formulario, en el enlace directo y en los datos estructurados |
| 5 | Que "Enviar y agendar" haga las dos cosas | Abre la agenda en otra pestaña y deja el correo escrito. La pestaña va primero: después del `mailto:` el navegador la bloquea |
| 6 | Que el titular en español quepa mejor | Tamaño propio para `[data-lang="es"]` en `h1`, `h2` y la barra, más `text-wrap: balance` |
| 7 | Revisar que el tema arranque según el sistema | Ya lo hacía. Se verificó en ambos sentidos y se agregó el `theme-color` claro que faltaba |

## 6 · La medición

Cuatro números, y ninguno más: **cuántos llegaron** (`visita`), **cuántos bajaron al formulario**
(`contacto_visto`), **cuántos lo enviaron** (`formulario_enviado`), **cuántos abrieron la agenda**
(`agenda_abierta`). Van a `POST api.maremoto.dev/v1/event` por `sendBeacon`. Sin eso, cualquier cambio a
esta página por "conversión" es superstición.

**Sin cookies y sin terceros.** Lo único que viaja es un `sid` al azar que genera este mismo archivo, vive
en `sessionStorage` y muere al cerrar la pestaña: sirve para saber si el que bajó al formulario es el mismo
que lo envió, y no sirve para nada más. Cada hito cuenta una vez por sesión.

Tres reglas que se rompen fácil:

1. **Medir nunca puede romper la página.** Todo va en `try`, y `sendBeacon` es fuego y olvido.
2. **Lo que no se puede medir bien no se inventa.** Sin `IntersectionObserver`, `contacto_visto` se deja sin
   contar en vez de darlo por visto.
3. **Un hito nuevo hay que agregarlo también en el backend** (`HITOS` en `src/lib/store.ts`). La lista es
   cerrada a propósito: el endpoint es público.

> **Decisión pendiente:** hoy la medición **no honra `Do Not Track`**. Lo que se guarda no es personal (un
> id de sesión al azar, el país, cero IP), pero para una empresa que vende confianza puede valer la pena
> respetarlo igual. Es una línea de código; queda a criterio del operador.

## 7 · Pendiente

| Qué | Estado |
|---|---|
| **Onboard de `send.maremoto.dev`** en Email Sending (panel de Cloudflare) | **Lo único que bloquea el formulario nuevo.** Al 2026-08-15 la zona no tiene ni un registro bajo `send.`. Ver `d:/ware/maremoto-api/README.md` |
| ~~Verificar `contacto@maremoto.dev` como destino~~ | Hecho el 2026-08-14 |
| ~~Desplegar el backend con la medición~~ | Hecho el 2026-08-15. `api.maremoto.dev` sirve `0.2.0` y los cuatro hitos escriben en D1 |
| Envío de correo real, sin depender del cliente de correo del visitante | Construido y desplegado en `api.maremoto.dev`. La rama `endpoint` de este repo lo conecta; no se mezcla hasta que los dos pasos de arriba estén |
| El H1 y el H2 dicen "un ingeniero" y la cifra dice "1-2" | Decisión de copy pendiente |
| Caso de cliente con nombre | Bloqueado por NDA |
| Modo demo con el tablero real, sólo lectura | En backlog por decisión del operador |
