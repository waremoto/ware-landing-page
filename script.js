/* Maremoto landing — tema, reveal, diagrama de flota, terminal y formulario. Sin dependencias. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Agenda publica (Cal.com u otro). Vacio = oculto; poner la URL la activa. */
  var AGENDA_URL = '';

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

  /* ---------- terminal ilustrativa ---------- */
  (function terminal() {
    var body = document.getElementById('termBody');
    var box = document.getElementById('term');
    if (!body || !box) return;

    // [texto, clase, escribir-caracter-a-caracter]
    var SCRIPT = [
      ['$ ', 't-pr', false],
      ['ghost tarea nueva "factura electronica al SII"', 't-cmd', true],
      ['\n  lider    ', 't-dim', false],
      ['alcance acotado, 2 integraciones, sin datos sensibles', 't-dim', false],
      ['\n  plan     ', 't-dim', false],
      ['4 subtareas, 6 pruebas nuevas', 't-dim', false],
      ['\n\n  agente 1 ', 't-acc', false],
      ['implementa emision  ', 't-dim', false],
      ['ok', 't-ok', false],
      ['\n  agente 2 ', 't-acc', false],
      ['implementa folios   ', 't-dim', false],
      ['ok', 't-ok', false],
      ['\n  agente 3 ', 't-acc', false],
      ['escribe pruebas     ', 't-dim', false],
      ['ok', 't-ok', false],
      ['\n  agente 4 ', 't-acc', false],
      ['documenta decision  ', 't-dim', false],
      ['ok', 't-ok', false],
      ['\n\n  pruebas  ', 't-dim', false],
      ['268 en verde', 't-ok', false],
      ['  ·  cobertura 91%', 't-dim', false],
      ['\n  revision ', 't-dim', false],
      ['aprobada por el lider humano', 't-ok', false],
      ['\n  entrega  ', 't-dim', false],
      ['produccion 14:32  ·  visible en tu tablero', 't-dim', false],
      ['\n\n', 't-dim', false],
      ['listo. sin reunion de coordinacion, sin ticket perdido.', 't-ok', false]
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
      return SCRIPT.map(function (l) { return [l[0], l[1]]; });
    }

    async function run() {
      var me = ++runId;
      var shown = [];
      render(shown, true);
      await sleep(400);
      if (me !== runId) return;

      for (var i = 0; i < SCRIPT.length; i++) {
        var line = SCRIPT[i];
        if (line[2]) {
          shown.push(['', line[1]]);
          var cur = shown[shown.length - 1];
          for (var c = 0; c < line[0].length; c++) {
            while (paused) { await sleep(200); }
            cur[0] += line[0][c];
            render(shown, true);
            await sleep(26 + Math.random() * 34);
            if (me !== runId) return;
          }
          await sleep(420);
        } else {
          while (paused) { await sleep(200); }
          shown.push([line[0], line[1]]);
          render(shown, true);
          await sleep(line[0].indexOf('\n') === 0 ? 260 : 150);
        }
        if (me !== runId) return;
      }

      render(shown, true);
      await sleep(5200);
      if (me !== runId) return;
      run();
    }

    if (reduced || !('IntersectionObserver' in window)) {
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

      var href = 'mailto:julio@ware.cl'
        + '?subject=' + encodeURIComponent('Departamento de ingenieria - ' + nombre)
        + '&body=' + encodeURIComponent(body);

      if (note) {
        note.className = 'f-note ok';
        note.textContent = 'Abriendo tu correo con el mensaje escrito. Si no se abre, escribenos a julio@ware.cl.';
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
