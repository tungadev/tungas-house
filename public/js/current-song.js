document.addEventListener('DOMContentLoaded', async () => {
  try {
    const r = await fetch('https://fantastic-manatee-a1d0c8.netlify.app/.netlify/functions/api/getCurrentlyListening', { headers:{Accept:'application/json'} });
    if (!r.ok) throw new Error(r.status);
    const { title = '', artist = '', imageUrl = '',  isCurrentlyListening} = await r.json();
    statusText = 'Not Currently<br />Playing 🔴';
    if (!!isCurrentlyListening) {
      statusText = 'Listening Now 🟢';
    }

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
  } catch (e) {
    document.getElementById('banner').textContent = 'Nothing playing right now.';
    console.error(e);
  }
});
