// key-shortcut.js
document.addEventListener('DOMContentLoaded', () => {
  if (!window.Piano) return;
  const { playNote, keyMap } = window.Piano;

  // Avoid auto-repeat retrigger; allow true polyphony across different keys
  const held = new Set();

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    const el = keyMap.get(k);
    if (!el) return;

    // Only trigger once per physical press
    if (held.has(k)) return;
    held.add(k);

    e.preventDefault();
    playNote(el.dataset.key, el);
  });

  document.addEventListener('keyup', (e) => {
    held.delete(e.key.toLowerCase());
  });
});
