/* Maremoto landing — tema, reveal, diagrama de flota, terminal y formulario. Sin dependencias. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Agenda publica (Cal.com u otro). Vacio = oculto; poner la URL la activa. */
  var AGENDA_URL = 'https://cal.com/maremoto';

  /* ---------- theme ---------- */
  var root = document.documentElement;
  var STORE = 'maremoto-theme';

  try {
    var saved = localStorage.getItem(STORE);
    if (saved === 'light' || saved === 'dark') root.setAttribute('data-theme', saved);
  } catch (e) { /* storage blocked — fall back to system preference */ }

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

  /* ---------- nav border on scroll ---------- */
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () {
      nav.classList.toggle('scrolled', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- scroll reveal ---------- */
  var items = document.querySelectorAll('.reveal');

  if (reduced || !('IntersectionObserver' in window)) {
    Array.prototype.forEach.call(items, function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        // stagger siblings so a grid animates in sequence, not all at once
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

  /* ---------- diagrama: un lider, una flota ---------- */
  (function swarm() {
    var linksG = document.getElementById('swarmLinks');
    var nodesG = document.getElementById('swarmNodes');
    if (!linksG || !nodesG) return;

    var NS = 'http://www.w3.org/2000/svg';
    var CX = 210, CY = 210, R = 152;
    var labels = ['CODIGO', 'PRUEBAS', 'DOCS', 'DESPLIEGUE', 'MONITOREO', 'SOPORTE'];
    var groups = [];

    labels.forEach(function (label, i) {
      var a = (-90 + i * (360 / labels.length)) * Math.PI / 180;
      var x = CX + R * Math.cos(a);
      var y = CY + R * Math.sin(a);

      var line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', CX); line.setAttribute('y1', CY);
      line.setAttribute('x2', x.toFixed(1)); line.setAttribute('y2', y.toFixed(1));
      linksG.appendChild(line);

      var beam = document.createElementNS(NS, 'line');
      beam.setAttribute('x1', CX); beam.setAttribute('y1', CY);
      beam.setAttribute('x2', x.toFixed(1)); beam.setAttribute('y2', y.toFixed(1));
      beam.setAttribute('class', 'beam');
      beam.style.animationDelay = (i * 0.46).toFixed(2) + 's';
      linksG.appendChild(beam);

      var g = document.createElementNS(NS, 'g');
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', x.toFixed(1)); ring.setAttribute('cy', y.toFixed(1));
      ring.setAttribute('r', 30); ring.setAttribute('class', 'node-ring');
      var t = document.createElementNS(NS, 'text');
      t.setAttribute('x', x.toFixed(1)); t.setAttribute('y', (y + 3.5).toFixed(1));
      t.textContent = label;
      g.appendChild(ring); g.appendChild(t);
      nodesG.appendChild(g);
      groups.push(g);
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

  /* ---------- GhostShell: tablero que avanza solo ---------- */
  (function board() {
    var kb = document.getElementById('kb');
    var shell = document.getElementById('shell');
    var act = document.getElementById('shellAct');
    if (!kb || !shell) return;

    var cols = Array.prototype.slice.call(kb.querySelectorAll('.kb-cards'));
    var nums = Array.prototype.slice.call(kb.querySelectorAll('.kb-n'));
    if (cols.length !== 4) return;

    // [titulo, meta, columna inicial]
    var TASKS = [
      ['Factura electronica al SII', 'ACME-142', 0],
      ['Recordatorio de pago por correo', 'ACME-147', 0],
      ['Panel de cobranzas', 'ACME-139', 1],
      ['Login con clave unica', 'ACME-131', 2],
      ['Alta de clientes en dos pasos', 'ACME-128', 3],
      ['Respaldos automaticos', 'ACME-119', 3]
    ];

    // lo que va entrando por la izquierda, para que el tablero no se vacie nunca
    var INCOMING = [
      'Exportar cartera a Excel',
      'Aviso de stock bajo',
      'Descuento por volumen',
      'Buscador con filtros',
      'Firma del contrato en linea',
      'Reporte mensual automatico'
    ];

    var ACTIVITY = [
      'agente 2 · escribiendo pruebas',
      'agente 1 · integrando el SII',
      'lider · revisando ACME-131',
      'agente 3 · documentando la decision',
      'agente 1 · desplegando a produccion',
      'lider · rechaza y pide un cambio'
    ];

    function card(t) {
      var el = document.createElement('article');
      el.className = 'kb-card';
      var b = document.createElement('b');
      b.textContent = t[0];
      var m = document.createElement('span');
      m.className = 'kb-meta';
      m.textContent = t[1];
      el.appendChild(b);
      el.appendChild(m);
      return el;
    }

    function paint() {
      cols.forEach(function (c, i) { nums[i].textContent = c.children.length; });
      cols.forEach(function (c, i) {
        Array.prototype.forEach.call(c.children, function (el) {
          el.classList.toggle('is-live', i === 1);
          el.classList.toggle('is-done', i === 3);
        });
      });
    }

    function build() {
      cols.forEach(function (c) { c.innerHTML = ''; });
      TASKS.forEach(function (t) { cols[t[2]].appendChild(card(t)); });
      paint();
    }

    build();
    if (reduced || !('IntersectionObserver' in window)) return;

    var runId = 0;
    var paused = true;
    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    async function loop() {
      var me = ++runId;
      var step = 0;
      var nextId = 148;
      var incoming = 0;

      while (me === runId) {
        while (paused) {
          await sleep(250);
          if (me !== runId) return;
        }

        // entra trabajo nuevo: el tablero de un cliente vivo nunca esta vacio
        if (cols[0].children.length < 2) {
          var t = [INCOMING[incoming % INCOMING.length], 'ACME-' + (nextId++), 0];
          incoming++;
          var fresh = card(t);
          fresh.classList.add('entering');
          cols[0].appendChild(fresh);
          paint();
          void fresh.offsetWidth;
          fresh.classList.remove('entering');
          await sleep(750);
          if (me !== runId) return;
        }

        // se archiva lo que ya lleva rato en Listo
        if (cols[3].children.length > 3) {
          var old = cols[3].firstElementChild;
          old.classList.add('leaving');
          await sleep(340);
          if (me !== runId) return;
          if (old.parentNode) old.parentNode.removeChild(old);
          paint();
        }

        // avanza la tarea mas a la derecha que todavia puede moverse
        var from = -1;
        for (var i = 2; i >= 0; i--) { if (cols[i].children.length) { from = i; break; } }
        if (from === -1) { await sleep(700); continue; }

        var el = cols[from].lastElementChild;
        if (act) act.textContent = ACTIVITY[step % ACTIVITY.length];
        step++;

        el.classList.add('leaving');
        await sleep(340);
        if (me !== runId) return;

        cols[from + 1].appendChild(el);
        el.classList.remove('leaving');
        el.classList.add('entering');
        paint();
        // reflow para que la transicion de entrada corra
        void el.offsetWidth;
        el.classList.remove('entering');

        await sleep(1800);
        if (me !== runId) return;
      }
    }

    var bio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { paused = !e.isIntersecting; });
    }, { threshold: 0.2 });
    bio.observe(shell);
    loop();
  })();

  /* ---------- terminal ilustrativa ---------- */
  (function terminal() {
    var body = document.getElementById('termBody');
    var box = document.getElementById('term');
    if (!body || !box) return;

    // Tres actos. Cada linea: [texto, clase, escribir-caracter-a-caracter]
    var ACTS = [
      // 1 — el gestor: todos tus proyectos en un comando
      [
        ['$ ', 't-pr', false],
        ['ware status', 't-cmd', true],
        ['\n\n  PROYECTO        RAMA    CAMBIOS   PRUEBAS   METODO', 't-dim', false],
        ['\n  acme-portal     main    limpio    ', 't-dim', false],
        ['268 ok', 't-ok', false],
        ['    al dia', 't-dim', false],
        ['\n  acme-api        main    2 sin subir  ', 't-dim', false],
        ['91 ok', 't-ok', false],
        ['     al dia', 't-dim', false],
        ['\n  acme-tienda     main    limpio    ', 't-dim', false],
        ['44 ok', 't-ok', false],
        ['     ', 't-dim', false],
        ['1 desvio', 't-warn', false],
        ['\n\n  ', 't-dim', false],
        ['Tres proyectos, un comando. El desvio ya tiene tarea abierta.', 't-dim', false]
      ],
      // 2 — el trabajo del dia
      [
        ['$ ', 't-pr', false],
        ['ghost tarea nueva "factura electronica al SII"', 't-cmd', true],
        ['\n  lider     ', 't-dim', false],
        ['alcance acotado · 2 integraciones · sin datos sensibles', 't-dim', false],
        ['\n  plan      ', 't-dim', false],
        ['4 subtareas · 6 pruebas nuevas · 1 decision a documentar', 't-dim', false],
        ['\n\n  agente 1  ', 't-acc', false],
        ['emision de documentos    ', 't-dim', false],
        ['ok', 't-ok', false],
        ['\n  agente 2  ', 't-acc', false],
        ['folios y reintentos      ', 't-dim', false],
        ['ok', 't-ok', false],
        ['\n  agente 3  ', 't-acc', false],
        ['pruebas de los dos casos ', 't-dim', false],
        ['ok', 't-ok', false],
        ['\n  agente 4  ', 't-acc', false],
        ['documenta el porque      ', 't-dim', false],
        ['ok', 't-ok', false],
        ['\n\n  pruebas   ', 't-dim', false],
        ['268 en verde', 't-ok', false],
        ['  ·  ninguna quedo sin correr', 't-dim', false],
        ['\n  revision  ', 't-dim', false],
        ['aprobada por el lider humano', 't-ok', false],
        ['\n  tablero   ', 't-dim', false],
        ['ACME-142 movida a Listo, con lo que se hizo', 't-dim', false]
      ],
      // 3 — entrega, y lo que sigue corriendo cuando nadie mira
      [
        ['$ ', 't-pr', false],
        ['ware release acme-portal --minor', 't-cmd', true],
        ['\n  version   ', 't-dim', false],
        ['1.4.0 -> 1.5.0', 't-acc', false],
        ['\n  notas     ', 't-dim', false],
        ['escritas desde las tareas cerradas, no a mano', 't-dim', false],
        ['\n  publicado ', 't-dim', false],
        ['14:41  ·  sin sacar el sitio de linea', 't-ok', false],
        ['\n\n$ ', 't-pr', false],
        ['ghost vigilancia', 't-cmd', true],
        ['\n  servicios ', 't-dim', false],
        ['3 en verde', 't-ok', false],
        ['  ·  ultimo incidente: ninguno en 41 dias', 't-dim', false],
        ['\n  respaldos ', 't-dim', false],
        ['diarios', 't-ok', false],
        ['  ·  restauracion probada el 09/08', 't-dim', false],
        ['\n  agente 5  ', 't-acc', false],
        ['nuevo, en modo sombra: propone, no ejecuta', 't-dim', false],
        ['\n\n  ', 't-dim', false],
        ['Esto corre igual un sabado a las 3 a.m.', 't-ok', false]
      ]
    ];

    var runId = 0;
    var paused = false;

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function render(parts, caret) {
      var html = parts.map(function (p) {
        return '<span class="' + p[1] + '">' + esc(p[0]) + '</span>';
      }).join('');
      body.innerHTML = html + (caret ? '<span class="term-caret"></span>' : '');
    }

    function esc(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function full() {
      var out = [];
      ACTS.forEach(function (act, i) {
        if (i) out.push(['\n\n', 't-dim']);
        act.forEach(function (l) { out.push([l[0], l[1]]); });
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
          if (line[2]) {
            shown.push(['', line[1]]);
            var cur = shown[shown.length - 1];
            for (var c = 0; c < line[0].length; c++) {
              while (paused) { await sleep(200); }
              cur[0] += line[0][c];
              render(shown, true);
              await sleep(24 + Math.random() * 30);
              if (me !== runId) return;
            }
            await sleep(400);
          } else {
            while (paused) { await sleep(200); }
            shown.push([line[0], line[1]]);
            render(shown, true);
            await sleep(line[0].indexOf('\n') === 0 ? 230 : 130);
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
      return;
    }

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

    var noteDefault = note ? note.innerHTML : '';

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();

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
        if (note) {
          note.className = 'f-note err';
          note.textContent = 'Falta tu nombre, un correo valido y una linea sobre lo que necesitas.';
        }
        var first = form.elements[missing[0]];
        if (first && first.focus) first.focus();
        return;
      }

      var body = [
        'Nombre y empresa: ' + nombre,
        'Correo: ' + mail,
        'Estado del producto: ' + (estado ? estado.value : 'no indicado'),
        'Plazo: ' + (plazo ? plazo.value : 'no indicado'),
        '',
        'Que necesita construir o arreglar:',
        que,
        '',
        '--',
        'Enviado desde maremoto.dev'
      ].join('\n');

      var href = 'mailto:julio@maremoto.dev'
        + '?subject=' + encodeURIComponent('Departamento de ingenieria - ' + nombre)
        + '&body=' + encodeURIComponent(body);

      if (note) {
        note.className = 'f-note ok';
        note.textContent = 'Abriendo tu correo con el mensaje escrito. Si no se abre, escribenos a julio@maremoto.dev.';
      }
      window.location.href = href;

      setTimeout(function () {
        if (note) { note.className = 'f-note'; note.innerHTML = noteDefault; }
      }, 9000);
    });

    form.addEventListener('input', function (ev) {
      if (ev.target.classList) ev.target.classList.remove('invalid');
    });
  })();

  /* ---------- agenda opcional ---------- */
  (function agenda() {
    var wrap = document.getElementById('agendaWrap');
    var link = document.getElementById('agendaLink');
    if (!wrap || !link || !AGENDA_URL) return;
    link.href = AGENDA_URL;
    link.target = '_blank';
    link.rel = 'noopener';
    wrap.hidden = false;
  })();

  /* ---------- year ---------- */
  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
