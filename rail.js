/* ============================================================
   rail.js — el teclado avanza de seccion en seccion, alineando el TOPE
   de cada una con el tope util de la pantalla (bajo la barra).

   Antes este archivo media cada bloque contra el viewport y lo partia en
   tantos tramos como hiciera falta para que ninguno quedara cortado — con
   costuras, atomos y un presupuesto de aire para pagar el excedente. Eso
   daba paradas prolijas pero eran muchas, y el criterio de "que se ve
   entero" no es el que importa: lo que importa es "donde arranca cada
   seccion". Ahora la parada es una sola por seccion, en su borde superior.
   Si la seccion no entra completa en la pantalla, se corta — a proposito.
   La gente scrollea a mano para ver el resto; el teclado solo salta al
   PROXIMO TITULO, no intenta mostrar cada parrafo.

   El iman al soltar el mouse/trackpad sigue siendo CSS puro
   (`scroll-snap-align: start` en .hero/.section, ver style.css) — este
   archivo no lo toca. Solo anyade la navegacion por teclado entre esas
   mismas paradas, usando el mismo scroll-margin-top que ya define el CSS
   para que ambos caminos terminen en el mismo pixel.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;

  /* Bajo este alto casi todo es mas alto que la ventana y saltar de
     seccion en seccion no ayuda: coincide con la media query de
     style.css a proposito. */
  var MIN_H = 640;

  var blocks = [];
  var index = 0;
  var pending = -1;
  var pendingT = null;

  function navH() {
    var v = parseFloat(getComputedStyle(root).getPropertyValue('--nav-h'));
    return isFinite(v) ? v : 68;
  }

  /* Mismo descuento que usa el CSS (`scroll-margin-top`), leido del DOM
     para que la hoja de estilos siga siendo la duenya del valor. */
  function margin() {
    if (blocks.length) {
      var v = parseFloat(getComputedStyle(blocks[0]).scrollMarginTop);
      if (isFinite(v)) return v;
    }
    return navH();
  }

  function docTop(el) {
    var y = 0;
    for (var n = el; n; n = n.offsetParent) y += n.offsetTop;
    return y;
  }

  function active() { return window.innerHeight >= MIN_H && blocks.length > 1; }

  /* Destino de la parada i: el tope de la seccion, menos el margen que ya
     descuenta el CSS. */
  function target(i) {
    if (!blocks[i]) return 0;
    return Math.max(0, docTop(blocks[i]) - margin());
  }

  function nearest(y) {
    var best = 0, bestD = Infinity;
    for (var i = 0; i < blocks.length; i++) {
      var d = Math.abs(target(i) - y);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

  function track() { index = nearest(window.scrollY); }

  function smooth() {
    if (root.classList.contains('calm')) return 'auto';
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  }

  function go(i) {
    if (!active()) return;
    i = Math.max(0, Math.min(blocks.length - 1, i));
    pending = i;
    index = i;
    window.scrollTo({ top: target(i), behavior: smooth() });
    clearTimeout(pendingT);
    pendingT = setTimeout(function () { pending = -1; track(); }, 700);
  }

  /* Cancelar el encadenado si la persona toma el control a mitad de un
     salto — rueda, dedo o arrastre de la barra. Sin esto, flecha abajo +
     arrastrar la barra + flecha abajo salta HACIA ATRAS a la parada que
     seguia en la cadena vieja. */
  function drop() {
    if (pending < 0) return;
    pending = -1;
    clearTimeout(pendingT);
    track();
  }

  /* Un paso es la primera seccion cuyo tope esta realmente mas alla de
     donde uno esta — no "la mas cercana mas una", que con el scroll a
     mitad de camino saltaria una. Con un salto en vuelo, se cuenta desde
     el destino de ese salto. */
  function step(dir) {
    if (!active()) return;
    if (pending >= 0) return go(pending + dir);

    var y = window.scrollY;
    var i;
    if (dir > 0) {
      for (i = 0; i < blocks.length; i++) if (target(i) > y + 4) return go(i);
      return go(blocks.length - 1);
    }
    for (i = blocks.length - 1; i >= 0; i--) if (target(i) < y - 4) return go(i);
    return go(0);
  }

  function typing(el) {
    if (!el) return false;
    var tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  function onKey(e) {
    if (!active()) return;
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
    if (typing(e.target)) return;
    if (e.target && e.target.closest && e.target.closest('.dbg')) return;

    switch (e.key) {
      case 'ArrowDown': case 'ArrowRight': case 'PageDown':
        e.preventDefault(); step(1); break;
      case 'ArrowUp': case 'ArrowLeft': case 'PageUp':
        e.preventDefault(); step(-1); break;
      case 'Home':
        e.preventDefault(); go(0); break;
      case 'End':
        e.preventDefault(); go(blocks.length - 1); break;
    }
  }

  function start() {
    blocks = [].slice.call(document.querySelectorAll('.hero, .section'));
    if (!blocks.length) return;

    track();

    var t = null;
    function later() { clearTimeout(t); t = setTimeout(track, 120); }
    window.addEventListener('resize', later);
    document.addEventListener('maremoto:lang', later);   /* el idioma cambia las alturas */

    document.addEventListener('keydown', onKey);

    ['wheel', 'touchstart', 'mousedown'].forEach(function (t2) {
      window.addEventListener(t2, drop, { passive: true });
    });

    var tick = null;
    window.addEventListener('scroll', function () {
      if (tick || pending >= 0) return;
      tick = setTimeout(function () { tick = null; track(); }, 90);
    }, { passive: true });

    window.addEventListener('hashchange', function () { setTimeout(track, 60); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.maremotoRail = {
    get index() { return index; },
    get count() { return blocks.length; },
    go: go,
    drop: drop,
    next: function () { step(1); },
    prev: function () { step(-1); }
  };
})();
