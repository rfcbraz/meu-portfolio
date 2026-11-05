(function () {
  'use strict';

  var translations = window.TRANSLATIONS;
  var DEFAULT_LANG = 'pt';
  var SITE_URL = 'https://www.rfcb.pt/';
  var SUCCESS_DELAY_MS = 1500;
  var REQUEST_TIMEOUT_MS = 15000;
  // Sitekey partilhada que a Web3Forms indica para o plano gratuito; é pública por natureza.
  var HCAPTCHA_SITEKEY = '50b2fe65-b00b-4b9e-ad62-3ba471098be2';
  var HCAPTCHA_NORMAL_MIN_WIDTH = 380; // abaixo disto, o widget normal (303px) não cabe na janela

  var nav = document.querySelector('nav');
  var navToggle = document.querySelector('.nav-toggle');
  var modal = document.getElementById('contact-modal');
  var form = document.getElementById('contact-form');
  var submitBtn = form.querySelector('button[type="submit"]');
  var statusEl = document.getElementById('form-status');
  var canonical = document.querySelector('link[rel="canonical"]');
  var captchaEl = document.getElementById('form-captcha');

  var currentLang = DEFAULT_LANG;
  var formState = 'idle'; // idle | sending | sent
  var statusKey = null;
  var successTimer = null;
  var lastFocused = null;
  var captchaRequested = false;
  var captchaId = null;
  var captchaLang = null;

  /* ---------- Idioma ---------- */

  function normalizeLang(value) {
    return Object.prototype.hasOwnProperty.call(translations, value) ? value : DEFAULT_LANG;
  }

  function langFromUrl() {
    return normalizeLang(new URLSearchParams(window.location.search).get('lang'));
  }

  function t(key) {
    return translations[currentLang][key] || translations[DEFAULT_LANG][key] || key;
  }

  function isNavOpen() {
    return nav.classList.contains('nav-open');
  }

  function renderNavToggle() {
    navToggle.setAttribute('aria-expanded', String(isNavOpen()));
    navToggle.setAttribute('aria-label', t(isNavOpen() ? 'navClose' : 'navOpen'));
  }

  function renderForm() {
    var labels = { idle: 'modalSend', sending: 'formSending', sent: 'formSent' };
    submitBtn.textContent = t(labels[formState]);
    submitBtn.disabled = formState !== 'idle';
    statusEl.textContent = statusKey ? t(statusKey) : '';
  }

  function applyLanguage(lang) {
    currentLang = normalizeLang(lang);
    document.documentElement.lang = currentLang;

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    // Apenas para textos fixos de translations.js, nunca para dados do utilizador ou do URL.
    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria-label')));
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      var active = btn.getAttribute('data-lang') === currentLang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    canonical.href = currentLang === DEFAULT_LANG ? SITE_URL : SITE_URL + '?lang=' + currentLang;
    renderNavToggle();
    renderForm();
    if (captchaId !== null && captchaLang !== currentLang) {
      window.hcaptcha.remove(captchaId);
      renderCaptcha();
    }
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var lang = btn.getAttribute('data-lang');
      applyLanguage(lang);
      var url = new URL(window.location.href);
      url.searchParams.set('lang', lang);
      window.history.pushState(null, '', url);
    });
  });

  window.addEventListener('popstate', function () {
    applyLanguage(langFromUrl());
  });

  /* ---------- Menu mobile ---------- */

  function setNavOpen(open) {
    nav.classList.toggle('nav-open', open);
    renderNavToggle();
  }

  navToggle.addEventListener('click', function () {
    setNavOpen(!isNavOpen());
  });

  document.querySelectorAll('.nav-links a').forEach(function (link) {
    link.addEventListener('click', function () {
      setNavOpen(false);
    });
  });

  document.addEventListener('click', function (e) {
    if (isNavOpen() && !nav.contains(e.target)) setNavOpen(false);
  });

  /* ---------- hCaptcha (só carrega quando o formulário é aberto) ---------- */

  function renderCaptcha() {
    captchaLang = currentLang;
    captchaId = window.hcaptcha.render(captchaEl, {
      sitekey: HCAPTCHA_SITEKEY,
      theme: 'dark',
      hl: currentLang,
      size: window.innerWidth < HCAPTCHA_NORMAL_MIN_WIDTH ? 'compact' : 'normal',
      callback: function () {
        if (statusKey === 'formCaptchaRequired') setStatus(null);
      },
      'error-callback': function () {
        setStatus('formCaptchaUnavailable');
      }
    });
  }

  function loadCaptcha() {
    if (captchaRequested) return;
    captchaRequested = true;
    window.onHcaptchaLoad = renderCaptcha;
    var script = document.createElement('script');
    script.src = 'https://js.hcaptcha.com/1/api.js?onload=onHcaptchaLoad&render=explicit&recaptchacompat=off';
    script.async = true;
    script.onerror = function () {
      captchaRequested = false; // permite nova tentativa ao reabrir o formulário
      script.remove();
      setStatus('formCaptchaUnavailable');
    };
    document.head.appendChild(script);
  }

  function resetCaptcha() {
    // Cada token só pode ser usado uma vez.
    if (captchaId !== null) window.hcaptcha.reset(captchaId);
  }

  /* ---------- Janela de contacto ---------- */

  function isModalOpen() {
    return modal.classList.contains('show');
  }

  function setFormState(state) {
    formState = state;
    renderForm();
  }

  function setStatus(key) {
    statusKey = key;
    renderForm();
  }

  function openModal() {
    lastFocused = document.activeElement;
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    form.elements.name.focus();
    loadCaptcha();
  }

  function closeModal() {
    clearTimeout(successTimer);
    if (formState === 'sent') {
      statusKey = null;
      setFormState('idle');
    }
    if (!isModalOpen()) return;
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    // O link do menu mobile já pode estar escondido; nesse caso volta ao botão do menu.
    var target = lastFocused && lastFocused.offsetParent !== null ? lastFocused : navToggle;
    target.focus();
  }

  function trapFocus(e) {
    var focusable = Array.prototype.filter.call(
      modal.querySelectorAll('button, input, textarea, a[href]'),
      function (el) { return !el.disabled && el.offsetParent !== null; }
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.querySelectorAll('.email-trigger, #contact-btn').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      openModal();
    });
  });

  modal.querySelectorAll('.modal-close, .modal-backdrop').forEach(function (el) {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (isModalOpen()) {
        closeModal();
      } else if (isNavOpen()) {
        setNavOpen(false);
        navToggle.focus();
      }
    } else if (e.key === 'Tab' && isModalOpen()) {
      trapFocus(e);
    }
  });

  /* ---------- Envio do formulário ---------- */

  function showSent() {
    form.reset();
    statusKey = null;
    setFormState('sent');
    successTimer = setTimeout(closeModal, SUCCESS_DELAY_MS);
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (formState !== 'idle') return;

    var data = Object.fromEntries(new FormData(form));
    ['name', 'email', 'subject', 'message'].forEach(function (field) {
      data[field] = data[field].trim();
    });
    if (!data.name || !data.email || !data.subject || !data.message) {
      setStatus('formFillAll');
      return;
    }

    if (captchaId === null) {
      setStatus('formCaptchaUnavailable');
      loadCaptcha();
      return;
    }
    data['h-captcha-response'] = window.hcaptcha.getResponse(captchaId);
    if (!data['h-captcha-response']) {
      setStatus('formCaptchaRequired');
      return;
    }

    statusKey = null;
    setFormState('sending');

    try {
      var res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
      });
      var json = await res.json();
      if (!json.success) throw new Error(json.message || 'Web3Forms rejected the message');
      showSent();
    } catch (err) {
      console.error('Contact form error:', err);
      statusKey = 'formError';
      setFormState('idle');
    }
    resetCaptcha();
  });

  applyLanguage(langFromUrl());
})();
