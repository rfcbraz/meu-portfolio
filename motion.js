/*
 * Movimento do site: scroll suave, títulos, cores das secções, buracos da abertura
 * e o percurso do queijo. Se este ficheiro falhar, o site continua legível e funcional.
 */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;

  var gsap = window.gsap;
  var ScrollTrigger = window.ScrollTrigger;
  gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var root = document.documentElement;
  var body = document.body;
  var hero = document.querySelector('.hero');
  var reveal = document.querySelector('.hero-reveal');

  root.classList.add('motion');

  var CODE = [
    'const filipe = new Developer({',
    '  stack: ["React", "Node.js", "TypeScript", "Flutter"],',
    '  combustivel: "queijo",',
    '});',
    '',
    'async function criarProduto(ideia) {',
    '  const plano = await filipe.perceber(ideia);',
    '  const app = await filipe.construir(plano);',
    '',
    '  while (!app.funciona()) {',
    '    filipe.corrigir(app);',
    '    queijo.comer();',
    '  }',
    '',
    '  return app.publicar();',
    '}',
    '',
    'export const contacto = () => "Vamos falar?";',
    ''
  ].join('\n');

  /* ---------- Scroll suave ---------- */

  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  document.addEventListener('site:modal', function (e) {
    if (!lenis) return;
    if (e.detail.open) lenis.stop(); else lenis.start();
  });

  document.addEventListener('click', function (e) {
    var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!link || link.classList.contains('email-trigger')) return;
    var hash = link.getAttribute('href');
    var target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;
    e.preventDefault();
    window.history.pushState(null, '', hash);
    if (lenis) lenis.scrollTo(target, { offset: target === body ? 0 : -70 });
    else target.scrollIntoView();
    if (target !== body) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  });

  /* ---------- Títulos palavra a palavra ---------- */

  function splitWords(el) {
    var text = el.textContent.trim();
    el.textContent = '';
    text.split(/\s+/).forEach(function (word, i) {
      if (i) el.appendChild(document.createTextNode(' '));
      var outer = document.createElement('span');
      outer.className = 'w';
      var inner = document.createElement('span');
      inner.className = 'wi';
      inner.textContent = word;
      outer.appendChild(inner);
      el.appendChild(outer);
    });
  }

  var titles = gsap.utils.toArray('main h2');
  titles.forEach(splitWords);

  if (!reduce) {
    titles.forEach(function (title) {
      gsap.from(title.querySelectorAll('.wi'), {
        yPercent: 110, duration: 0.9, ease: 'expo.out', stagger: 0.06,
        scrollTrigger: { trigger: title, start: 'top 88%', once: true }
      });
    });
    // Cartões e textos entram de fora do ecrã, cada um pelo lado mais próximo, e saem ao voltar para cima.
    var slideGroups = [
      '#skills .section-label', '.skill-card',
      '#projects .section-label', '.project-card',
      '#about .section-label', '.about-text p', '.stat-card'
    ];
    var NAV_CLEARANCE = 90;
    var slides = [];
    var alternate = 0;

    // O elemento tem de estar no sítio quando esta referência chega ao topo da página.
    function limitFor(selector, el, index) {
      if (selector === '.skill-card') return document.querySelector('#skills h2');
      if (selector === '.project-card') return document.querySelector(index === 0 ? '#projects h2' : '.project-card.featured');
      if (selector === '.about-text p' || selector === '.stat-card') return document.querySelector('#about h2');
      return null;
    }

    function pageTop(el) {
      var y = 0;
      while (el) { y += el.offsetTop; el = el.offsetParent; }
      return y;
    }

    function measureSlide(item) {
      var el = item.el;
      var offCentre = el.offsetLeft + el.offsetWidth / 2 - window.innerWidth / 2;
      // Elementos centrados ou a toda a largura não têm lado próximo: alternam.
      item.side = Math.abs(offCentre) < window.innerWidth * 0.06 ? item.fallbackSide : (offCentre < 0 ? -1 : 1);
      item.distance = item.side < 0 ? el.offsetLeft + el.offsetWidth + 40 : window.innerWidth - el.offsetLeft + 40;
      item.drawn = -1;
    }

    function drawSlide(item) {
      var t = item.trigger ? item.trigger.progress : 0;
      if (t === item.drawn) return;
      item.drawn = t;
      if (t >= 1) {
        item.el.style.transform = '';
        return;
      }
      var rest = (1 - t) * (1 - t);
      item.el.style.transform = 'translate3d(' + (item.side * item.distance * rest).toFixed(1) + 'px,0,0) rotate(' + (item.side * 7 * rest).toFixed(2) + 'deg)';
    }

    slideGroups.forEach(function (selector) {
      gsap.utils.toArray(selector).forEach(function (el, index) {
        var item = { el: el, fallbackSide: alternate++ % 2 === 0 ? -1 : 1 };
        var limit = limitFor(selector, el, index);
        // Os cartões da mesma fila chegam um a seguir ao outro.
        var stagger = selector === '.skill-card' ? (3 - index) * 24 : (selector === '.stat-card' ? (3 - index) * 16 : 0);
        measureSlide(item);
        item.trigger = ScrollTrigger.create({
          trigger: el,
          // Começa antes de entrar no ecrã: assim a parte visível do percurso é mais lenta.
          start: function () { return pageTop(el) - window.innerHeight * 1.25; },
          end: function () {
            var vh = window.innerHeight;
            var top = pageTop(el);
            var start = top - vh * 1.25;
            // Sem referência, ou numa só coluna, termina quando o elemento está bem visível.
            var end = top - vh * 0.55;
            if (limit && window.innerWidth > 900) {
              // Mas nunca antes de o elemento estar dentro do ecrã.
              end = Math.max(pageTop(limit) - NAV_CLEARANCE - stagger, top - vh * 0.85);
            }
            return Math.max(start + 20, end);
          }
        });
        slides.push(item);
        drawSlide(item);
      });
    });

    // O movimento segue apenas o scroll, incluindo o regresso ao subir.
    gsap.ticker.add(function () {
      slides.forEach(drawSlide);
    });

    ScrollTrigger.addEventListener('refresh', function () {
      slides.forEach(function (item) {
        measureSlide(item);
        drawSlide(item);
      });
    });
    gsap.utils.toArray('.stat-num[data-count]').forEach(function (el) {
      var end = Number(el.getAttribute('data-count'));
      var counter = { v: 0 };
      gsap.to(counter, {
        v: end, duration: 1.3, ease: 'power2.out', snap: { v: 1 },
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: function () { el.textContent = counter.v + (el.getAttribute('data-suffix') || ''); }
      });
    });
    gsap.from('.hero-line > span', { yPercent: 112, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.1,
      onComplete: function () { hero.classList.add('intro-done'); } });
    gsap.from('.hero-inner:not(.is-clone) .hero-badge, .hero-inner:not(.is-clone) .hero-foot > *', { y: 26, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.55 });
  } else {
    hero.classList.add('intro-done');
  }

  /* ---------- Cor da página por secção ---------- */

  // Calculada pela posição do scroll, para acertar também em saltos diretos e links internos.
  var themed = gsap.utils.toArray('[data-section-theme]');
  var themeTops = [];
  var activeTheme = body.getAttribute('data-theme');

  function measureThemes() {
    themeTops = themed.map(function (section) {
      return section.getBoundingClientRect().top + window.scrollY;
    });
  }

  function updateTheme(y, vh) {
    var line = y + vh * 0.55;
    var index = 0;
    for (var i = 0; i < themeTops.length; i++) {
      if (themeTops[i] <= line) index = i;
    }
    var theme = themed[index].getAttribute('data-section-theme');
    if (theme !== activeTheme) {
      activeTheme = theme;
      body.setAttribute('data-theme', theme);
    }
  }

  /* ---------- Faixa de tecnologias reage à velocidade do scroll ---------- */

  if (!reduce) {
    var setSkew = gsap.quickTo('.ticker-inner', 'skewX', { duration: 0.4, ease: 'power3' });
    ScrollTrigger.create({
      trigger: '.ticker',
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: function (self) {
        setSkew(gsap.utils.clamp(-12, 12, self.getVelocity() / -160));
      }
    });
  }

  /* ---------- Botões com reação ao rato ---------- */

  if (finePointer && !reduce) {
    gsap.utils.toArray('.btn-primary:not(.modal-content *), .nav-cta, .contact-link').forEach(function (el) {
      var toX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' });
      var toY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        toX((e.clientX - r.left - r.width / 2) * 0.28);
        toY((e.clientY - r.top - r.height / 2) * 0.28);
      });
      el.addEventListener('pointerleave', function () { toX(0); toY(0); });
    });
  }

  /* ---------- Abertura: buracos de queijo revelam o código ---------- */

  var codeLayer = document.createElement('pre');
  codeLayer.className = 'hero-code';
  codeLayer.textContent = new Array(5).join(CODE);
  reveal.appendChild(codeLayer);

  var clone = null;
  function syncClone() {
    var inner = hero.querySelector('.hero-inner:not(.is-clone)');
    var fresh = inner.cloneNode(true);
    fresh.classList.add('is-clone');
    fresh.querySelectorAll('[id]').forEach(function (el) { el.removeAttribute('id'); });
    fresh.querySelectorAll('[data-i18n],[data-i18n-html]').forEach(function (el) {
      el.removeAttribute('data-i18n');
      el.removeAttribute('data-i18n-html');
    });
    fresh.querySelectorAll('[style]').forEach(function (el) { el.removeAttribute('style'); });
    if (clone) clone.remove();
    clone = fresh;
    reveal.appendChild(clone);
  }
  syncClone();

  var HOLE_RADII = [15, 10, 7, 5, 3.4, 2.2];
  var holes = HOLE_RADII.map(function () { return { x: 0, y: 0 }; });
  var pointer = { x: 0, y: 0, last: -1e4 };
  var holeState = { open: reduce ? 1 : 0 };
  if (!reduce) gsap.to(holeState, { open: 1, duration: 1.2, ease: 'back.out(1.6)', delay: 1 });

  var lastHoleTime = 0;
  function placeHoles(time) {
    var dt = Math.min(0.1, time - lastHoleTime);
    lastHoleTime = time;
    var w = hero.offsetWidth, h = hero.offsetHeight;
    var unit = Math.min(window.innerWidth, window.innerHeight) / 100;
    var idle = reduce || time - pointer.last > 2.2;
    var tx = idle ? w * (0.26 + Math.sin(time * 0.42) * 0.2) : pointer.x;
    var ty = idle ? h * (0.58 + Math.cos(time * 0.57) * 0.22) : pointer.y;
    holes.forEach(function (hole, i) {
      var from = i === 0 ? { x: tx, y: ty } : holes[i - 1];
      // Baseado no tempo, para ter a mesma velocidade em qualquer taxa de atualização.
      var ease = reduce ? 1 : 1 - Math.exp(-dt * (i === 0 ? 8.4 : 13.4));
      if (reduce && i) { from = { x: holes[i - 1].x + unit * 13 / i, y: holes[i - 1].y + unit * 9 / i }; }
      hole.x += (from.x - hole.x) * ease;
      hole.y += (from.y - hole.y) * ease;
      reveal.style.setProperty('--x' + i, hole.x.toFixed(1) + 'px');
      reveal.style.setProperty('--y' + i, hole.y.toFixed(1) + 'px');
      reveal.style.setProperty('--r' + i, (HOLE_RADII[i] * unit * holeState.open).toFixed(1) + 'px');
    });
  }

  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    pointer.x = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.last = gsap.ticker.time;
  }, { passive: true });

  /* ---------- Percurso do queijo ---------- */

  var spots = {
    hero: document.querySelector('.cheese-spot-hero'),
    skills: document.querySelector('.cheese-spot-skills'),
    about: document.querySelector('.cheese-spot-about')
  };
  var measured = {};
  var stage = document.createElement('canvas');
  stage.className = 'cheese-stage';
  stage.setAttribute('aria-hidden', 'true');
  body.appendChild(stage);

  var cheese = window.Cheese ? window.Cheese.create(stage, { adaptive: !reduce, maxDpr: finePointer ? 1.5 : 1.25 }) : null;
  if (!cheese) {
    // Sem WebGL, mostra a imagem pré-desenhada do queijo no mesmo percurso.
    var image = new Image();
    image.src = '/cheese.webp';
    image.alt = '';
    image.className = 'cheese-stage';
    image.setAttribute('aria-hidden', 'true');
    stage.replaceWith(image);
    stage = image;
  }

  var baseSize = 0;
  function measure() {
    var y = window.scrollY;
    measureThemes();
    Object.keys(spots).forEach(function (key) {
      var r = spots[key].getBoundingClientRect();
      measured[key] = { x: r.left + r.width / 2, y: r.top + y + r.height / 2, size: r.width };
    });
    baseSize = measured.hero.size;
    stage.style.width = baseSize + 'px';
    stage.style.height = baseSize + 'px';
    if (cheese) cheese.resize(baseSize);
    dirty = true;
  }

  var mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  if (finePointer && !reduce) {
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX / window.innerWidth - 0.5;
      mouse.y = e.clientY / window.innerHeight - 0.5;
    }, { passive: true });
  }

  var dirty = true;
  var lastBite = -1;
  var visible = true;

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.min(1, Math.max(0, v)); }

  function frame(time) {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var a = measured.hero, b = measured.skills, c = measured.about;

    updateTheme(y, vh);

    if (y < hero.offsetHeight) {
      placeHoles(time);
      hero.style.setProperty('--hero-shift', (y * -0.16).toFixed(1) + 'px');
    }

    var pos;
    if (y > b.y + b.size) {
      pos = { x: c.x, y: c.y - y, size: c.size };
    } else {
      var travel = clamp01(y / Math.max(1, b.y - vh * 0.5));
      var e = travel * travel * (3 - 2 * travel);
      pos = { x: lerp(a.x, b.x, e), y: lerp(a.y - y, b.y - y, e), size: lerp(a.size, b.size, e) };
    }

    var onScreen = pos.y > -pos.size && pos.y < vh + pos.size;
    if (onScreen !== visible) {
      visible = onScreen;
      stage.style.visibility = onScreen ? 'visible' : 'hidden';
    }
    if (!onScreen) return;

    var scale = pos.size / baseSize;
    stage.style.transform = 'translate3d(' + (pos.x - baseSize / 2).toFixed(1) + 'px,' + (pos.y - baseSize / 2).toFixed(1) + 'px,0) scale(' + scale.toFixed(4) + ')';

    if (!cheese) return;
    var bite = clamp01(y / Math.max(1, c.y - vh * 0.5));
    mouse.sx += (mouse.x - mouse.sx) * 0.06;
    mouse.sy += (mouse.y - mouse.sy) * 0.06;
    if (reduce && !dirty && bite === lastBite) return;
    lastBite = bite;
    dirty = false;
    cheese.draw({
      // A rotação é limitada para os buracos ficarem à vista, sem mostrar só a casca.
      rotX: 0.56 + mouse.sy * 0.4 + (reduce ? 0 : Math.sin(time * 0.5) * 0.05),
      rotY: -0.3 + mouse.sx * 0.6 + Math.sin(y * 0.0022 + (reduce ? 0 : time * 0.32)) * 0.42,
      bite: bite
    });
  }

  measure();
  gsap.ticker.add(frame);

  ScrollTrigger.addEventListener('refresh', measure);
  window.addEventListener('resize', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });

  document.addEventListener('site:language', function () {
    titles.forEach(splitWords);
    syncClone();
    ScrollTrigger.refresh();
  });
})();
