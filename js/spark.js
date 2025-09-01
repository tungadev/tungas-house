// ultra-simple spark burst
(function () {
  const COUNT = 14;             // sparks per click
  const DIST_MIN = 40;          // px
  const DIST_MAX = 110;         // px
  const DUR_MIN = 420;          // ms
  const DUR_MAX = 700;          // ms
  const SIZE_MIN = 3;           // px
  const SIZE_MAX = 6;           // px

  const allow = document.documentElement.getAttribute('data-allow-effects') === 'true';
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && !allow;

  function rand(a, b) { return a + Math.random() * (b - a); }
  function pickPalette() {
    const css = getComputedStyle(document.documentElement);
    const vals = ['--secondary','--cyan','--highlight','--primary']
      .map(v => css.getPropertyValue(v).trim()).filter(Boolean);
    return vals.length ? vals : ['#ef0562','#00f0ff','#39ff14','#9331d4'];
  }

  function spawn(x, y) {
    if (reduce) return;
    const colors = pickPalette();

    for (let i = 0; i < COUNT; i++) {
      const el = document.createElement('span');
      el.className = 'spark-bit';

      // random direction and distance
      const angle = Math.random() * Math.PI * 2;
      const dist = rand(DIST_MIN, DIST_MAX);
      const dx = Math.cos(angle) * dist;
      const dy = Math.sin(angle) * dist;

      // random size & duration
      const dur = rand(DUR_MIN, DUR_MAX);
      const size = rand(SIZE_MIN, SIZE_MAX);

      // apply style vars
      el.style.setProperty('--x', x + 'px');
      el.style.setProperty('--y', y + 'px');
      el.style.setProperty('--dx', dx + 'px');
      el.style.setProperty('--dy', dy + 'px');
      el.style.setProperty('--s', size + 'px');
      el.style.setProperty('--dur', dur + 'ms');
      el.style.color = colors[(Math.random() * colors.length) | 0];

      document.body.appendChild(el);
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }
  }

  function onPoint(e) {
    const p = 'clientX' in e ? e : (e.touches && e.touches[0]);
    if (!p) return;
    spawn(p.clientX, p.clientY);
  }

  window.addEventListener('pointerdown', onPoint, { passive: true });
  window.addEventListener('touchstart', onPoint, { passive: true });
})();
