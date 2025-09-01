(() => {
  const BARS = 32;
  const BOOST_STEP = 8;
  const BOOST_DECAY = 0.94;
  const MAX_BOOST = 18;
  let boost = 0;

  function build() {
    const root = document.getElementById('viz');
    if (!root) return null;
    if (!root.childElementCount) {
      for (let i = 0; i < BARS; i++) {
        const b = document.createElement('div');
        b.className = 'bar';
        root.appendChild(b);
      }
    }
    return root.querySelectorAll('.bar');
  }

  // Optional: WebAudio hookup later
  function attachAnalyser(analyser) {
    window.KJVisualizer = window.KJVisualizer || {};
    window.KJVisualizer.analyser = analyser;
    window.KJVisualizer.data = new Uint8Array(analyser.frequencyBinCount);
  }
  function attachAudioElement(audioEl) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    const src = ctx.createMediaElementSource(audioEl);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    attachAnalyser(analyser);
  }

  function bump(amount = BOOST_STEP) {
    boost = Math.min(MAX_BOOST, boost + amount);
  }

  function loop(bars) {
    const analyser = window.KJVisualizer && window.KJVisualizer.analyser;
    const data = window.KJVisualizer && window.KJVisualizer.data;

    let values = null;
    if (analyser && data) {
      analyser.getByteFrequencyData(data);
      const step = Math.max(1, Math.floor(data.length / BARS));
      values = Array.from({ length: BARS }, (_, i) => {
        const slice = data.subarray(i * step, (i + 1) * step);
        let sum = 0; for (let v of slice) sum += v;
        return sum / slice.length; // 0..255
      });
    }

    const t = performance.now() / 1000;
    bars.forEach((bar, i) => {
      const idle = (Math.sin(t * 2 + i * 0.35) + 1) * 10 + 8; // 8..28
      const audio = values ? (values[i] / 255) * 52 : 0;
      const extra = boost * (6 + (i % 5) * 3);
      const h = Math.max(8, Math.min(64, idle + audio + extra));
      bar.style.height = h + 'px';
    });

    boost *= BOOST_DECAY;
    requestAnimationFrame(() => loop(bars));
  }

  // Listen to both mouse/touch and keyboard-driven key presses
  function wirePianoTriggers() {
    // 1) Pointer presses on keys
    document.addEventListener('pointerdown', (e) => {
      if ((e.target && e.target.classList && e.target.classList.contains('piano-keys'))
          || e.target.closest?.('.piano-keys')) {
        bump();
      }
    }, { passive: true });

    // 2) Observe .active class toggles (works for keyboard, programmatic, etc.)
    const container = document.querySelector('.piano-container') || document.body;
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          const el = m.target;
          if (el.classList?.contains('piano-keys') && el.classList.contains('active')) {
            bump();
          }
        }
      }
    });

    // Observe all current keys and any added later
    function observeAllKeys() {
      document.querySelectorAll('.piano-keys').forEach(key => {
        observer.observe(key, { attributes: true, attributeFilter: ['class'] });
      });
    }
    observeAllKeys();

    // Also observe subtree for dynamically added keys, then start watching them
    const subtreeObserver = new MutationObserver(() => observeAllKeys());
    subtreeObserver.observe(container, { childList: true, subtree: true });

    // 3) Tiny fallback: after any keydown, if a key is active next frame, bump
    window.addEventListener('keydown', () => {
      requestAnimationFrame(() => {
        if (document.querySelector('.piano-keys.active')) bump();
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const bars = build();
    if (!bars) return;

    wirePianoTriggers();
    loop(bars);

    // expose helpers
    window.KJVisualizer = Object.assign(window.KJVisualizer || {}, {
      attachAnalyser, attachAudioElement, bump
    });
  });
})();
