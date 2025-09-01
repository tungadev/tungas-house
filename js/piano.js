// piano.js
(() => {
  // Left-to-right keyboard labels (24 keys)
  const keyboardOrder = [
    'z','x','c','v','b','n','m',',','.','/','a','s',
    'd','f','g','h','j','k','l',';','q','w','e','r'
  ];

  // Build file path: "F3" -> "./piano-mp3/F3.mp3"
  const noteToSrc = (note) => `./piano-mp3/${note}.mp3`;

  // Per-note audio pools for polyphony
  const audioPools = new Map();    // note -> Audio[]
  const POOL_SIZE = 6;             // allow up to 6 overlapping plays per note

  function getAudioFor(note) {
    let pool = audioPools.get(note);
    if (!pool) {
      pool = [];
      audioPools.set(note, pool);
    }

    // Try to find an available audio element in the pool
    for (const a of pool) {
      if (a.ended || a.paused) {
        a.currentTime = 0;
        return a;
      }
    }

    // None free → create a new one (up to POOL_SIZE)
    if (pool.length < POOL_SIZE) {
      const a = new Audio(noteToSrc(note));
      // If the server is a bit slow, ensure it’s ready
      a.preload = 'auto';
      pool.push(a);
      return a;
    }

    // Pool full → recycle the oldest (or first) by restarting it
    const a = pool[0];
    a.pause();
    a.currentTime = 0;
    return a;
  }

  function playNote(noteOrEl, maybeEl) {
    let note = noteOrEl;
    let el   = maybeEl;
  
    // If first arg is a key element, extract its note
    if (noteOrEl && noteOrEl.dataset && noteOrEl.dataset.key) {
      el   = noteOrEl;
      note = noteOrEl.dataset.key;
    }
  
    if (typeof note !== 'string') {
      console.warn('playNote: invalid note argument', noteOrEl);
      return;
    }
  
    const audio = getAudioFor(note);
    if (!audio.src.includes(`/${note}.mp3`)) {
      audio.src = noteToSrc(note);
    }
    audio.play().catch(err => console.warn('play() failed:', note, err));
  
    if (el) {
      el.classList.add('active');
      setTimeout(() => el.classList.remove('active'), 120);
    }
  }


  document.addEventListener('DOMContentLoaded', () => {
    const keys = Array.from(document.querySelectorAll('.piano-keys'));
    const keyMap = new Map(); // keyboard char -> element

    // Wire clicks + label keys
    keys.forEach((el, i) => {
      const note = el.dataset.key; // e.g., "F3", "Gb3"
      if (!note) return;

      // Pre-warm a single audio per note for snappier first play
      const warm = new Audio(noteToSrc(note));
      warm.preload = 'auto';
      audioPools.set(note, [warm]);

      // Click handler
      el.addEventListener('click', () => playNote(note, el));

      // Optional keyboard hint + mapping
      const kbd = keyboardOrder[i];
      if (kbd) {
        el.dataset.kbd = kbd;
        keyMap.set(kbd, el);
      }
    });

    // Expose to key-shortcut.js
    window.Piano = { playNote, keyMap };
  });
})();
