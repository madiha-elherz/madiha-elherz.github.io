// ---------------------------------------------------------
// Live Paris / Seoul clock + masthead date
// ---------------------------------------------------------
function updateClocks() {
  const el = document.getElementById('clocks');
  if (el) {
    const fmt = (tz) =>
      new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
    el.textContent = `PARIS ${fmt('Europe/Paris')} · SEOUL ${fmt('Asia/Seoul')}`;
  }
}
updateClocks();
setInterval(updateClocks, 30000);

const mastheadDate = document.getElementById('masthead-date');
if (mastheadDate) {
  mastheadDate.textContent = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .format(new Date()).toUpperCase();
}

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

function initFlipbook() {
  const flipbook = document.getElementById('flipbook');
  if (!flipbook) return;
  for (let i = 1; i <= PAGE_COUNT; i++) {
    const page = document.createElement('div');
    page.className = 'flip-page';
    page.style.zIndex = String(PAGE_COUNT - i + 1);
    const img = document.createElement('img');
    img.src = `assets/brochure-pages/p${i}.jpg`;
    img.alt = `Brochure page ${i}`;
    img.loading = 'lazy';
    page.appendChild(img);
    flipbook.appendChild(page);
  }

  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  const countLabel = document.getElementById('flip-count');
  const pages = () => Array.from(flipbook.querySelectorAll('.flip-page'));

  function render() {
    pages().forEach((p, idx) => p.classList.toggle('flipped', idx < currentPage - 1));
    countLabel.textContent = `Page ${currentPage} / ${PAGE_COUNT}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= PAGE_COUNT;
    // page images may change layout height; rebuild thread shortly after
    clearTimeout(window.__threadResize);
    window.__threadResize = setTimeout(buildThreadPath, 400);
  }

  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); } });
  nextBtn.addEventListener('click', () => { if (currentPage < PAGE_COUNT) { currentPage++; render(); } });

  render();
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
