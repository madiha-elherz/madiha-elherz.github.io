// ---------------------------------------------------------
// Live Paris / Seoul clock in the top bar
// ---------------------------------------------------------
function updateClocks() {
  const el = document.getElementById('clocks');
  if (!el) return;
  const fmt = (tz) =>
    new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: tz
    }).format(new Date());
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
  const offset = threadLength - threadLength * progress;
  threadPath.style.strokeDashoffset = offset;
}
window.addEventListener('scroll', updateThread, { passive: true });
updateThread();

// ---------------------------------------------------------
// Section reveal + active rail state via IntersectionObserver
// ---------------------------------------------------------
const sections = document.querySelectorAll('.section[id]');
const railLinks = document.querySelectorAll('.rail a');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add('in-view');
    });
  },
  { threshold: 0.15 }
);
sections.forEach((s) => revealObserver.observe(s));

const activeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        railLinks.forEach((link) => {
          link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
        });
      }
    });
  },
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
  railLinks.forEach((link) => {
    link.addEventListener('click', () => {
      rail.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}
