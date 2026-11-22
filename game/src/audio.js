// Synthesized sound: no audio files, just WebAudio oscillators. The audio context
// is created on the first user gesture (the browser requires it), so the title
// screen is silent until the player starts.
let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

function tone(freq, dur, type = 'sine', when = 0, slideTo = null) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(1, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playSound(name) {
  if (!ctx) return;
  switch (name) {
    case 'loot':
      tone(880, 0.12, 'sine');
      tone(1318, 0.16, 'sine', 0.07);
      break;
    case 'vault':
      tone(523, 0.14, 'triangle');
      tone(659, 0.14, 'triangle', 0.1);
      tone(784, 0.22, 'triangle', 0.2);
      break;
    case 'floor':
      tone(392, 0.12, 'triangle');
      tone(523, 0.18, 'triangle', 0.09);
      break;
    case 'alarm':
      tone(620, 0.5, 'sawtooth', 0, 440);
      tone(620, 0.5, 'sawtooth', 0.55, 440);
      break;
    case 'caught':
      tone(220, 0.4, 'sawtooth', 0, 110);
      break;
    case 'win':
      tone(523, 0.16, 'triangle');
      tone(659, 0.16, 'triangle', 0.12);
      tone(784, 0.16, 'triangle', 0.24);
      tone(1046, 0.3, 'triangle', 0.36);
      break;
    case 'step':
      tone(140, 0.05, 'sine');
      break;
    default:
      break;
  }
}
