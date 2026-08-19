/* ============================================================
   rail.js — paradas de scroll magneticas, medidas contra el viewport real.

   EL PROBLEMA CON `scroll-snap-align` EN LAS SECCIONES
   Enganchar la parada al borde de cada <section> funciona solo mientras la
   seccion quepa en pantalla. Las que no caben —aca la mitad, y mas todavia con
   un <details> abierto— quedan con una sola parada arriba: el salto siguiente
   se lleva al visitante al comienzo de la seccion que viene y el final de la
   anterior no lo ve nadie. Con `mandatory` es peor: el navegador se niega a
   dejarte quieto en el medio.

   LO QUE HACE ESTE ARCHIVO
   Mide cada bloque contra el alto util (viewport menos la barra) y lo parte en
   tantos tramos como haga falta para que NINGUN tramo sea mas alto que la
   pantalla. Los tramos se reparten parejos entre el inicio del bloque y el
   punto donde su final calza abajo, asi que la ultima parada de una seccion
   larga termina exactamente en su borde inferior: se recorre entera, de
   principio a fin, sin que quede una franja que solo se ve de pasada.

   Las paradas son marcas de 1px, absolutas y aria-hidden, dentro de un riel sin
   pointer-events. Se hace asi —y no moviendo el scroll a mano en cada rueda—
   porque el iman lo pone el navegador: la inercia del trackpad, el scrollbar y
   el teclado siguen siendo nativos, y el dia que se borre este archivo la
   pagina se scrollea igual que siempre.

   Se remide cuando cambia el tamanyo, cuando se abre o cierra un <details>, y
   cuando cambia el idioma (el espanyol corre 20-25% mas largo que el ingles:
   las mismas secciones, otras alturas).
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Bajo este alto no se engancha nada: en una pantalla baja casi todo es mas
     alto que la ventana y el iman solo estorbaria. Coincide con la media query
     de style.css a proposito. */
  var MIN_H = 640;

  var blocks = [];
  var stops = [];          /* offsets en coordenadas del documento */
  var marks = [];          /* los <i> del riel, uno por parada */
  var rail = null;
  var index = 0;           /* parada actual, para el panel de debug */
  var pending = -1;        /* destino en vuelo; -1 = ninguno */
  var pendingT = null;
  var measuredAt = '';     /* viewport con el que se midio lo que hay ahora */
  var quietUntil = 0;      /* ver onBodyResize: ventana sorda tras remedir */

  function navH() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h'));
    return isFinite(v) ? v : 68;
  }

  /* El descuento tiene que ser EXACTAMENTE el scroll-margin-top de las marcas,
     no "mas o menos la barra": el CSS usa calc(var(--nav-h) + .25rem) y esos
     4px de diferencia hacen que la tecla deje el scroll a 4px del punto donde
     el iman lo quiere, con un tironcito al soltar. Se lee del DOM para que la
     hoja siga siendo la duenya del valor. */
  var marginCache = -1;
  function margin() {
    if (marginCache >= 0) return marginCache;
    if (marks.length) {
      var v = parseFloat(getComputedStyle(marks[0]).scrollMarginTop);
      if (isFinite(v)) { marginCache = v; return v; }
    }
    return navH();
  }
  function usableH() { return Math.max(240, window.innerHeight - margin()); }

  function docTop(el) {
    var y = 0;
    for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  /* ---------- medir ----------

     Tres reglas, en este orden:

       1. ATOMOS. Hay cosas que no se parten: una animacion, una tabla
          comparativa, una grilla de tarjetas, un formulario. Cortarlas al medio
          es peor que gastar media pantalla en blanco. Se reconocen por selector
          o con data-rail="atom" a mano. Un atomo MAS ALTO que la pantalla si se
          abre — si no, quedaria una franja imposible de mirar entera.

       2. COSTURAS. Las paradas no salen de una division: se eligen entre los
          cortes que el contenido ya tiene (bordes de seccion, de hijo, de atomo)
          y se empaqueta glotonamente, la costura mas lejana que entre. Eso junta
          las secciones plegadas —seis teasers de 246px eran seis paradas casi
          vacias, ahora entran de a tres— y vuelve imposible cortar adentro de un
          atomo.

       3. PRESUPUESTO DE AIRE. Cuando a un paso le falta poco (<= TOL) para
          entrar, no se parte: se le baja --rail-squeeze a las secciones de ese
          paso hasta que entra. Medido en `como`: titulo 157px + animacion 624px
          = 876 contra 828 de pantalla. 48px. Antes eso eran dos paradas feas con
          la animacion cortada; ahora se recortan 48px de aire y es UN paso con
          la animacion entera.

          El aire cede; la tipografia no se toca nunca. Achicar texto cambia
          donde cortan las lineas, y entonces la altura no baja de forma
          predecible: el mismo -4% saca 12px o 80px segun si un titular pasa de
          tres lineas a dos. Un buscador iterando sobre eso oscila.
     -------------------------------------------------------------------- */

  var ATOM = 'figure, .compare, .shell, .how, .grid, .fit, .steps, .cform, .notnegotiable, [data-rail="atom"]';

  /* Cuanto se le permite pasarse a un paso antes de partirlo, si el aire da. */
  var TOL = 0.09;

  /* Niveles de compresion. Discretos y pocos a proposito: dos secciones con el
     mismo aprieto tienen que verse iguales, y un continuo daria cada una
     distinta. El piso es 0.80 —maximo 20% menos de aire— porque lo que se nota
     no es que una seccion este apretada sino que este apretada AL LADO de una
     que no: mas abajo la diferencia entre vecinas se lee como un error de
     maquetado. Lo que no se puede pagar con eso, se parte. */
  var LEVELS = [0.92, 0.86, 0.80];

  var squeezed = [];       /* secciones con el aire recortado, para el panel */

  function isAtom(el) { return el.matches && el.matches(ATOM); }

  /* Un <details> cerrado de esta landing NO borra su contenido: lo recorta. Los
     hijos siguen teniendo caja y coordenadas —una grilla de 418px que nadie ve—
     y si se los cuenta, bloquean costuras legitimas y ensucian el reparto. Lo
     que no se ve no participa. */
  function ghost(el) {
    return !el.offsetParent || !!(el.closest && el.closest('details:not([open])'));
  }

  function clearSqueeze() {
    squeezed.forEach(function (el) { el.style.removeProperty('--rail-squeeze'); });
    squeezed = [];
  }

  /* Las costuras guardan ELEMENTO Y BORDE, no una coordenada: al recortar aire
     todo se mueve, y una lista de numeros medidos antes del recorte apuntaria a
     cualquier lado. La `y` se calcula cuando se necesita. */
  function seamY(s) {
    var r = s.el.getBoundingClientRect();
    return Math.round((s.edge === 'top' ? r.top : r.bottom) + window.scrollY);
  }

  /* Los tramos verticales que ocupa cada atomo. Una costura que caiga ADENTRO de
     uno no es un corte valido aunque sea el borde real de otro elemento: en la
     seccion de contacto la columna izquierda termina a 6594 y el formulario de
     al lado va de 6200 a 6912, asi que cortar en 6594 —borde legitimo del
     vecino— parte el formulario por la mitad. Con una sola columna esto no
     pasa; con cualquier grid, pasa siempre. */
  function atomSpans() {
    var spans = [];
    blocks.forEach(function (b) {
      var list = b.querySelectorAll(ATOM);
      for (var i = 0; i < list.length; i++) {
        if (ghost(list[i])) continue;
        var r = list[i].getBoundingClientRect();
        if (r.height >= 8) spans.push([r.top + window.scrollY, r.bottom + window.scrollY]);
      }
    });
    return spans;
  }

  function crossesAtom(y, spans) {
    for (var i = 0; i < spans.length; i++) {
      if (y > spans[i][0] + 8 && y < spans[i][1] - 8) return true;
    }
    return false;
  }

  function collect() {
    var usable = usableH();
    var seams = [];
    function add(el, edge, w) { seams.push({ el: el, edge: edge, w: w }); }

    function walk(el, depth) {
      var kids = el.children, i, c, h, atom;
      for (i = 0; i < kids.length; i++) {
        c = kids[i];
        h = c.offsetHeight;
        if (h < 8 || ghost(c)) continue;
        atom = isAtom(c);
        add(c, 'top', atom ? 2 : 1);
        add(c, 'bottom', atom ? 2 : 1);
        /* Se entra si NO es atomo, o si es un atomo que no cabe en pantalla: ahi
           la integridad ya se perdio y lo unico util es poder recorrerlo. */
        if (depth < 2 && (!atom || h > usable)) walk(c, depth + 1);
      }
    }

    blocks.forEach(function (b) {
      add(b, 'top', 3);                    /* borde de seccion: costura fuerte */
      add(b, 'bottom', 3);
      walk(b.querySelector('.wrap') || b, 0);
    });
    return seams;
  }

  /* Empaquetado gloton. Devuelve pasos como PARES DE COSTURAS y no como numeros,
     para poder remedirlos despues de recortar aire. */
  function pack(seams, tolerate) {
    var usable = usableH();
    var spans = atomSpans();
    var list = seams.map(function (s) { return { s: s, y: seamY(s), w: s.w }; })
                    .filter(function (it) { return !crossesAtom(it.y, spans); })
                    .sort(function (a, b) { return a.y - b.y || b.w - a.w; });

    /* Dos costuras casi pegadas no son dos destinos. Gana la de mas peso. */
    var uniq = [];
    list.forEach(function (it) {
      var last = uniq[uniq.length - 1];
      if (last && it.y - last.y < 12) { last.w = Math.max(last.w, it.w); return; }
      uniq.push(it);
    });
    if (!uniq.length) return [];

    var docEnd = document.body.scrollHeight;
    var steps = [];
    var cur = uniq[0];
    var guard = 0;

    while (cur.y < docEnd - usable && guard++ < 400) {
      var reach = cur.y + usable;
      var reachTol = cur.y + usable * (1 + (tolerate ? TOL : 0));
      var pick = null, over = null;
      for (var i = 0; i < uniq.length; i++) {
        var it = uniq[i];
        if (it.y <= cur.y + 12) continue;
        if (it.y <= reach) pick = it;
        else if (it.y <= reachTol) {
          /* Pasarse solo se justifica por una costura FUERTE: el final de un
             atomo o de una seccion. Apretar la pagina para cerrar en un parrafo
             cualquiera es pagar sin comprar nada. */
          if (it.w >= 2 && !over) over = it;
        } else break;
      }
      var next = over || pick;
      if (!next) break;
      steps.push({ from: cur.s, to: next.s, over: next === over });
      cur = next;
    }
    steps.push({ from: cur.s, to: null, over: false });
    return steps;
  }

  /* Regla 3: pagar el exceso con aire, seccion por seccion, y solo si alcanza. */
  function payWithWhitespace(steps) {
    var usable = usableH();
    steps.forEach(function (st) {
      if (!st.over || !st.to) return;

      var y0 = seamY(st.from), y1 = seamY(st.to);
      var secs = blocks.filter(function (b) {
        var t = docTop(b);
        return t < y1 && t + b.offsetHeight > y0;
      });
      if (!secs.length) return;

      for (var l = 0; l < LEVELS.length; l++) {
        secs.forEach(function (b) {
          b.style.setProperty('--rail-squeeze', String(LEVELS[l]));
          if (squeezed.indexOf(b) < 0) squeezed.push(b);
        });
        if (seamY(st.to) - seamY(st.from) <= usable) return;    /* entro */
      }

      /* No alcanzo ni con el piso: devolver el aire. Apretar una seccion y
         ademas partirla es cobrar dos veces por el mismo paso. */
      secs.forEach(function (b) {
        b.style.removeProperty('--rail-squeeze');
        var i = squeezed.indexOf(b);
        if (i >= 0) squeezed.splice(i, 1);
      });
    });
  }

  /* Corre `y` fuera del atomo que lo contenga, al borde mas cercano, siempre que
     el desvio no rompa la cobertura (no mas de un 40% de pantalla). */
  function nudgeOffAtom(y, spans, usable) {
    for (var i = 0; i < spans.length; i++) {
      var a = spans[i];
      if (y > a[0] + 8 && y < a[1] - 8) {
        var up = a[0], down = a[1];
        var pick = (y - up <= down - y) ? up : down;
        if (Math.abs(pick - y) <= usable * 0.4) return Math.round(pick);
        return y;
      }
    }
    return y;
  }

  function measure() {
    clearSqueeze();
    payWithWhitespace(pack(collect(), true));

    /* Segunda pasada sobre la geometria ya recortada. Sin tolerancia: lo que se
       podia pagar con aire ya se pago; lo que sobra se parte y listo. */
    var out = pack(collect(), false).map(function (st) { return seamY(st.from); });

    var usable = usableH();
    var docEnd = document.body.scrollHeight;
    var spans = atomSpans();

    /* Cobertura — la promesa del riel: ninguna franja puede quedar sin verse
       entera en algun paso. Si dos paradas quedaron a mas de una pantalla se
       rellena, y si la ultima no llega al final del documento se agrega. */
    var full = [];
    for (var k = 0; k < out.length; k++) {
      full.push(out[k]);
      var gap = (k + 1 < out.length ? out[k + 1] : docEnd) - out[k];
      if (k + 1 < out.length && gap > usable) {
        var extra = Math.ceil(gap / usable) - 1;
        for (var e = 1; e <= extra; e++) {
          var at = Math.round(out[k] + gap * e / (extra + 1));
          /* El relleno existe para que no quede franja sin ver; si cae adentro
             de un atomo se corre al borde mas cercano que no lo parta. Y si ni
             asi, se deja igual: cubrir manda sobre no cortar — una franja
             invisible es peor que un corte feo. */
          full.push(nudgeOffAtom(at, spans, usable));
        }
      }
    }
    /* La ultima parada: el fondo del documento. Ojo con el caso del formulario
       de contacto — la parada de fondo cae 154px DENTRO de el, porque el form
       mas el pie no entran juntos en una pantalla. Se agregan las dos: una en el
       borde del atomo, donde se ve entero, y la del fondo, para llegar al final.
       Quedan cerca, pero son dos destinos distintos y cada uno muestra algo que
       el otro no. */
    var lastTarget = docEnd - window.innerHeight + margin();
    if (full.length && lastTarget - full[full.length - 1] > 40) {
      var snapped = nudgeOffAtom(lastTarget, spans, usable);
      if (snapped !== lastTarget) full.push(Math.round(snapped));
      full.push(Math.round(lastTarget));
    }

    full.sort(function (a, b) { return a - b; });
    var clean = [];
    for (var j = 0; j < full.length; j++) {
      if (!clean.length || full[j] - clean[clean.length - 1] > 80) clean.push(full[j]);
    }

    /* Ultimo pase, y el unico innegociable: DESPUES de correr paradas para no
       partir atomos, verificar que no quedo ninguna franja sin verse entera.
       Correr una parada al borde de un atomo puede abrir un hueco mas adelante
       —aparecio a 1280x720— y la cobertura manda sobre la integridad: una franja
       que nadie ve nunca es peor que un corte feo. Lo que se agrega aca es
       aritmetico a proposito: es la red, no el criterio. */
    var covered = [], bottom = 0;
    for (var c = 0; c < clean.length; c++) {
      var t = Math.max(0, clean[c] - margin());
      var guard2 = 0;
      while (t > bottom + 2 && guard2++ < 200) {
        covered.push(Math.round(bottom + margin()));
        bottom += usable;
      }
      covered.push(clean[c]);
      bottom = Math.max(bottom, t + usable);
    }

    /* Nada mas alla del fondo real. Una parada cuyo destino pase del scroll
       maximo es un destino fantasma: el navegador clampea, dos paradas terminan
       en el mismo pixel y el contador del panel se queda trabado. Se recortan y
       la ultima se fija exactamente en el fondo. */
    var maxTop = Math.max(0, docEnd - window.innerHeight) + margin();
    var outFinal = [];
    for (var f2 = 0; f2 < covered.length; f2++) {
      var v = Math.min(covered[f2], maxTop);
      if (!outFinal.length || v - outFinal[outFinal.length - 1] > 40) outFinal.push(v);
    }
    if (outFinal.length && outFinal[outFinal.length - 1] < maxTop - 40) outFinal.push(maxTop);
    return outFinal;
  }

  function render() {
    while (marks.length > stops.length) rail.removeChild(marks.pop());
    while (marks.length < stops.length) {
      var m = document.createElement('i');
      rail.appendChild(m);
      marks.push(m);
    }
    for (var i = 0; i < stops.length; i++) marks[i].style.top = stops[i] + 'px';
  }

  function refresh() {
    marginCache = -1;
    measuredAt = window.innerWidth + 'x' + window.innerHeight;
    if (window.innerHeight < MIN_H) {
      stops = [];
      render();
      root.classList.remove('has-rail');
      return;
    }
    stops = measure();
    render();
    root.classList.toggle('has-rail', stops.length > 1);
    track();
    quietUntil = Date.now() + 400;
  }

  /* ---------- navegacion ---------- */

  /* Donde queda el scroll cuando la parada i esta arriba. La marca lleva
     scroll-margin-top pero scrollTo no lo aplica, asi que el descuento se hace
     aca: el destino del teclado y el del iman tienen que ser el mismo punto. */
  function target(i) { return Math.max(0, stops[i] - margin()); }

  function nearest(y) {
    var best = 0, bestD = Infinity;
    for (var i = 0; i < stops.length; i++) {
      var d = Math.abs(target(i) - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function track() {
    if (stops.length) index = nearest(window.scrollY);
  }

  function smooth() {
    /* El modo quieto y prefers-reduced-motion apagan la animacion, no el salto:
       llegar al destino no es decoracion. */
    if (root.classList.contains('calm')) return 'auto';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function go(i) {
    if (!stops.length) return;
    i = Math.max(0, Math.min(stops.length - 1, i));
    pending = i;
    index = i;
    window.scrollTo({ top: target(i), behavior: smooth() });
    clearTimeout(pendingT);
    pendingT = setTimeout(function () { pending = -1; track(); }, 700);
  }

  /* Cancelar el encadenado. Mientras dura un salto, la cadena cuenta desde el
     destino; pero si en el medio la persona usa la rueda, el dedo o arrastra la
     barra, la cadena ya no vale y hay que volver a contar desde donde quedo.
     Sin esto: flecha abajo, arrastrar la barra a otra parte, flecha abajo, y la
     pagina salta HACIA ATRAS a la parada que seguia en la cadena vieja. */
  function drop() {
    if (pending < 0) return;
    pending = -1;
    clearTimeout(pendingT);
    track();
  }

  /* Un paso NO es "la parada mas cercana mas uno": con el scroll a mitad de
     camino entre dos, eso salta una. Es la primera parada que esta realmente
     mas alla de donde uno esta.

     Y si hay un salto en vuelo se cuenta desde el DESTINO, o mantener apretada
     la flecha avanza una sola parada mientras dura la animacion. */
  function step(dir) {
    if (!stops.length) return;
    if (pending >= 0) return go(pending + dir);

    var y = window.scrollY;
    var i;
    if (dir > 0) {
      for (i = 0; i < stops.length; i++) if (target(i) > y + 4) return go(i);
      return go(stops.length - 1);
    }
    for (i = stops.length - 1; i >= 0; i--) if (target(i) < y - 4) return go(i);
    return go(0);
  }

  function typing(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  /* Red de seguridad barata: si el viewport no es el que se midio, remedir antes
     de saltar. El evento `resize` y el ResizeObserver deberian bastar, pero uno
     de los dos puede no llegar —midiendo esto, una ventana que no compone
     frames no entrego ninguno de los dos— y una tecla que salta a una geometria
     vieja aterriza en cualquier parte. Cuesta una comparacion de strings. */
  function ensureFresh() {
    if (measuredAt !== window.innerWidth + 'x' + window.innerHeight) refresh();
  }

  function onKey(e) {
    ensureFresh();
    if (!stops.length) return;
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e.target)) return;
    /* El panel de debug es una herramienta con su propio foco: adentro las
       flechas son de quien las este usando ahi. */
    if (e.target && e.target.closest && e.target.closest('.dbg')) return;

    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown':
        e.preventDefault(); step(1); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); step(-1); break;
      case 'Home':
        e.preventDefault(); go(0); break;
      case 'End':
        e.preventDefault(); go(stops.length - 1); break;
    }
  }

  /* ---------- arranque ---------- */

  function start() {
    blocks = [].slice.call(document.querySelectorAll('.hero, .section'));
    if (!blocks.length) return;

    rail = document.createElement('div');
    rail.className = 'snap-rail';
    rail.setAttribute('aria-hidden', 'true');
    document.body.appendChild(rail);

    refresh();

    var t = null;
    function later() { clearTimeout(t); t = setTimeout(refresh, 120); }

    window.addEventListener('resize', later);
    document.addEventListener('maremoto:lang', later);           /* el idioma cambia las alturas */
    document.addEventListener('toggle', later, true);            /* <details> abierto o cerrado */
    /* El ResizeObserver del body NO puede llamar a later() derecho viejo: medir
       recorta aire, recortar aire cambia la altura del body, y eso dispara al
       observer otra vez — remedir para siempre. Tras cada medicion hay una
       ventana sorda; los cambios de verdad (resize de ventana, <details>,
       idioma) entran por sus propios eventos, que no la respetan. */
    if (window.ResizeObserver) {
      new ResizeObserver(function () {
        if (Date.now() < quietUntil) return;
        later();
      }).observe(document.body);
    }

    /* Las tres formas de medir mal, y su reparacion:
       - las tipografias propias entran con font-display:swap y mueven TODA la
         altura del documento cuando llegan;
       - las imagenes sin dimensiones hacen lo mismo al cargar (por eso `load`);
       - una pestanya que nunca se mostro reporta innerHeight 0 y todo el riel
         sale vacio, cosa que solo se descubre cuando alguien la mira.
       Ninguna es hipotetica: la tercera aparecio midiendo esto. */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
    window.addEventListener('load', later);
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) later();
    });

    document.addEventListener('keydown', onKey);

    /* Todo lo que sea scroll de la persona corta la cadena. Van en passive y
       solo tocan una variable. */
    ['wheel', 'touchstart', 'mousedown'].forEach(function (t) {
      window.addEventListener(t, drop, { passive: true });
    });

    /* Seguimiento de la parada actual con un TIMER y no con rAF. Una pestanya
       de fondo, una ventana tapada o minimizada no compone frames y rAF no
       dispara: el contador del panel se quedaba clavado en la primera parada
       mientras el scroll ya iba por la mitad de la pagina. Los timers siguen
       corriendo. (Es el mismo tropiezo que documenta ghostshell-style.md 6.1.) */
    var tick = null;
    window.addEventListener('scroll', function () {
      if (tick || pending >= 0) return;
      tick = setTimeout(function () { tick = null; track(); }, 90);
    }, { passive: true });

    /* Un enlace del menu apunta al medio de una parada: dejar que el hash haga
       lo suyo y despues alinear, sin animacion para no pelearle al navegador. */
    window.addEventListener('hashchange', function () { setTimeout(track, 60); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.maremotoRail = {
    get stops() { return stops.slice(); },
    get index() { return index; },
    get count() { return stops.length; },
    get squeezed() { return squeezed.length; },
    /* Para afinar el reparto desde la consola o el panel: las costuras que se
       encontraron y los pasos que salieron, con su altura real. */
    inspect: function () {
      var ss = collect();
      return {
        seams: ss.map(function (x) { return { y: seamY(x), w: x.w,
          el: x.el.tagName.toLowerCase() + '.' + String(x.el.className || '').split(' ')[0] + ':' + x.edge }; }),
        steps: pack(ss, true).map(function (st) {
          return { from: seamY(st.from), to: st.to ? seamY(st.to) : null, over: st.over };
        }),
        usable: usableH()
      };
    },
    go: go,
    drop: drop,
    next: function () { step(1); },
    prev: function () { step(-1); },
    refresh: refresh
  };
})();
