/*
 * Pequenas demonstrações dos cartões de competências.
 * São decorativas e só correm enquanto a secção está no ecrã.
 */
(function () {
  'use strict';

  var grid = document.querySelector('.skills-grid');
  if (!grid) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ROUTES = [
    ['GET', '/quartos?livres=1', 200],
    ['POST', '/auth/login', 200],
    ['POST', '/reservas', 201],
    ['GET', '/admin', 401],
    ['POST', '/pagamentos', 201],
    ['GET', '/queijos/serra', 200],
    ['PUT', '/clientes/42', 200],
    ['DELETE', '/sessao', 204]
  ];
  var MAX_LINES = 6;

  var log = grid.querySelector('[data-demo="log"]');
  var nextRoute = 0;

  function addLogLine() {
    var route = ROUTES[nextRoute];
    nextRoute = (nextRoute + 1) % ROUTES.length;
    var line = document.createElement('li');
    [route[0], route[1], String(route[2]), (4 + Math.floor(Math.random() * 60)) + 'ms'].forEach(function (text, i) {
      var part = document.createElement('span');
      part.className = ['m', 'p', route[2] >= 400 ? 's bad' : 's', 't'][i];
      part.textContent = text;
      line.appendChild(part);
    });
    log.appendChild(line);
    while (log.children.length > MAX_LINES) log.removeChild(log.firstElementChild);
  }

  var table = grid.querySelector('[data-demo="table"]');
  var rows = Array.prototype.slice.call(table.children);

  function shuffleStock() {
    var stock = rows.map(function (row) {
      return { row: row, value: 12 + Math.floor(Math.random() * 88) };
    }).sort(function (a, b) { return b.value - a.value; });
    stock.forEach(function (entry, i) {
      entry.row.style.setProperty('--i', i);
      entry.row.style.setProperty('--v', entry.value + '%');
      entry.row.querySelector('.q-value').textContent = entry.value;
    });
  }

  var phone = grid.querySelector('[data-demo="phone"]');
  var habits = phone.querySelectorAll('.habit');
  var osLabel = phone.querySelector('.os-label');
  var done = 2;

  function stepPhone() {
    done = (done + 1) % (habits.length + 1);
    habits.forEach(function (habit, i) {
      habit.classList.toggle('done', i < done);
    });
    phone.style.setProperty('--progress', (done / habits.length * 100) + '%');
    if (done === 0) {
      var android = phone.getAttribute('data-os') !== 'android';
      phone.setAttribute('data-os', android ? 'android' : 'ios');
      osLabel.textContent = android ? 'Android' : 'iOS';
    }
  }

  var timers = [];

  function start() {
    if (timers.length || reduce) return;
    grid.classList.add('is-live');
    timers.push(window.setInterval(addLogLine, 950));
    timers.push(window.setInterval(shuffleStock, 2200));
    timers.push(window.setInterval(stepPhone, 1300));
  }

  function stop() {
    grid.classList.remove('is-live');
    timers.forEach(window.clearInterval);
    timers = [];
  }

  if (reduce || !('IntersectionObserver' in window)) {
    if (!reduce) start();
    return;
  }

  new IntersectionObserver(function (entries) {
    if (entries[0].isIntersecting) start(); else stop();
  }).observe(grid);
})();
