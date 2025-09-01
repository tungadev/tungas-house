// Typewriter for H1 + tagline (cursor hides after final line)
(() => {
  const SPEED_MAIN = 128;    // ms/char for H1
  const SPEED_TAG = 128;     // ms/char for tagline
  const HOLD = 700;         // pause between lines
  const reduce = matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  function typeInto(el, text, speed, hideCursorOnEnd = true) {
    return new Promise(resolve => {
      if (!el) return resolve();
      const content = (text ?? el.dataset.tw ?? el.textContent ?? '').trim();
      if (!content.length) return resolve();

      // If reduced motion: just show text and reveal immediately
      if (reduce) {
        el.textContent = content;
        el.style.visibility = 'visible';             // NEW: reveal immediately
        return resolve();
      }

      // Build wrapper + cursor
      el.textContent = '';
      const wrap = document.createElement('span');
      wrap.className = 'tw-wrap';

      const textNode = document.createElement('span'); // actual typed text
      const cursor = document.createElement('span');
      cursor.className = 'tw-cursor';

      wrap.appendChild(textNode);
      wrap.appendChild(cursor);
      el.appendChild(wrap);

      el.style.visibility = 'visible';                // NEW: reveal just before typing

      let i = 0;
      const timer = setInterval(() => {
        textNode.textContent = content.slice(0, ++i);
        if (i >= content.length) {
          clearInterval(timer);

          if (hideCursorOnEnd) {
            cursor.classList.add('tw-cursor-hide');
            cursor.addEventListener('animationend', () => cursor.remove(), { once: true });
          }

          setTimeout(resolve, HOLD);
        }
      }, speed);
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const h1 = document.querySelector('.header-bio h1');
    const tag = document.querySelector('.header-bio p');

    const h1Text = h1?.dataset.tw ?? h1?.textContent?.trim();
    const tagText = tag?.dataset.tw ?? tag?.textContent?.trim();

    // Hide the cursor after EACH line finishes
    if (h1) await typeInto(h1, h1Text, SPEED_MAIN, true);
    if (tag) await typeInto(tag, tagText, SPEED_TAG, true);

    // Safety cleanup
    document.querySelectorAll('.tw-cursor').forEach(n => n.remove());
  });
})();
