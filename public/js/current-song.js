document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('https://fantastic-manatee-a1d0c8.netlify.app/.netlify/functions/api/getCurrentlyListening', { headers:{Accept:'application/json'} });
    if (!r.ok) throw new Error(r.status);
    const { title = '', artist = '', imageUrl = '' } = await r.json();

    document.getElementById('banner').innerHTML = `
      <div class="now-playing">
        <img src="https://cdn-images.dzcdn.net/images/cover/aad338ea81c77ec24dbaf0c826572371/500x500.jpg" alt="Album art" class="now-playing-image" />
        <div class="now-playing-text">
          <p class="title">${title}</p>
          <p class="artist">${artist}</p>
        </div>
      </div>`;
  } catch (e) {
    document.getElementById('banner').textContent = 'Nothing playing right now.';
    console.error(e);
  }
});
