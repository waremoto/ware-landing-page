/* ============================================================
   theme.js — modo, paleta y panel de debug.

   Se carga BLOQUEANTE en el <head> de cada pagina, antes que el CSS pinte:
   con defer, la pagina aparece un frame con la paleta por defecto y despues
   salta. Son ~5 KB sin dependencias, ese es el trato.

   Dos ejes, ambos atributos del elemento raiz (ver style.css):
     data-theme   = "light" | "dark"      (ausente: manda el sistema)
     data-palette = clave de PALETTES     (ausente: DEFAULTS.palette)

   El visitante solo ve el boton de modo en la barra. La paleta vive en el
   panel de debug — Ctrl+Alt+D, o ?debug=1 en la URL — porque es una
   herramienta de trabajo, no una preferencia que haya que explicarle a nadie.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var K_MODE = 'maremoto-theme';      /* clave historica: valores "light"/"dark" */
  var K_PAL  = 'maremoto-palette';
  var K_CALM = 'maremoto-calm';
  var K_LANG = 'maremoto-lang';       /* la escribe script.js; aca solo se lee/limpia */

  /* ============================================================
     LO QUE VE ALGUIEN QUE NUNCA TOCO NADA.
     Este es el unico lugar donde se define el sitio por defecto. Cualquier
     preferencia guardada gana sobre esto; borrar localStorage vuelve aca.

       palette  clave de PALETTES
       mode     'auto' (sigue al sistema) | 'light' | 'dark'
       lang     'auto' (sigue a navigator.language) | 'es' | 'en'
       calm     true = sin movimiento ambiental

     `palette` esta duplicado a proposito en tools/gen_palettes.py (DEFAULT):
     el CSS tiene que servir la misma paleta cuando el JS no corre. Si cambias
     uno, regenera el otro — el bloque :root:not([data-palette]) del CSS es
     exactamente ese fallback.
     ============================================================ */
  var DEFAULTS = {
    palette: 'default',
    mode: 'auto',
    lang: 'auto',
    calm: false
  };

  /* La paleta de marca primero; las seis siguientes son las de GhostShell, en
     el mismo orden que la tabla de ghostshell-style.md seccion 3.1. */
  var PALETTES = [
    { key: 'maremoto',    label: 'Maremoto',     note: 'marca' },
    { key: 'default',     label: 'Ghost',        note: 'mono, maximo contraste' },
    { key: 'monochrome',  label: 'Monochrome',   note: 'grises' },
    { key: 'ocean',       label: 'Ocean',        note: 'azul' },
    { key: 'warm',        label: 'Warm',         note: 'ambar' },
    { key: 'rose',        label: 'Rose',         note: 'carmin' },
    { key: 'lowcontrast', label: 'Low Contrast', note: 'suave — no cumple AA' }
  ];
  var KEYS = PALETTES.map(function (p) { return p.key; });

  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function write(k, v) {
    /* En modo privado escribir tira. Un panel de debug no puede ser jamas el
       motivo por el que una pagina no carga. */
    try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* ignore */ }
  }

  /* ---------- estado ---------- */

  function getMode() {
    var m = root.getAttribute('data-theme');
    return m === 'light' || m === 'dark' ? m : 'auto';
  }
  function systemMode() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function effectiveMode() {
    var m = getMode();
    return m === 'auto' ? systemMode() : m;
  }
  function setMode(mode) {
    /* 'auto' no es un valor del atributo sino su ausencia: asi el CSS puede
       resolverlo con prefers-color-scheme sin que JS tenga que reaccionar. */
    if (mode !== 'light' && mode !== 'dark') mode = 'auto';
    if (mode === 'auto') {
      root.removeAttribute('data-theme');
      if (DEFAULTS.mode !== 'auto') root.setAttribute('data-theme', DEFAULTS.mode);
      write(K_MODE, null);
    } else {
      root.setAttribute('data-theme', mode);
      write(K_MODE, mode);
    }
    sync();
  }
  function getPalette() { return root.getAttribute('data-palette') || DEFAULTS.palette; }
  function setPalette(key) {
    if (KEYS.indexOf(key) < 0) return;
    root.setAttribute('data-palette', key);
    write(K_PAL, key);
    sync();
  }
  /* ---------- idioma ----------
     script.js es el dueny del cambio de idioma (tiene las tablas y redibuja los
     diagramas); aca vive solo la preferencia de tres estados, porque el boton de
     la barra es un interruptor de dos y no puede expresar "auto". */
  function getLang() {
    var v = read(K_LANG);
    return v === 'es' || v === 'en' ? v : 'auto';
  }
  function systemLang() {
    var nav = (navigator.language || 'es').toLowerCase();
    return nav.indexOf('es') === 0 ? 'es' : 'en';
  }
  function effectiveLang() {
    var v = getLang();
    if (v !== 'auto') return v;
    return DEFAULTS.lang === 'auto' ? systemLang() : DEFAULTS.lang;
  }
  function setLang(pref) {
    if (pref !== 'es' && pref !== 'en') pref = 'auto';
    if (pref === 'auto') write(K_LANG, null); else write(K_LANG, pref);
    /* Sin script.js no hay traducciones que aplicar (las paginas SEO son
       ES-only): se guarda la preferencia para el resto del sitio y no se toca
       el atributo, que ahi diria un idioma que la pagina no tiene. */
    if (window.maremotoLang) window.maremotoLang.apply(effectiveLang());
    sync();
  }

  function getCalm() { return root.classList.contains('calm'); }
  function setCalm(on) {
    root.classList.toggle('calm', !!on);
    write(K_CALM, on ? '1' : null);
    sync();
  }

  /* ---------- pre-paint ---------- */

  /* Se estampa SIEMPRE, tambien cuando no hay nada guardado: el DOM queda
     diciendo la verdad de lo que se esta pintando, y el bloque
     :root:not([data-palette]) del CSS pasa a ser solo el camino sin JS. */
  var savedPal = read(K_PAL);
  root.setAttribute('data-palette', savedPal && KEYS.indexOf(savedPal) >= 0 ? savedPal : DEFAULTS.palette);

  var savedMode = read(K_MODE);
  if (savedMode === 'light' || savedMode === 'dark') root.setAttribute('data-theme', savedMode);
  else if (DEFAULTS.mode !== 'auto') root.setAttribute('data-theme', DEFAULTS.mode);

  if (read(K_CALM) === '1' || (DEFAULTS.calm && read(K_CALM) === null)) root.classList.add('calm');

  /* ---------- contraste medido ---------- */

  /* Se mide contra el fondo que quedo pintado, no se declara. Un hex mal
     copiado en una paleta se ve aca y en ningun otro lugar. */
  function toRgb(v) {
    v = (v || '').trim();
    var m = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (m) {
      var h = m[1];
      if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
      return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 1];
    }
    m = v.match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    var p = m[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1];
  }
  function lum(c) {
    var f = c.slice(0, 3).map(function (x) {
      x /= 255;
      return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  }
  function contrast(fgVar, bgVar) {
    var cs = getComputedStyle(root);
    var fg = toRgb(cs.getPropertyValue(fgVar));
    var bg = toRgb(cs.getPropertyValue(bgVar));
    if (!fg || !bg) return null;
    if (fg[3] < 1) {  /* un hairline rgba se compone sobre el fondo antes de medir */
      fg = [0, 1, 2].map(function (i) { return fg[i] * fg[3] + bg[i] * (1 - fg[3]); }).concat(1);
    }
    var a = lum(fg), b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  function round(x) { return x == null ? null : Math.round(x * 100) / 100; }

  /* ---------- panel ---------- */

  var panel = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function segment(label, options, get, set) {
    var row = el('div', 'dbg-row');
    row.appendChild(el('span', 'dbg-label', label));
    var seg = el('div', 'dbg-seg');
    options.forEach(function (o) {
      var b = el('button', 'dbg-seg-btn', o.label);
      b.type = 'button';
      b.setAttribute('data-value', o.value);
      b.addEventListener('click', function () { set(o.value); });
      seg.appendChild(b);
    });
    row.appendChild(seg);
    row._sync = function () {
      var v = get();
      Array.prototype.forEach.call(seg.children, function (b) {
        b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === v));
      });
    };
    return row;
  }

  function build() {
    var p = el('aside', 'dbg');
    p.id = 'debugPanel';
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-label', 'Panel de debug');

    var head = el('header', 'dbg-head');
    head.appendChild(el('span', 'dbg-title', 'debug'));
    head.appendChild(el('span', 'dbg-hint', 'Ctrl+Alt+D'));
    var close = el('button', 'dbg-x', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Cerrar');
    close.addEventListener('click', function () { toggle(false); });
    head.appendChild(close);
    p.appendChild(head);

    var body = el('div', 'dbg-body');

    body.appendChild(el('span', 'dbg-label', 'paleta'));
    var grid = el('div', 'dbg-grid');
    PALETTES.forEach(function (def) {
      var b = el('button', 'dbg-pal');
      b.type = 'button';
      b.setAttribute('data-value', def.key);
      b.title = def.note;
      /* La muestra se pinta CON la paleta que ofrece — el propio [data-palette]
         redefine los --g-* dentro del boton, asi que es el color real y no una
         copia que puede quedar desincronizada. */
      var sw = el('span', 'dbg-sw');
      sw.setAttribute('data-palette', def.key);
      sw.appendChild(el('i', 'dbg-sw-bg'));
      sw.appendChild(el('i', 'dbg-sw-ac'));
      sw.appendChild(el('i', 'dbg-sw-ink'));
      b.appendChild(sw);
      b.appendChild(el('span', 'dbg-pal-name', def.label));
      b.addEventListener('click', function () { setPalette(def.key); });
      grid.appendChild(b);
    });
    body.appendChild(grid);
    p._grid = grid;

    var rows = [];
    rows.push(segment('modo', [
      { value: 'auto',  label: 'auto' },
      { value: 'light', label: 'claro' },
      { value: 'dark',  label: 'oscuro' }
    ], getMode, setMode));

    rows.push(segment('movimiento', [
      { value: 'on',   label: 'normal' },
      { value: 'calm', label: 'quieto' }
    ], function () { return getCalm() ? 'calm' : 'on'; },
       function (v) { setCalm(v === 'calm'); }));

    /* Tres estados, como el modo: el boton de la barra solo sabe ES/EN, asi que
       'auto' — volver a seguir a navigator.language — solo se recupera aca.
       La fila no se dibuja en las paginas que no traen script.js (las SEO son
       ES-only) porque ahi el control no tendria nada que cambiar. */
    if (window.maremotoLang) {
      rows.push(segment('idioma', [
        { value: 'auto', label: 'auto' },
        { value: 'es',   label: 'ES' },
        { value: 'en',   label: 'EN' }
      ], getLang, setLang));
    }

    rows.forEach(function (r) { body.appendChild(r); });
    p._rows = rows;

    var meas = el('div', 'dbg-meas');
    body.appendChild(meas);
    p._meas = meas;

    var copy = el('button', 'dbg-copy', 'copiar estado JSON');
    copy.type = 'button';
    copy.addEventListener('click', function () {
      var txt = JSON.stringify(state(), null, 2);
      if (navigator.clipboard) navigator.clipboard.writeText(txt);
      copy.textContent = 'copiado';
      setTimeout(function () { copy.textContent = 'copiar estado JSON'; }, 1200);
    });
    body.appendChild(copy);

    p.appendChild(body);
    document.body.appendChild(p);
    return p;
  }

  var MEASURED = [['fg', '--fg'], ['fg-2', '--fg-2'], ['fg-3', '--fg-3'], ['accent', '--accent']];

  function state() {
    var c = {};
    MEASURED.forEach(function (pair) { c[pair[0]] = round(contrast(pair[1], '--ink')); });
    return {
      palette: getPalette(),
      mode: getMode(),
      effectiveMode: effectiveMode(),
      calm: getCalm(),
      lang: getLang(),
      /* En una pagina sin traducciones el idioma efectivo es el que declara el
         documento, no el que preferiria el visitante. */
      effectiveLang: window.maremotoLang ? window.maremotoLang.current() : (root.getAttribute('lang') || effectiveLang()),
      contrastVsBg: c,
      viewport: window.innerWidth + 'x' + window.innerHeight,
      /* Lo que veria alguien sin nada guardado — para poder comparar de un
         vistazo si lo que estas mirando es el sitio o tu propia preferencia. */
      siteDefaults: DEFAULTS,
      ua: navigator.userAgent
    };
  }

  function sync() {
    if (!panel) return;
    Array.prototype.forEach.call(panel._grid.children, function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-value') === getPalette()));
    });
    panel._rows.forEach(function (r) { r._sync(); });

    /* Contraste de cada nivel de tinta contra el fondo real. AA texto = 4.5:1.
       lowcontrast falla a proposito — reproduce el default viejo de GhostShell. */
    panel._meas.innerHTML = '';
    panel._meas.appendChild(el('span', 'dbg-label', 'contraste vs fondo'));
    var list = el('ul', 'dbg-list');
    MEASURED.forEach(function (pair) {
      var r = contrast(pair[1], '--ink');
      var li = el('li');
      li.appendChild(el('span', 'dbg-k', pair[0]));
      var v = el('span', 'dbg-v', r == null ? '—' : round(r).toFixed(2) + ':1');
      if (r != null) v.setAttribute('data-ok', String(r >= 4.5));
      li.appendChild(v);
      list.appendChild(li);
    });
    panel._meas.appendChild(list);
  }

  function toggle(force) {
    if (!panel) panel = build();
    var open = force == null ? !panel.classList.contains('open') : !!force;
    panel.classList.toggle('open', open);
    if (open) sync();
  }

  /* ---------- entradas ---------- */

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && panel && panel.classList.contains('open')) { toggle(false); return; }
    /* e.code y no e.key: con Alt apretado el layout puede entregar otro caracter.
       Ctrl+Alt+D y no Ctrl+Shift+D, que en Chrome es "marcar todas las pestanyas". */
    if ((e.ctrlKey || e.metaKey) && e.altKey && e.code === 'KeyD') {
      e.preventDefault();
      toggle();
    }
  });

  function start() {
    var btn = document.getElementById('themeToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        setMode(effectiveMode() === 'dark' ? 'light' : 'dark');
      });
    }
    /* Con modo auto, seguir al sistema cuando cambia (el CSS ya lo hace solo;
       esto es para que el panel no muestre una lectura vieja). */
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: light)');
      var onChange = function () { if (getMode() === 'auto') sync(); };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    if (/[?&]debug=1(&|$)/.test(location.search)) toggle(true);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  window.maremotoTheme = {
    palettes: PALETTES,
    get: state,
    defaults: DEFAULTS,
    setMode: setMode,
    setPalette: setPalette,
    setLang: setLang,
    setCalm: setCalm,
    toggleDebug: toggle
  };
})();
