// ---------------------------------------------------------
// Language toggle: EN / FR
// ---------------------------------------------------------
let currentLang = localStorage.getItem('meh-lang') || 'en';

function updateMastheadDate() {
  const el = document.getElementById('masthead-date');
  if (!el) return;
  const locale = currentLang === 'fr' ? 'fr-FR' : 'en-GB';
  el.textContent = new Intl.DateTimeFormat(locale, { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date()).toUpperCase();
}

function setLang(lang) {
  currentLang = lang;
  document.documentElement.setAttribute('lang', lang);
  document.body.classList.toggle('is-fr', lang === 'fr');
  document.querySelectorAll('.lang-option').forEach((opt) => {
    opt.classList.toggle('is-active', opt.dataset.langBtn === lang);
  });
  localStorage.setItem('meh-lang', lang);
  updateMastheadDate();
  renderFlipbook();
  clearTimeout(window.__threadResize);
  window.__threadResize = setTimeout(buildThreadPath, 250);
}

const langToggle = document.getElementById('lang-toggle');
if (langToggle) {
  langToggle.addEventListener('click', () => setLang(currentLang === 'en' ? 'fr' : 'en'));
}

// ---------------------------------------------------------
// Preloader: black screen fades into Home on load
// ---------------------------------------------------------
const preloader = document.getElementById('preloader');
if (preloader) {
  window.addEventListener('load', () => {
    setTimeout(() => preloader.classList.add('hide'), 400);
  });
  // Fallback in case 'load' already fired or takes too long
  setTimeout(() => preloader.classList.add('hide'), 2500);
}

// ---------------------------------------------------------
// Menu reveal: hidden on Home, appears once you leave Home
// (via the "Discover my work" click, or by scrolling past it)
// ---------------------------------------------------------
const railEl = document.getElementById('rail');
const navToggleEl = document.getElementById('nav-toggle');
function revealMenu() {
  if (railEl) railEl.classList.remove('hidden');
  if (navToggleEl) navToggleEl.classList.remove('hidden');
}
const ctaButton = document.querySelector('.cta-button');
if (ctaButton) ctaButton.addEventListener('click', revealMenu);

const homeSection = document.getElementById('home');
if (homeSection) {
  const homeObserver = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (!e.isIntersecting) revealMenu(); }),
    { threshold: 0 }
  );
  homeObserver.observe(homeSection);
}

// ---------------------------------------------------------
// Live Paris / Seoul clock + masthead date
// ---------------------------------------------------------
function updateClocks() {
  const el = document.getElementById('clocks');
  if (el) {
    const fmt = (tz) =>
      new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
    el.textContent = `PARIS ${fmt('Europe/Paris')} · SEOUL ${fmt('Asia/Seoul')} · NEW YORK ${fmt('America/New_York')}`;
  }
}
updateClocks();
setInterval(updateClocks, 30000);

// ---------------------------------------------------------
// Celestial thread: a wavy path spanning full document height,
// drawn progressively on scroll, with a glowing star at the tip.
// ---------------------------------------------------------
const threadSvg = document.getElementById('thread-svg');
const threadPath = document.getElementById('thread-path');
const threadStar = document.getElementById('thread-star');
let pathLength = 0;

function buildThreadPath() {
  const docHeight = document.documentElement.scrollHeight;
  threadSvg.setAttribute('viewBox', `0 0 100 ${docHeight}`);
  threadSvg.style.height = docHeight + 'px';

  const segment = 240;
  const amplitude = 26;
  let y = 24;
  let toggle = 1;
  let d = `M 20,${y}`;
  while (y < docHeight - 24) {
    const nextY = Math.min(y + segment, docHeight - 24);
    const cx1 = 20 + toggle * amplitude;
    const cx2 = 20 - toggle * amplitude;
    const midY = (y + nextY) / 2;
    d += ` C ${cx1},${y + (nextY - y) * 0.3} ${cx2},${midY} 20,${nextY}`;
    y = nextY;
    toggle *= -1;
  }
  threadPath.setAttribute('d', d);
  pathLength = threadPath.getTotalLength();
  threadPath.style.strokeDasharray = String(pathLength);
  updateThread();
}

function updateThread() {
  if (!threadPath || !pathLength) return;
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const progress = scrollHeight > 0 ? Math.min(Math.max(scrollTop / scrollHeight, 0), 1) : 0;

  threadPath.style.strokeDashoffset = String(pathLength - pathLength * progress);

  const point = threadPath.getPointAtLength(pathLength * progress);
  if (threadStar) {
    threadStar.style.left = `calc(var(--rail-w) - 1px + ${point.x}px)`;
    threadStar.style.top = `${point.y}px`;
  }
}

window.addEventListener('scroll', updateThread, { passive: true });
window.addEventListener('load', buildThreadPath);
window.addEventListener('resize', () => { clearTimeout(window.__threadResize); window.__threadResize = setTimeout(buildThreadPath, 200); });
// Build once immediately too, in case images are cached and 'load' already fired
buildThreadPath();
setTimeout(buildThreadPath, 800); // catch late-loading images/fonts affecting height

// ---------------------------------------------------------
// Section reveal + active rail state
// ---------------------------------------------------------
const sections = document.querySelectorAll('.section[id]');
const railLinks = document.querySelectorAll('.rail a');

const revealObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in-view'); }),
  { threshold: 0.15 }
);
sections.forEach((s) => revealObserver.observe(s));

const activeObserver = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) {
      const id = e.target.getAttribute('id');
      railLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${id}`));
    }
  }),
  { threshold: 0.5 }
);
sections.forEach((s) => activeObserver.observe(s));

// ---------------------------------------------------------
// Mobile nav toggle
// ---------------------------------------------------------
const navToggle = document.getElementById('nav-toggle');
const rail = document.querySelector('.rail');
if (navToggle && rail) {
  navToggle.addEventListener('click', () => {
    const isOpen = rail.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });
  railLinks.forEach((link) => link.addEventListener('click', () => {
    rail.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  }));
}

// ---------------------------------------------------------
// Brochure flipbook — inline, built on load
// ---------------------------------------------------------
const PAGE_COUNT = 9;
let currentPage = 1;
let flipbookEl = null;

function renderFlipbook() {
  if (!flipbookEl) return;
  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  const countLabel = document.getElementById('flip-count');
  const pages = Array.from(flipbookEl.querySelectorAll('.flip-page'));

  pages.forEach((p, idx) => p.classList.toggle('flipped', idx < currentPage - 1));
  countLabel.textContent = currentLang === 'fr'
    ? `Page ${currentPage} sur ${PAGE_COUNT}`
    : `Page ${currentPage} / ${PAGE_COUNT}`;
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= PAGE_COUNT;
  clearTimeout(window.__threadResize);
  window.__threadResize = setTimeout(buildThreadPath, 400);
}

function initFlipbook() {
  flipbookEl = document.getElementById('flipbook');
  if (!flipbookEl) return;
  for (let i = 1; i <= PAGE_COUNT; i++) {
    const page = document.createElement('div');
    page.className = 'flip-page';
    page.style.zIndex = String(PAGE_COUNT - i + 1);
    const img = document.createElement('img');
    img.src = `assets/brochure-pages/p${i}.jpg`;
    img.alt = `Brochure page ${i}`;
    img.loading = 'lazy';
    page.appendChild(img);
    flipbookEl.appendChild(page);
  }

  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderFlipbook(); } });
  nextBtn.addEventListener('click', () => { if (currentPage < PAGE_COUNT) { currentPage++; renderFlipbook(); } });

  renderFlipbook();
}
initFlipbook();

// ---------------------------------------------------------
// Laptop feed → postcard reveal
// ---------------------------------------------------------
const laptop = document.getElementById('laptop');
const laptopBack = document.getElementById('laptop-back');
const laptopPostcardImg = document.getElementById('laptop-postcard-img');

if (laptop) {
  laptop.querySelectorAll('.laptop-feed-card').forEach((card) => {
    card.addEventListener('click', () => {
      const src = card.getAttribute('data-postcard');
      laptopPostcardImg.setAttribute('src', src);
      laptop.classList.add('open');
    });
  });
}
if (laptopBack) {
  laptopBack.addEventListener('click', () => laptop.classList.remove('open'));
}

// Apply the saved/default language now that all elements above exist
setLang(currentLang);
