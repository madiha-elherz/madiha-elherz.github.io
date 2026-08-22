// ---------------------------------------------------------
// Live Paris / Seoul clock in the top bar
// ---------------------------------------------------------
function updateClocks() {
  const el = document.getElementById('clocks');
  if (!el) return;
  const fmt = (tz) =>
    new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }).format(new Date());
  el.textContent = `PARIS ${fmt('Europe/Paris')} · SEOUL ${fmt('Asia/Seoul')}`;
}
updateClocks();
setInterval(updateClocks, 30000);

// ---------------------------------------------------------
// Thread line: draws in proportion to scroll position
// ---------------------------------------------------------
const threadPath = document.getElementById('thread-path');
const threadLength = 4200;

function updateThread() {
  if (!threadPath) return;
  const doc = document.documentElement;
  const scrollTop = doc.scrollTop || document.body.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  const progress = scrollHeight > 0 ? Math.min(scrollTop / scrollHeight, 1) : 0;
  threadPath.style.strokeDashoffset = threadLength - threadLength * progress;
}
window.addEventListener('scroll', updateThread, { passive: true });
updateThread();

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
// Modal system (Selected Work case studies)
// ---------------------------------------------------------
const caseCards = document.querySelectorAll('.case-card');
const overlays = document.querySelectorAll('.modal-overlay');

function openModal(id) {
  const overlay = document.getElementById(id);
  if (!overlay) return;
  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (id === 'modal-brochure') initFlipbook();
}
function closeModal(overlay) {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}
caseCards.forEach((card) => {
  card.addEventListener('click', () => openModal(card.getAttribute('data-modal')));
});
overlays.forEach((overlay) => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(overlay); });
  overlay.querySelectorAll('[data-close]').forEach((btn) => btn.addEventListener('click', () => closeModal(overlay)));
});
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') overlays.forEach((o) => { if (o.classList.contains('open')) closeModal(o); });
});

// ---------------------------------------------------------
// Brochure flipbook (real page-turn using rendered PDF pages)
// ---------------------------------------------------------
const PAGE_COUNT = 9;
let flipInitialised = false;
let currentPage = 1; // 1-indexed, represents number of pages already flipped

function initFlipbook() {
  if (flipInitialised) return;
  flipInitialised = true;

  const flipbook = document.getElementById('flipbook');
  for (let i = 1; i <= PAGE_COUNT; i++) {
    const page = document.createElement('div');
    page.className = 'flip-page';
    page.style.zIndex = String(PAGE_COUNT - i + 1);
    const img = document.createElement('img');
    img.src = `assets/brochure-pages/p${i}.jpg`;
    img.alt = `Brochure page ${i}`;
    page.appendChild(img);
    flipbook.appendChild(page);
  }

  const prevBtn = document.getElementById('flip-prev');
  const nextBtn = document.getElementById('flip-next');
  const countLabel = document.getElementById('flip-count');
  const pages = () => Array.from(flipbook.querySelectorAll('.flip-page'));

  function render() {
    const pgs = pages();
    pgs.forEach((p, idx) => {
      p.classList.toggle('flipped', idx < currentPage - 1);
    });
    countLabel.textContent = `Page ${currentPage} / ${PAGE_COUNT}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= PAGE_COUNT;
  }

  prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; render(); } });
  nextBtn.addEventListener('click', () => { if (currentPage < PAGE_COUNT) { currentPage++; render(); } });

  render();
}

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
