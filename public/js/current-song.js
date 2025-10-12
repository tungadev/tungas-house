document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('http://localhost:8080/getCurrentlyListening', {
      headers: { Accept: 'application/json' }
    });

    if (!r.ok) throw new Error(r.status);

    const { title = '', artist = '', imageUrl = '', isCurrentlyListening } = await r.json();
    const statusText = isCurrentlyListening ? 'Listening Now 🟢' : 'Not Currently<br />Playing 🔴';

    // Inject HTML first
    document.getElementById('banner').innerHTML = `
      <div class="now-playing">
        <img src="${imageUrl}" alt="Album art" class="now-playing-image" />
        <div class="now-playing-text">
          <p class="title">${title}</p>
          <p class="artist">${artist}</p>
        </div>
        <div class="now-playing-status">
          <p class="status-text">${statusText}</p>
        </div>
      </div>`;

    // ✅ Now that the HTML exists, run marquee setup
    applyMarquee();
  } catch (e) {
    document.getElementById('banner').textContent = 'Nothing playing right now.';
    console.error(e);
  }
});

// Reuse your existing applyMarquee() function here (exact same code)
function applyMarquee() {
  const container = document.getElementById('banner');
  if (!container) return;

  const els = container.querySelectorAll(
    '.now-playing-text .title, .now-playing-text .artist'
  );

  els.forEach(el => {
    // unwrap previous inner span if re-running
    const text = el.textContent;
    el.innerHTML = `<span class="scroll-inner">${text}</span>`;

    const inner = el.querySelector('.scroll-inner');
    const containerWidth = el.clientWidth;
    const contentWidth = inner.scrollWidth;

    if (contentWidth > containerWidth + 1) {
      const distance = contentWidth - containerWidth;
      el.style.setProperty('--scroll-distance', `${distance}px`);
      const durationSec = Math.max(8, Math.min(30, distance / 20));
      el.style.setProperty('--scroll-duration', `${durationSec}s`);
      el.classList.add('scroll');
    } else {
      el.classList.remove('scroll');
    }
  });
}

// Keep the resize listener
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(applyMarquee, 150);
});
