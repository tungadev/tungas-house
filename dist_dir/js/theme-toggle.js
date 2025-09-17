(() => {
  const LS_KEY = 'kj-theme';
  const body = document.body;

  // 1) Prefer a data attribute on the button so you can change themes without editing JS
  //    Example in HTML: <button id="theme-toggle" data-themes="theme-inkwell,theme-oxide,...">✦</button>
  function getThemesFromButton() {
    const btn = document.getElementById('theme-toggle');
    if (!btn) return null;
    const raw = btn.getAttribute('data-themes');
    if (!raw) return null;
    return raw.split(',').map(s => s.trim()).filter(Boolean);
  }

  // 2) Fallback: the themes you actually defined in your CSS (from your message)
  const DEFAULT_THEMES = [
    'theme-inkwell',
    'theme-uv',
    'theme-arcade',
    'theme-miami',
    'theme-laser'
  ];

  // Resolve the list once DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('theme-toggle');
    const THEMES = getThemesFromButton() || DEFAULT_THEMES;

    function applyTheme(name) {
      THEMES.forEach(t => body.classList.remove(t));
      if (name) body.classList.add(name);
      localStorage.setItem(LS_KEY, name || '');
      // lil glitch flash
      body.classList.add('theme-glitch');
      setTimeout(() => body.classList.remove('theme-glitch'), 520);
    }

    function nextTheme() {
      const cur = THEMES.findIndex(t => body.classList.contains(t));
      const idx = (cur + 1) % THEMES.length;
      applyTheme(THEMES[idx]);
    }

    // init: restore or set first theme if none
    const saved = localStorage.getItem(LS_KEY);
    if (saved && THEMES.includes(saved)) {
      applyTheme(saved);
    } else if (!THEMES.some(t => body.classList.contains(t))) {
      applyTheme(THEMES[0]);  // boot into first
    }

    // wire up button + keyboard
    if (btn) btn.addEventListener('click', nextTheme);
    window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 't' && !e.metaKey && !e.ctrlKey && !e.altKey) nextTheme();
    });
  });
})();
