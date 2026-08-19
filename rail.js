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

  /* Cuanto se solapan dos tramos consecutivos. Sin solape, una linea de texto
     puede caer justo en el corte y no leerse completa en ninguno de los dos. */
  var OVERLAP = 0.12;

  /* Un bloque que se pasa por menos que esto NO se parte: partir por 20px
     produce dos paradas casi identicas y un salto que parece un tiron. */
  var SLACK = 1.06;

  var blocks = [];
  var stops = [];          /* offsets en coordenadas del documento */
  var marks = [];          /* los <i> del riel, uno por parada */
  var rail = null;
  var index = 0;           /* parada actual, para el panel de debug */
  var pending = -1;        /* destino en vuelo; -1 = ninguno */
  var pendingT = null;
  var measuredAt = '';     /* viewport con el que se midio lo que hay ahora */

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

  /* ---------- medir ---------- */

  function measure() {
    var usable = usableH();
    var out = [];

    blocks.forEach(function (b) {
      var top = docTop(b);
      var h = b.offsetHeight;

      if (h <= usable * SLACK) { out.push(top); return; }

      /* Cuantos tramos hacen falta para que ninguno pase el alto util, contando
         el solape. Luego se reparten PAREJOS: el ultimo cae en (top + h -
         usable), o sea con el final del bloque calzado abajo. */
      var span = h - usable;
      var n = Math.max(2, Math.ceil(span / (usable * (1 - OVERLAP))) + 1);
      var step = span / (n - 1);
      for (var i = 0; i < n; i++) out.push(Math.round(top + i * step));
    });

    /* Ordenar y descartar paradas pegadas: dos marcas a 30px una de otra no son
       dos destinos, son un destino con ruido. */
    out.sort(function (a, b) { return a - b; });
    var clean = [];
    for (var j = 0; j < out.length; j++) {
      if (!clean.length || out[j] - clean[clean.length - 1] > 80) clean.push(out[j]);
    }

    /* Costura entre bloques. Cada bloque queda bien cubierto por si mismo, pero
       el salto de la ultima parada de uno a la primera del siguiente puede pasar
       el alto util —medido: 854px contra 832 de pantalla— y esa franja de 22px
       no se ve entera en ninguna de las dos. Se rellena. Es la diferencia entre
       "casi todo el mapa" y el mapa. */
    var full = [];
    for (var k = 0; k < clean.length; k++) {
      full.push(clean[k]);
      if (k + 1 < clean.length) {
        var gap = clean[k + 1] - clean[k];
        if (gap > usable) {
          var extra = Math.ceil(gap / usable) - 1;
          for (var e = 1; e <= extra; e++) full.push(Math.round(clean[k] + gap * e / (extra + 1)));
        }
      }
    }
    return full;
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
    if (window.ResizeObserver) new ResizeObserver(later).observe(document.body);

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
    go: go,
    drop: drop,
    next: function () { step(1); },
    prev: function () { step(-1); },
    refresh: refresh
  };
})();
