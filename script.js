/* Maremoto landing — idioma, tema, reveal, flota, tablero, terminal y formulario. Sin dependencias. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* Agenda publica. Vacio = el boton no existe. */
  var AGENDA_URL = 'https://cal.com/maremoto';

  /* ============================================================
     IDIOMA
     El espanol vive en el HTML; el ingles viaja en data-en*.
     ============================================================ */
  var LANG_STORE = 'maremoto-lang';
  var lang = 'es';

  var META = {
    es: {
      title: 'Maremoto — Somos tu departamento de ingeniería de software',
      desc: 'Tu empresa necesita software, no necesita contratar a tres personas para construirlo. Arquitectura, desarrollo, infraestructura y soporte, a cargo de un ingeniero de software.'
    },
    en: {
      title: 'Maremoto — We are your software engineering department',
      desc: 'Your company needs software; it does not need to hire three people to build it. Architecture, development, infrastructure and support, run by a software engineer.'
    }
  };

  function stash(el, key, value) {
    if (el.getAttribute(key) === null) el.setAttribute(key, value);
  }

  function applyLang(next) {
    lang = next === 'en' ? 'en' : 'es';
    var en = lang === 'en';

    root.setAttribute('lang', lang);
    root.setAttribute('data-lang', lang);
    document.title = META[lang].title;
    var md = document.getElementById('metaDesc');
    if (md) md.setAttribute('content', META[lang].desc);

    Array.prototype.forEach.call(document.querySelectorAll('[data-en]'), function (el) {
      stash(el, 'data-es', el.textContent);
      el.textContent = en ? el.getAttribute('data-en') : el.getAttribute('data-es');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-en-html]'), function (el) {
      stash(el, 'data-es-html', el.innerHTML);
      el.innerHTML = en ? el.getAttribute('data-en-html') : el.getAttribute('data-es-html');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-en-aria]'), function (el) {
      stash(el, 'data-es-aria', el.getAttribute('aria-label') || '');
      el.setAttribute('aria-label', en ? el.getAttribute('data-en-aria') : el.getAttribute('data-es-aria'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-en-ph]'), function (el) {
      stash(el, 'data-es-ph', el.getAttribute('placeholder') || '');
      el.setAttribute('placeholder', en ? el.getAttribute('data-en-ph') : el.getAttribute('data-es-ph'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-en-h]'), function (el) {
      stash(el, 'data-es-h', el.getAttribute('data-h') || '');
      el.setAttribute('data-h', en ? el.getAttribute('data-en-h') : el.getAttribute('data-es-h'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-en-val]'), function (el) {
      stash(el, 'data-es-val', el.value);
      el.value = en ? el.getAttribute('data-en-val') : el.getAttribute('data-es-val');
    });

    try { localStorage.setItem(LANG_STORE, lang); } catch (e) { /* ignore */ }

    // lo que se dibuja desde JS se vuelve a dibujar en el idioma nuevo
    document.dispatchEvent(new CustomEvent('maremoto:lang', { detail: lang }));
  }

  function t(pair) { return lang === 'en' ? pair[1] : pair[0]; }

  (function initLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_STORE); } catch (e) { /* ignore */ }
    if (saved !== 'es' && saved !== 'en') {
      var nav = (navigator.language || 'es').toLowerCase();
      saved = nav.indexOf('es') === 0 ? 'es' : 'en';
    }
    applyLang(saved);

    var btn = document.getElementById('langToggle');
    if (btn) {
      btn.addEventListener('click', function () {
        applyLang(lang === 'es' ? 'en' : 'es');
      });
    }
  })();

  /* ---------- tema ---------- */
  var STORE = 'maremoto-theme';

  try {
    var savedTheme = localStorage.getItem(STORE);
    if (savedTheme === 'light' || savedTheme === 'dark') root.setAttribute('data-theme', savedTheme);
  } catch (e) { /* storage bloqueado: manda la preferencia del sistema */ }

  var toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var systemLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      var current = root.getAttribute('data-theme') || (systemLight ? 'light' : 'dark');
      var next = current === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORE, next); } catch (e) { /* ignore */ }
    });
  }

  /* ---------- borde del nav al hacer scroll ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- reveal ---------- */
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = Array.prototype.slice.call(el.parentNode.children).filter(function (n) {
          return n.classList && n.classList.contains('reveal');
        });
        var i = Math.max(0, siblings.indexOf(el));
        el.style.transitionDelay = Math.min(i * 70, 350) + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    Array.prototype.forEach.call(items, function (el) { io.observe(el); });
  }

  /* ---------- diagrama: un ingeniero, una flota ---------- */
  (function swarm() {
    var linksG = document.getElementById('swarmLinks');
    var nodesG = document.getElementById('swarmNodes');
    if (!linksG || !nodesG) return;

    var NS = 'http://www.w3.org/2000/svg';
    var CX = 210, CY = 210, R = 152;
    var LABELS = [
      ['CODIGO', 'CODE'], ['PRUEBAS', 'TESTS'], ['DOCS', 'DOCS'],
      ['DESPLIEGUE', 'DEPLOY'], ['MONITOREO', 'MONITOR'], ['SOPORTE', 'SUPPORT']
    ];
    var groups = [], texts = [];

    LABELS.forEach(function (pair, i) {
      var a = (-90 + i * (360 / LABELS.length)) * Math.PI / 180;
      var x = CX + R * Math.cos(a);
      var y = CY + R * Math.sin(a);

      [false, true].forEach(function (isBeam) {
        var ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', CX); ln.setAttribute('y1', CY);
        ln.setAttribute('x2', x.toFixed(1)); ln.setAttribute('y2', y.toFixed(1));
        if (isBeam) {
          ln.setAttribute('class', 'beam');
          ln.style.animationDelay = (i * 0.46).toFixed(2) + 's';
        }
        linksG.appendChild(ln);
      });

      var g = document.createElementNS(NS, 'g');
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', x.toFixed(1)); ring.setAttribute('cy', y.toFixed(1));
      ring.setAttribute('r', 30); ring.setAttribute('class', 'node-ring');
      var tx = document.createElementNS(NS, 'text');
      tx.setAttribute('x', x.toFixed(1)); tx.setAttribute('y', (y + 3.5).toFixed(1));
      tx.textContent = t(pair);
      g.appendChild(ring); g.appendChild(tx);
      nodesG.appendChild(g);
      groups.push(g); texts.push([tx, pair]);
    });

    document.addEventListener('maremoto:lang', function () {
      texts.forEach(function (pair) { pair[0].textContent = t(pair[1]); });
    });

    if (reduced) { groups[0].setAttribute('class', 'node-live'); return; }

    var live = 0;
    setInterval(function () {
      groups.forEach(function (g) { g.setAttribute('class', ''); });
      groups[live].setAttribute('class', 'node-live');
      groups[(live + 3) % groups.length].setAttribute('class', 'node-live');
      live = (live + 1) % groups.length;
    }, 1400);
  })();

  /* ============================================================
     EL TABLERO
     Columnas: 0 backlog · 1 en progreso · 2 en revision · 3 finalizado.
     Los avatares con anillo girando son los agentes que estan
     trabajando en esa tarjeta ahora mismo.
     ============================================================ */
  (function board() {
    var kb = document.getElementById('kb');
    var shell = document.getElementById('shell');
    var actEl = document.getElementById('shellAct');
    var botsEl = document.getElementById('mBots');
    if (!kb || !shell) return;

    var cols = Array.prototype.slice.call(kb.querySelectorAll('.kb-cards'));
    var nums = Array.prototype.slice.call(kb.querySelectorAll('.kb-n'));
    if (cols.length !== 4) return;

    var STATES = ['backlog', 'doing', 'review', 'done'];
    var BOTS = ['A1', 'A2', 'A3', 'A4', 'A5'];
    var HUMAN = 'JL';

    // [titulo es, titulo en, etiqueta, id, columna, cuantos agentes]
    var SEED = [
      ['Factura electrónica al SII', 'Electronic invoicing (tax authority)', 'int', 142, 1, 3],
      ['Panel de cobranzas', 'Collections dashboard', '', 139, 1, 2],
      ['Login con clave única', 'Single sign-on login', 'int', 131, 2, 2],
      ['Recordatorio de pago por correo', 'Payment reminder by email', '', 147, 0, 0],
      ['Duplicados al importar rutas', 'Duplicates on route import', 'bug', 151, 0, 0],
      ['Alta de clientes en dos pasos', 'Two-step customer sign-up', '', 128, 3, 0],
      ['Respaldos automáticos', 'Automated backups', 'inf', 119, 3, 0]
    ];

    var INCOMING = [
      ['Exportar cartera a Excel', 'Export portfolio to Excel', ''],
      ['Aviso de stock bajo', 'Low stock alert', ''],
      ['Descuento por volumen', 'Volume discount', ''],
      ['Guías de despacho electrónicas', 'Electronic dispatch notes', 'int'],
      ['Timeout al consultar el ERP', 'Timeout when querying the ERP', 'bug'],
      ['Reporte mensual automático', 'Automated monthly report', '']
    ];

    var TAGS = {
      int: ['integración', 'integration'],
      bug: ['bug', 'bug'],
      inf: ['infra', 'infra'],
      '': ['producto', 'product']
    };

    var ACTIVITY = [
      ['{a} escribe las pruebas de AND-142', '{a} is writing tests for AND-142'],
      ['{a} y {b} implementan en paralelo', '{a} and {b} are implementing in parallel'],
      ['{a} corre la suite completa: 268 en verde', '{a} ran the full suite: 268 green'],
      ['el ingeniero revisa AND-131', 'the engineer is reviewing AND-131'],
      ['el ingeniero devuelve AND-139 con un cambio', 'the engineer sent AND-139 back with one change'],
      ['{a} documenta la decisión y cierra la tarea', '{a} documented the decision and closed the task'],
      ['{a} despliega a producción', '{a} is deploying to production']
    ];

    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

    function avatar(label, cls) {
      var el = document.createElement('span');
      el.className = 'av ' + cls;
      el.textContent = label;
      return el;
    }

    function card(task) {
      var el = document.createElement('article');
      el.className = 'kb-card';
      el._task = task;

      var top = document.createElement('div');
      top.className = 'kb-top';
      var tag = document.createElement('span');
      tag.className = 'kb-tag' + (task.tag ? ' t-' + task.tag : '');
      tag.textContent = t(TAGS[task.tag] || TAGS['']);
      var id = document.createElement('span');
      id.className = 'kb-id';
      id.textContent = 'AND-' + task.id;
      top.appendChild(tag); top.appendChild(id);

      var title = document.createElement('span');
      title.className = 'kb-title';
      title.textContent = t([task.es, task.en]);

      el.appendChild(top);
      el.appendChild(title);
      dressUp(el, task);
      return el;
    }

    // el aspecto de la tarjeta depende de la columna donde esta
    function dressUp(el, task) {
      var old = el.querySelector('.kb-bot');
      if (old) el.removeChild(old);
      var sweep = el.querySelector('.kb-sweep');
      if (sweep) el.removeChild(sweep);
      el.classList.remove('st-doing', 'st-review', 'st-done');

      var state = STATES[task.col];
      if (state === 'backlog') return;

      el.classList.add('st-' + state);

      var bot = document.createElement('div');
      bot.className = 'kb-bot';
      var avs = document.createElement('div');
      avs.className = 'kb-avs';

      if (state === 'doing') {
        for (var i = 0; i < Math.max(1, task.bots); i++) {
          avs.appendChild(avatar(BOTS[(task.id + i) % BOTS.length], 'av-bot on'));
        }
        bot.appendChild(avs);
        var prog = document.createElement('span');
        prog.className = 'kb-prog';
        var fill = document.createElement('i');
        prog.appendChild(fill);
        bot.appendChild(prog);
        // la barra arranca baja y sube mientras la tarjeta sigue en esta columna
        setTimeout(function () { fill.style.width = (55 + Math.round(Math.random() * 35)) + '%'; }, 260);

        var sw = document.createElement('span');
        sw.className = 'kb-sweep';
        el.appendChild(sw);
      } else if (state === 'review') {
        avs.appendChild(avatar(BOTS[task.id % BOTS.length], 'av-bot rev on'));
        avs.appendChild(avatar(HUMAN, 'av-human'));
        bot.appendChild(avs);
        var rv = document.createElement('span');
        rv.className = 'kb-prog';
        var rf = document.createElement('i');
        rf.style.width = '100%';
        rv.appendChild(rf);
        bot.appendChild(rv);
      } else {
        avs.appendChild(avatar(HUMAN, 'av-human'));
        bot.appendChild(avs);
        var ok = document.createElement('span');
        ok.className = 'kb-check';
        ok.innerHTML = CHECK;
        bot.appendChild(ok);
      }

      el.appendChild(bot);
    }

    function paint() {
      cols.forEach(function (c, i) { nums[i].textContent = c.children.length; });
      if (botsEl) {
        var working = kb.querySelectorAll('.av-bot.on').length;
        botsEl.textContent = working;
      }
    }

    var tasks = [];
    function build() {
      tasks = SEED.map(function (r) {
        return { es: r[0], en: r[1], tag: r[2], id: r[3], col: r[4], bots: r[5] };
      });
      cols.forEach(function (c) { c.innerHTML = ''; });
      tasks.forEach(function (task) { cols[task.col].appendChild(card(task)); });
      paint();
    }

    function relabel() {
      Array.prototype.forEach.call(kb.querySelectorAll('.kb-card'), function (el) {
        var task = el._task;
        if (!task) return;
        el.querySelector('.kb-title').textContent = t([task.es, task.en]);
        el.querySelector('.kb-tag').textContent = t(TAGS[task.tag] || TAGS['']);
      });
      if (actEl && actEl._pair) actEl.textContent = fill(actEl._pair);
    }

    function fill(pair) {
      return t(pair)
        .replace('{a}', BOTS[Math.floor(Math.random() * 3)])
        .replace('{b}', BOTS[3 + Math.floor(Math.random() * 2)]);
    }

    function say(pair) {
      if (!actEl) return;
      actEl._pair = pair;
      actEl.textContent = fill(pair);
    }

    build();
    say(ACTIVITY[0]);
    document.addEventListener('maremoto:lang', relabel);

    if (reduced || !('IntersectionObserver' in window)) return;

    var runId = 0;
    var paused = true;
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    async function loop() {
      var me = ++runId;
      var step = 0;
      var nextId = 152;
      var incoming = 0;

      while (me === runId) {
        while (paused) {
          await sleep(250);
          if (me !== runId) return;
        }

        // entra trabajo nuevo: el tablero de un cliente vivo nunca esta vacio
        if (cols[0].children.length < 2) {
          var src = INCOMING[incoming % INCOMING.length];
          incoming++;
          var fresh = { es: src[0], en: src[1], tag: src[2], id: nextId++, col: 0, bots: 0 };
          var fel = card(fresh);
          fel.classList.add('entering');
          cols[0].appendChild(fel);
          paint();
          void fel.offsetWidth;
          fel.classList.remove('entering');
          await sleep(700);
          if (me !== runId) return;
        }

        // se archiva lo que ya lleva rato terminado
        if (cols[3].children.length > 3) {
          var old = cols[3].firstElementChild;
          old.classList.add('leaving');
          await sleep(340);
          if (me !== runId) return;
          if (old.parentNode) old.parentNode.removeChild(old);
          paint();
        }

        // Se alimenta el embudo antes de vaciarlo: primero se llena "en progreso",
        // luego "en revision", y solo entonces se cierra. Asi el tablero se ve como
        // un equipo trabajando y no como una fila que se desagua.
        var from = -1;
        if (cols[1].children.length < 2 && cols[0].children.length) from = 0;
        else if (cols[2].children.length < 2 && cols[1].children.length) from = 1;
        else if (cols[2].children.length) from = 2;
        else if (cols[1].children.length) from = 1;
        else if (cols[0].children.length) from = 0;
        if (from === -1) { await sleep(700); continue; }

        var el = cols[from].lastElementChild;
        var task = el._task;

        say(ACTIVITY[step % ACTIVITY.length]);
        step++;

        el.classList.add('leaving');
        await sleep(340);
        if (me !== runId) return;

        task.col = from + 1;
        if (task.col === 1) task.bots = 1 + Math.floor(Math.random() * 3);
        dressUp(el, task);
        cols[task.col].appendChild(el);
        el.classList.remove('leaving');
        el.classList.add('entering');
        paint();
        void el.offsetWidth;
        el.classList.remove('entering');
        el.classList.add('landed');
        (function (moved) {
          setTimeout(function () { moved.classList.remove('landed'); }, 700);
        })(el);

        await sleep(from === 0 ? 1500 : 2400);
        if (me !== runId) return;
      }
    }

    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { paused = !e.isIntersecting; });
    }, { threshold: 0.15 });
    bio.observe(shell);
    loop();
  })();

  /* ---------- LICENSE.md del repositorio ---------- */
  (function repoFile() {
    var pre = document.getElementById('repoFile');
    if (!pre) return;

    var ES = [
      ['## 1 · El producto', 'c'],
      ['\nTitular: ', ''], ['Andina Logística SpA', 'b'], ['.\n', ''],
      ['Cada entregable se cede al pagarse su factura.\nIncluye código, infraestructura como código,\ndatos, credenciales y documentación.\n\n', ''],
      ['## 2 · La plataforma', 'c'],
      ['\nGhostWare ', ''], ['no', 'b'], [' entra en la cesión.\nLicencia comercial ', ''], ['perpetua', 'b'],
      [', no exclusiva,\npara seguir operando el producto — también\nsi te vas.\n\n', ''],
      ['## 3 · Terceros', 'c'],
      ['\nCada dependencia conserva su licencia\n(MIT, Apache-2.0, PostgreSQL…), como en\ncualquier software del mundo.', '']
    ];
    var EN = [
      ['## 1 · The product', 'c'],
      ['\nOwner: ', ''], ['Andina Logística SpA', 'b'], ['.\n', ''],
      ['Each deliverable is assigned once its invoice\nis paid. Code, infrastructure as code, data,\ncredentials and documentation included.\n\n', ''],
      ['## 2 · The platform', 'c'],
      ['\nGhostWare is ', ''], ['not', 'b'], [' part of the assignment.\nA ', ''], ['perpetual', 'b'],
      [', non-exclusive commercial\nlicence to keep operating the product —\nincluding after you leave.\n\n', ''],
      ['## 3 · Third parties', 'c'],
      ['\nEvery dependency keeps its own licence\n(MIT, Apache-2.0, PostgreSQL…), as in any\nsoftware in the world.', '']
    ];

    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

    function render() {
      var src = lang === 'en' ? EN : ES;
      pre.innerHTML = src.map(function (p) {
        return p[1] ? '<span class="' + p[1] + '">' + esc(p[0]) + '</span>' : esc(p[0]);
      }).join('');
    }

    render();
    document.addEventListener('maremoto:lang', render);
  })();

  /* ---------- terminal: tres actos ---------- */
  (function terminal() {
    var body = document.getElementById('termBody');
    var box = document.getElementById('term');
    if (!body || !box) return;

    // cada linea: [es, en, clase, escribir-caracter-a-caracter]
    var ACTS = [
      [
        ['$ ', '$ ', 't-pr', false],
        ['ware status', 'ware status', 't-cmd', true],
        ['\n\n  PROYECTO        RAMA    CAMBIOS      PRUEBAS   METODO',
         '\n\n  PROJECT         BRANCH  CHANGES      TESTS     METHOD', 't-dim', false],
        ['\n  andina-portal   main    limpio       ', '\n  andina-portal   main    clean        ', 't-dim', false],
        ['268 ok', '268 ok', 't-ok', false],
        ['    al dia', '    up to date', 't-dim', false],
        ['\n  andina-api      main    2 sin subir  ', '\n  andina-api      main    2 unpushed   ', 't-dim', false],
        ['91 ok', '91 ok', 't-ok', false],
        ['     al dia', '     up to date', 't-dim', false],
        ['\n  andina-tienda   main    limpio       ', '\n  andina-store    main    clean        ', 't-dim', false],
        ['44 ok', '44 ok', 't-ok', false],
        ['     ', '     ', 't-dim', false],
        ['1 desvio', '1 drift', 't-warn', false],
        ['\n\n  ', '\n\n  ', 't-dim', false],
        ['Tres proyectos, un comando. El desvio ya tiene tarea abierta.',
         'Three projects, one command. The drift already has a task open.', 't-dim', false]
      ],
      [
        ['$ ', '$ ', 't-pr', false],
        ['ghost tarea nueva "factura electronica al SII"', 'ghost task new "electronic invoicing"', 't-cmd', true],
        ['\n  ingeniero ', '\n  engineer  ', 't-dim', false],
        ['alcance acotado · 2 integraciones · sin datos sensibles',
         'bounded scope · 2 integrations · no sensitive data', 't-dim', false],
        ['\n  plan      ', '\n  plan      ', 't-dim', false],
        ['4 subtareas · 6 pruebas nuevas · 1 decision a documentar',
         '4 subtasks · 6 new tests · 1 decision to document', 't-dim', false],
        ['\n\n  A1  ', '\n\n  A1  ', 't-acc', false],
        ['emision de documentos    ', 'document issuing         ', 't-dim', false],
        ['ok', 'ok', 't-ok', false],
        ['\n  A2  ', '\n  A2  ', 't-acc', false],
        ['folios y reintentos      ', 'folios and retries       ', 't-dim', false],
        ['ok', 'ok', 't-ok', false],
        ['\n  A3  ', '\n  A3  ', 't-acc', false],
        ['pruebas de los dos casos ', 'tests for both cases     ', 't-dim', false],
        ['ok', 'ok', 't-ok', false],
        ['\n  A4  ', '\n  A4  ', 't-acc', false],
        ['documenta el porque      ', 'documents the reasoning  ', 't-dim', false],
        ['ok', 'ok', 't-ok', false],
        ['\n\n  pruebas   ', '\n\n  tests     ', 't-dim', false],
        ['268 en verde', '268 green', 't-ok', false],
        ['  ·  ninguna quedo sin correr', '  ·  none skipped', 't-dim', false],
        ['\n  revision  ', '\n  review    ', 't-dim', false],
        ['aprobada por el ingeniero humano', 'approved by the human engineer', 't-ok', false],
        ['\n  tablero   ', '\n  board     ', 't-dim', false],
        ['AND-142 movida a Finalizado, con lo que se hizo',
         'AND-142 moved to Done, with what was done', 't-dim', false]
      ],
      [
        ['$ ', '$ ', 't-pr', false],
        ['ware release andina-portal --minor', 'ware release andina-portal --minor', 't-cmd', true],
        ['\n  version   ', '\n  version   ', 't-dim', false],
        ['1.4.0 -> 1.5.0', '1.4.0 -> 1.5.0', 't-acc', false],
        ['\n  notas     ', '\n  notes     ', 't-dim', false],
        ['escritas desde las tareas cerradas, no a mano',
         'written from the closed tasks, not by hand', 't-dim', false],
        ['\n  publicado ', '\n  shipped   ', 't-dim', false],
        ['14:41  ·  sin sacar el sitio de linea', '14:41  ·  no downtime', 't-ok', false],
        ['\n\n$ ', '\n\n$ ', 't-pr', false],
        ['ghost vigilancia', 'ghost watch', 't-cmd', true],
        ['\n  servicios ', '\n  services  ', 't-dim', false],
        ['3 en verde', '3 green', 't-ok', false],
        ['  ·  ultimo incidente: ninguno en 41 dias', '  ·  last incident: none in 41 days', 't-dim', false],
        ['\n  respaldos ', '\n  backups   ', 't-dim', false],
        ['diarios', 'daily', 't-ok', false],
        ['  ·  restauracion probada el 09/08', '  ·  restore tested on 09/08', 't-dim', false],
        ['\n  A5        ', '\n  A5        ', 't-acc', false],
        ['agente nuevo, en modo sombra: propone, no ejecuta',
         'new agent, in shadow mode: proposes, does not execute', 't-dim', false],
        ['\n\n  ', '\n\n  ', 't-dim', false],
        ['Esto corre igual un sabado a las 3 a.m.', 'This runs the same at 3 a.m. on a Saturday.', 't-ok', false]
      ]
    ];

    var runId = 0;
    var paused = false;

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
    function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function text(line) { return lang === 'en' ? line[1] : line[0]; }

    function render(parts, caret) {
      body.innerHTML = parts.map(function (p) {
        return '<span class="' + p[1] + '">' + esc(p[0]) + '</span>';
      }).join('') + (caret ? '<span class="term-caret"></span>' : '');
    }

    function full() {
      var out = [];
      ACTS.forEach(function (act, i) {
        if (i) out.push(['\n\n', 't-dim']);
        act.forEach(function (l) { out.push([text(l), l[2]]); });
      });
      return out;
    }

    async function run() {
      var me = ++runId;

      for (var a = 0; a < ACTS.length; a++) {
        var act = ACTS[a];
        var shown = [];
        render(shown, true);
        await sleep(a === 0 ? 400 : 700);
        if (me !== runId) return;

        for (var i = 0; i < act.length; i++) {
          var line = act[i];
          var str = text(line);
          if (line[3]) {
            shown.push(['', line[2]]);
            var cur = shown[shown.length - 1];
            for (var c = 0; c < str.length; c++) {
              while (paused) { await sleep(200); }
              cur[0] += str[c];
              render(shown, true);
              await sleep(24 + Math.random() * 30);
              if (me !== runId) return;
            }
            await sleep(400);
          } else {
            while (paused) { await sleep(200); }
            shown.push([str, line[2]]);
            render(shown, true);
            await sleep(str.indexOf('\n') === 0 ? 230 : 130);
          }
          if (me !== runId) return;
        }

        render(shown, true);
        await sleep(a === ACTS.length - 1 ? 5200 : 3400);
        if (me !== runId) return;
      }

      run();
    }

    if (reduced || !('IntersectionObserver' in window)) {
      box.classList.add('term-static');
      render(full(), false);
      document.addEventListener('maremoto:lang', function () { render(full(), false); });
      return;
    }

    // cambiar de idioma reinicia la escena en el idioma nuevo
    document.addEventListener('maremoto:lang', function () { if (started) run(); });

    var started = false;
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        paused = !e.isIntersecting;
        if (e.isIntersecting && !started) { started = true; run(); }
      });
    }, { threshold: 0.25 });
    tio.observe(box);
  })();

  /* ---------- formulario -> correo con la ficha ya escrita ---------- */
  (function contactForm() {
    var form = document.getElementById('cform');
    var note = document.getElementById('fNote');
    if (!form) return;

    var COPY = {
      es: {
        missing: 'Falta tu nombre, un correo valido y una linea sobre lo que necesitas.',
        opening: 'Abriendo tu correo con el mensaje escrito. Si no se abre, escribenos a julio@maremoto.dev.',
        subject: 'Departamento de ingenieria - ',
        labels: ['Nombre y empresa', 'Correo', 'Estado del producto', 'Plazo', 'Que necesita construir o arreglar', 'no indicado', 'Enviado desde maremoto.dev']
      },
      en: {
        missing: 'We need your name, a valid email and one line about what you need.',
        opening: 'Opening your email client with the message written. If it does not open, write to julio@maremoto.dev.',
        subject: 'Software engineering department - ',
        labels: ['Name and company', 'Email', 'Product state', 'Timeline', 'What they need built or fixed', 'not given', 'Sent from maremoto.dev']
      }
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var c = COPY[lang];

      var nombre = form.elements['nombre'].value.trim();
      var mail = form.elements['mail'].value.trim();
      var que = form.elements['que'].value.trim();
      var estado = form.querySelector('input[name="estado"]:checked');
      var plazo = form.querySelector('input[name="plazo"]:checked');

      var missing = [];
      [['nombre', nombre], ['mail', mail], ['que', que]].forEach(function (f) {
        var el = form.elements[f[0]];
        var bad = !f[1] || (f[0] === 'mail' && f[1].indexOf('@') < 1);
        el.classList.toggle('invalid', bad);
        if (bad) missing.push(f[0]);
      });

      if (missing.length) {
        if (note) { note.className = 'f-note err'; note.textContent = c.missing; }
        var first = form.elements[missing[0]];
        if (first && first.focus) first.focus();
        return;
      }

      var body = [
        c.labels[0] + ': ' + nombre,
        c.labels[1] + ': ' + mail,
        c.labels[2] + ': ' + (estado ? estado.value : c.labels[5]),
        c.labels[3] + ': ' + (plazo ? plazo.value : c.labels[5]),
        '',
        c.labels[4] + ':',
        que,
        '',
        '--',
        c.labels[6]
      ].join('\n');

      var href = 'mailto:julio@maremoto.dev'
        + '?subject=' + encodeURIComponent(c.subject + nombre)
        + '&body=' + encodeURIComponent(body);

      if (note) { note.className = 'f-note ok'; note.textContent = c.opening; }
      window.location.href = href;

      setTimeout(function () {
        if (!note) return;
        note.className = 'f-note';
        note.textContent = lang === 'en' ? note.getAttribute('data-en') : note.getAttribute('data-es');
      }, 9000);
    });

    form.addEventListener('input', function (ev) {
      if (ev.target.classList) ev.target.classList.remove('invalid');
    });
  })();

  /* ---------- agenda ---------- */
  (function agenda() {
    var wrap = document.getElementById('agendaWrap');
    var link = document.getElementById('agendaLink');
    if (!wrap || !link || !AGENDA_URL) return;
    link.href = AGENDA_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    wrap.hidden = false;
  })();

  /* ---------- año ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
