/* ─────────────────────────────────────────────
   main.js  –  cursor, loader, scroll, GSAP init
   ───────────────────────────────────────────── */

// ── Custom cursor ──────────────────────────────
const cur     = document.getElementById('cur');
const curRing = document.getElementById('cur-ring');
const scanRing = document.getElementById('scan-ring');

let mx = innerWidth / 2, my = innerHeight / 2;
let rx = mx, ry = my;

document.addEventListener('mousemove', e => {
  mx = e.clientX;
  my = e.clientY;
  cur.style.left = mx + 'px';
  cur.style.top  = my + 'px';
});

(function loopCursor() {
  rx += (mx - rx) * .12;
  ry += (my - ry) * .12;
  curRing.style.left = rx + 'px';
  curRing.style.top  = ry + 'px';
  requestAnimationFrame(loopCursor);
})();

document.querySelectorAll('a, button, .member-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    curRing.style.width       = '52px';
    curRing.style.height      = '52px';
    curRing.style.borderColor = 'rgba(0,245,255,.7)';
  });
  el.addEventListener('mouseleave', () => {
    curRing.style.width       = '32px';
    curRing.style.height      = '32px';
    curRing.style.borderColor = 'rgba(0,245,255,.4)';
  });
});

// ── Scan pulse on click ────────────────────────
document.addEventListener('click', e => {
  Object.assign(scanRing.style, {
    left: e.clientX + 'px',
    top:  e.clientY + 'px',
    width: '8px', height: '8px',
    opacity: '1',
    transition: 'none',
    transform: 'translate(-50%,-50%)',
  });
  requestAnimationFrame(() => {
    Object.assign(scanRing.style, {
      transition: 'width .9s ease-out, height .9s ease-out, opacity .9s ease-out',
      width: '260px', height: '260px', opacity: '0',
    });
  });
});

// ── Loader → hero reveal ───────────────────────
const STEPS = [
  'Initializing systems...',
  'Loading AI models...',
  'Calibrating sensors...',
  'All systems nominal.',
];
const loaderStatus = document.getElementById('loader-status');
const loaderFill   = document.getElementById('loader-fill');
let si = 0;

function nextStep() {
  loaderStatus.textContent = STEPS[si];
  loaderFill.style.width   = ((si + 1) / STEPS.length * 100) + '%';
  si++;
  if (si < STEPS.length) setTimeout(nextStep, 380);
  else setTimeout(revealHero, 500);
}
setTimeout(nextStep, 250);

function revealHero() {
  document.getElementById('loader').classList.add('hide');
  setTimeout(() => {
    document.getElementById('telemetry').classList.add('show');
    document.getElementById('section-badge').classList.add('show');
  }, 300);
  ['.hero-tag', '.hero-title', '.hero-sub', '.hero-cta', '.scroll-hint']
    .forEach((sel, i) => {
      setTimeout(() => {
        const el = document.querySelector(sel);
        if (el) el.classList.add('show');
      }, i * 130);
    });
}

// ── GSAP ScrollTrigger ─────────────────────────
gsap.registerPlugin(ScrollTrigger);

// Section badge labels + camera moves
ScrollTrigger.create({ trigger: '#mission', start: 'top 60%', onEnter: () => {
  document.getElementById('badge-text').textContent = 'SCANNING';
  gsap.to(window._cam.position, { z: 6.5, y: 2, duration: 1.8, ease: 'power2.out' });
}});

ScrollTrigger.create({ trigger: '#platform', start: 'top 60%', onEnter: () => {
  document.getElementById('badge-text').textContent = 'SIM MODE';
  gsap.to(window._cam.position, { z: 10, y: 3, duration: 1.8, ease: 'power2.out' });
  gsap.to(window._drone.scale,  { x: .75, y: .75, z: .75, duration: 1.8, ease: 'power2.out' });
}});

ScrollTrigger.create({ trigger: '#tech', start: 'top 60%', onEnter: () => {
  document.getElementById('badge-text').textContent = 'AI ACTIVE';
  gsap.to(window._cam.position, { z: 3.5, y: -.1, duration: 2, ease: 'power3.out' });
  gsap.to(window._drone.scale,  { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power2.out' });
}});

ScrollTrigger.create({ trigger: '#wow-section', start: 'top 70%', onEnter: () => {
  document.getElementById('badge-text').textContent = 'RESPONDING';
  gsap.to(window._cam.position, { z: 7, y: 1.8, duration: 1.5, ease: 'power2.out' });
  gsap.timeline()
    .to(window._drone.position, { z: 5, y: .5, duration: .7,  ease: 'power2.in' })
    .to(window._drone.position, { z: 0, y: 0,  duration: 1.2, ease: 'elastic.out(1,.7)' });
  document.getElementById('wow-h2').classList.add('show');
  document.getElementById('wow-p').classList.add('show');
  document.getElementById('wow-click').classList.add('show');
}});

ScrollTrigger.create({ trigger: '#team', start: 'top 60%', onEnter: () => {
  document.getElementById('badge-text').textContent = 'STANDBY';
  gsap.to(window._cam.position,   { z: 7, y: 1.8, duration: 1.5, ease: 'power2.out' });
  gsap.to(window._drone.position, { y: 0, x: 0, z: 0, duration: 1.5, ease: 'power2.out' });
  gsap.to(window._drone.scale,    { x: 1, y: 1, z: 1, duration: 1.5, ease: 'power2.out' });
}});

// Card reveals
document.querySelectorAll('[data-reveal]').forEach(el => {
  ScrollTrigger.create({
    trigger: el,
    start: 'top 82%',
    onEnter: () => el.classList.add('visible'),
    once: true,
  });
});
document.querySelectorAll('[data-reveal-right]').forEach(el => {
  el.classList.add('visual-side');
  ScrollTrigger.create({
    trigger: el,
    start: 'top 82%',
    onEnter: () => {
      el.classList.add('visible');
      // Count-up animation
      el.querySelectorAll('[data-count]').forEach(s => {
        const target = +s.dataset.count;
        const sfx    = s.dataset.suffix || '';
        let v = 0;
        const step = target / 40;
        const iv = setInterval(() => {
          v += step;
          if (v >= target) { v = target; clearInterval(iv); }
          s.textContent = Math.round(v) + sfx;
        }, 30);
      });
    },
    once: true,
  });
});

// Minimal-section word reveal
ScrollTrigger.create({
  trigger: '#minimal-section',
  start: 'top 70%',
  onEnter: () => document.querySelectorAll('.minimal-title .word').forEach(w => w.classList.add('show')),
  once: true,
});

// Parallax drone tilt on mouse move
document.addEventListener('mousemove', e => {
  const nx = (e.clientX / innerWidth  - .5) * 2;
  const ny = (e.clientY / innerHeight - .5) * 2;
  gsap.to(window._drone.rotation, { x: ny * .08, z: -nx * .06, duration: 1.2, ease: 'power2.out', overwrite: false });
  gsap.to(window._cam.position,   { x: nx * .3,  duration: 2, ease: 'power2.out' });
});

// ── Deploy button sound ────────────────────────
document.getElementById('deploy-btn')?.addEventListener('click', () => {
  beep(880, .12);
  setTimeout(() => beep(1100, .08), 160);
});
