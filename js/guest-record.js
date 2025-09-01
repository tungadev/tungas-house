// recorder-domtap.js (playback + Saved Songs list + button color states)
(() => {
  // Must match your piano DOM order (24 keys)
  const keyboardOrder = [
    'z','x','c','v','b','n','m',',','.','/','a','s',
    'd','f','g','h','j','k','l',';','q','w','e','r'
  ];

  const $ = (s) => document.querySelector(s);

  // Old single-take key (back-compat) + new songs list key
  const STORAGE_KEY_SINGLE = 'piano_take_domtap';
  const STORAGE_KEY_SONGS  = 'pianoSongsV1';

  const state = {
    recording: false,
    playing: false,
    timers: [],
    last: 0,
    take: [],                 // current unsaved take
    keyToNote: new Map(),     // 'z' -> 'F3'
  };

  // ---------- Button state helpers (for .is-active colors) ----------
  const btn = (id) => document.getElementById(id);
  const ALL_BTNS = ['rec','stop','play','save'];

  function clearActive() {
    ALL_BTNS.forEach(id => btn(id)?.classList.remove('is-active'));
  }
  function setActive(id) {
    clearActive();
    btn(id)?.classList.add('is-active');
  }
  function flashActive(id, ms = 600) {
    const b = btn(id);
    if (!b) return;
    b.classList.add('is-active');
    setTimeout(() => b.classList.remove('is-active'), ms);
  }

  // ---------- Key mapping ----------
  function buildKeyMap() {
    // Prefer the live map exposed by piano.js (always in sync)
    if (window.Piano?.keyMap instanceof Map) {
      state.keyToNote = new Map(window.Piano.keyMap);
      return;
    }
    // Fallback: infer from DOM order
    const keys = Array.from(document.querySelectorAll('.piano-keys'));
    const notes = keys.map(el => el?.dataset?.key).filter(Boolean);
    state.keyToNote.clear();
    keyboardOrder.forEach((kbd, i) => {
      const note = notes[i];
      if (kbd && note) state.keyToNote.set(kbd, note);
    });
  }

  function updateStatus(_msg) {
    // Optional: wire a #status if you want
    // console.log('[recorder]', _msg ?? '', `(${state.take.length} notes)`);
  }

  // ---------- Recording ----------
  function startRecord() {
    if (state.playing) stopPlay();
    state.take = [];
    state.recording = true;
    state.last = performance.now();
    setActive('rec');                  // turn Record red while recording
    updateStatus('recording');
  }

  function stopAll() {
    state.recording = false;
    state.last = 0;
    stopPlay();
    clearActive();
    flashActive('stop', 450);          // brief purple flash on Stop
    updateStatus('stopped');
  }

  function recordNote(note) {
    if (!state.recording || state.playing || !note) return;
    const now = performance.now();
    const delta = Math.round(now - state.last);
    state.take.push({ time: state.take.length ? delta : 0, note });
    state.last = now;
  }

  // ---------- Playback ----------
  function playTake() {
    if (state.playing) return;
    if (!state.take.length) return updateStatus('nothing to play');
    playback(state.take);
  }

  function playback(seq) {
    if (state.playing || !seq?.length) return;
    state.playing = true;
    setActive('play');                 // green while playing
    updateStatus('playing');

    let delay = 0;
    state.timers = [];

    for (const ev of seq) {
      delay += (typeof ev.time === 'number' ? ev.time : 0);
      const id = setTimeout(() => {
        const el = document.querySelector(`.piano-keys[data-key="${ev.note}"]`);
        if (window.Piano?.playNote) {
          window.Piano.playNote(ev.note, el || undefined);
        } else {
          el?.click();
        }
      }, delay);
      state.timers.push(id);
    }

    // Finalizer
    const doneId = setTimeout(() => {
      state.playing = false;
      state.timers = [];
      clearActive();                   // back to blue when finished
      updateStatus('done');
    }, delay + 10);
    state.timers.push(doneId);
  }

  function stopPlay() {
    state.timers.forEach(clearTimeout);
    state.timers = [];
    state.playing = false;
  }

  // ---------- Simple local save of current take (back-compat) ----------
  function saveSingleTakeForCompat() {
    const payload = { version: 1, createdAt: Date.now(), events: state.take };
    localStorage.setItem(STORAGE_KEY_SINGLE, JSON.stringify(payload));
  }

  // ---------- Saved Songs list ----------
  const loadSongs = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_SONGS)) || []; }
    catch { return []; }
  };
  const saveSongs = (songs) => localStorage.setItem(STORAGE_KEY_SONGS, JSON.stringify(songs));

  const escapeHtml = (s='') =>
    s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function renderSongs() {
    const list = $('#songs-list');
    if (!list) return;

    const songs = loadSongs();
    if (!songs.length) {
      list.innerHTML = `<p class="muted">No saved songs yet.</p>`;
      return;
    }

    list.innerHTML = '';
    songs.forEach(song => {
      const totalMs = song.events.reduce((a, e) => a + (e.time || 0), 0);
      const el = document.createElement('div');
      el.className = 'song-card';

      el.innerHTML = `
        <div class="song-head">
          <div class="song-meta">
            <strong class="song-title">${escapeHtml(song.name)}</strong>
            <span class="song-sub">${new Date(song.createdAt).toLocaleString()} • ${song.events.length} notes • ${(totalMs/1000).toFixed(2)}s</span>
          </div>
          <div class="song-actions">
            <button class="song-play" aria-label="Play ${escapeHtml(song.name)}">▶</button>
            <button class="song-del"  aria-label="Delete ${escapeHtml(song.name)}">✕</button>
          </div>
        </div>
      `;

      el.querySelector('.song-play')?.addEventListener('click', () => {
        if (!song.events?.length) return;
        playback(song.events);
      });

      el.querySelector('.song-del')?.addEventListener('click', () => {
        const next = loadSongs().filter(s => s.id !== song.id);
        saveSongs(next);
        renderSongs();
      });

      list.appendChild(el);
    });
  }

  // Save current take into the Saved Songs list and re-render
  function saveTake() {
    if (!state.take.length) return alert('No notes to save yet.');
    saveSingleTakeForCompat();

    const songs = loadSongs();
    const nameDefault = `Take ${songs.length + 1}`;
    const name = prompt('Name this song:', nameDefault) || nameDefault;
    const song = {
      id: (crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2))),
      name,
      createdAt: Date.now(),
      events: state.take.slice(),
    };
    songs.push(song);
    saveSongs(songs);
    renderSongs();
    flashActive('save', 800);          // baby blue flash on Save
    updateStatus(`saved "${name}" (${song.events.length} notes)`);
  }

  // ---------- Export / Import / Share (optional controls) ----------
  function timestamp() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  }

  function exportJSON() {
    if (!state.take.length) return updateStatus('nothing to export');
    const payload = { version: 1, createdAt: Date.now(), events: state.take };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `piano-take-${timestamp()}.json`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
    updateStatus('exported');
  }

  function importJSONFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(String(reader.result));
        const events = Array.isArray(obj?.events) ? obj.events
                      : (Array.isArray(obj) ? obj : []);
        if (!events.length) return updateStatus('import had 0 notes');
        state.take = events.filter(e => e && typeof e.time === 'number' && typeof e.note === 'string');
        updateStatus(`imported (${state.take.length} notes)`);
      } catch {
        updateStatus('import error');
      }
    };
    reader.readAsText(file);
  }

  function copyShareURL() {
    if (!state.take.length) return updateStatus('nothing to share');
    const json = JSON.stringify(state.take);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const url = `${location.origin}${location.pathname}#take=${b64}`;
    (navigator.clipboard?.writeText(url) || Promise.reject())
      .then(() => updateStatus('share URL copied'))
      .catch(() => { prompt('Copy this URL:', url); updateStatus('share URL ready'); });
  }

  function loadFromHash() {
    const m = location.hash.match(/^#take=(.+)$/);
    if (!m) return false;
    try {
      const json = decodeURIComponent(escape(atob(m[1])));
      const take = JSON.parse(json);
      if (Array.isArray(take) && take.length) {
        state.take = take;
        updateStatus(`loaded from URL (${take.length} notes)`);
        return true;
      }
    } catch {}
    updateStatus('bad share URL');
    return false;
  }

  // ---------- Event wiring ----------
  document.addEventListener('DOMContentLoaded', () => {
    buildKeyMap();
    renderSongs();

    // Record mouse clicks on keys
    document.addEventListener('click', (e) => {
      const keyEl = e.target.closest?.('.piano-keys');
      if (!keyEl) return;
      recordNote(keyEl.dataset?.key);
    });

    // Record keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.repeat) return;
      const k = e.key.toLowerCase();
      const note = state.keyToNote.get(k);
      if (note) recordNote(note);
    });

    // Basic buttons
    $('#rec')?.addEventListener('click', startRecord);
    $('#stop')?.addEventListener('click', stopAll);
    $('#play')?.addEventListener('click', playTake);
    $('#save')?.addEventListener('click', saveTake);

    // Optional extras (only if present)
    $('#export')?.addEventListener('click', exportJSON);
    $('#import')?.addEventListener('click', () => $('#importFile')?.click());
    $('#importFile')?.addEventListener('change', (e) => importJSONFile(e.target.files?.[0]));
    $('#share')?.addEventListener('click', copyShareURL);

    loadFromHash();
    updateStatus('ready');
  });

  // Optional external access
  window.Recorder = {
    startRecord, stopAll, playTake, stopPlay,
    saveTake, exportJSON, importJSONFile, copyShareURL, state
  };
})();
