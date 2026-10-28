/* Hitest GmbH – gemeinsames Script: Navigation, mobiles Menü, Formular */

// TODO: n8n-Webhook oder Formular-Dienst eintragen. Solange leer, wird der Versand nur simuliert.
const FORM_ENDPOINT = '';

document.addEventListener('DOMContentLoaded', () => {
  markCurrentPage();
  initMobileMenu();
  initSubnav();
  initContactForm();
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
});

// Aktive Seite in der Navigation markieren (Header bleibt auf allen Seiten identisch)
function markCurrentPage() {
  const file = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav] a').forEach((a) => {
    if (a.getAttribute('href') === file) a.setAttribute('aria-current', 'page');
  });
}

function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('mobile-menu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    toggle.querySelector('[data-icon="open"]').toggleAttribute('hidden', open);
    toggle.querySelector('[data-icon="close"]').toggleAttribute('hidden', !open);
  };

  setOpen(false);
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setOpen(false); });
}

// Unternavigation: aktiven Abschnitt hervorheben
function initSubnav() {
  const links = [...document.querySelectorAll('.subnav a')];
  if (!links.length) return;
  const sections = links.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-30% 0px -60% 0px' });
  sections.forEach((s) => observer.observe(s));
}

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  const status = document.getElementById('form-status');

  const rules = {
    name: (v) => v.trim().length > 1 || 'Bitte geben Sie Ihren Namen an.',
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) || 'Bitte geben Sie eine gültige E-Mail-Adresse an.',
    message: (v) => v.trim().length > 9 || 'Bitte beschreiben Sie Ihr Anliegen kurz (mind. 10 Zeichen).',
    privacy: (_, el) => el.checked || 'Bitte bestätigen Sie die Datenschutzerklärung.',
  };

  const validateField = (name) => {
    const el = form.elements[name];
    const field = el.closest('.field') || el.closest('.checkbox-field');
    const result = rules[name](el.value, el);
    const error = field.querySelector('.field-error');
    const ok = result === true;
    field.classList.toggle('has-error', !ok);
    el.setAttribute('aria-invalid', String(!ok));
    if (error) error.textContent = ok ? '' : result;
    return ok;
  };

  Object.keys(rules).forEach((name) => {
    const el = form.elements[name];
    el.addEventListener(el.type === 'checkbox' ? 'change' : 'blur', () => validateField(name));
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.className = 'form-status';
    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = 'Wird gesendet …';
    const data = Object.fromEntries(new FormData(form));

    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
      } else {
        console.info('[Hitest] FORM_ENDPOINT ist leer – Versand wird nur simuliert.', data);
        await new Promise((r) => setTimeout(r, 600));
      }
      form.reset();
      status.textContent = 'Vielen Dank! Ihre Anfrage ist eingegangen – wir melden uns in Kürze.';
      status.classList.add('is-success');
    } catch (err) {
      status.textContent = 'Die Anfrage konnte nicht gesendet werden. Bitte rufen Sie uns an: +49 511 5156-9000 oder schreiben Sie an info@hitest.de.';
      status.classList.add('is-error');
    } finally {
      button.disabled = false;
      button.textContent = 'Anfrage senden';
      status.focus();
    }
  });
}
