/* ─────────────────────────────────────────────
   audio.js  –  Web Audio API: ambient hum + beeps
   ───────────────────────────────────────────── */

let audioCtx = null;

/**
 * Lazy-init the AudioContext on first user interaction.
 * Also starts a low drone-hum oscillator.
 */
function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const lp   = audioCtx.createBiquadFilter();

  lp.type            = 'lowpass';
  lp.frequency.value = 260;

  osc.type           = 'sawtooth';
  osc.frequency.value = 80;
  gain.gain.value    = 0;

  osc.connect(lp);
  lp.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();

  gain.gain.setTargetAtTime(.025, audioCtx.currentTime, .7);
}

/**
 * Play a short sine-wave beep.
 * @param {number} freq   - Frequency in Hz (default 880)
 * @param {number} dur    - Duration in seconds (default 0.08)
 */
function beep(freq = 880, dur = .08) {
  if (!audioCtx) return;
  const osc  = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.type = 'sine';
  gain.gain.setValueAtTime(.07, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, audioCtx.currentTime + dur);
  osc.start();
  osc.stop(audioCtx.currentTime + dur + .01);
}

// Bootstrap audio on any click (required by browsers)
document.addEventListener('click', () => { initAudio(); beep(1100, .05); });
