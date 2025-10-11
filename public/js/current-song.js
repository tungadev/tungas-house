document.addEventListener('DOMContentLoaded', async () => {
  const banner = document.getElementById('banner');
  try {
    const r = await fetch('https://fantastic-manatee-a1d0c8.netlify.app/.netlify/functions/api/getCurrentlyListening', {
      headers:{Accept:'application/json'}
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);

    const { title = '', artist = '', imageUrl = '' } = await r.json();
    console.log('imageUrl:', imageUrl);

    banner.innerHTML = `
      <div class="now-playing" style="display:flex;gap:12px;align-items:center;">
        <img id="np-img" src="${imageUrl}" alt="Album art"
             class="now-playing-image"
             style="width:80px;height:80px;object-fit:cover;border-radius:8px;" />
        <div class="now-playing-text">
          <p class="title">${title}</p>
          <p class="artist">${artist}</p>
        </div>
      </div>`;

    const img = document.getElementById('np-img');
    img.addEventListener('load', () => console.log('Image loaded OK', img.naturalWidth, 'x', img.naturalHeight));
    img.addEventListener('error', (e) => {
      console.error('Image failed to load:', imageUrl, e);
      // fallback image to prove rendering works
      img.src = 'https://via.placeholder.com/80';
    });
  } catch (e) {
    banner.textContent = 'Nothing playing right now.';
    console.error(e);
  }
});