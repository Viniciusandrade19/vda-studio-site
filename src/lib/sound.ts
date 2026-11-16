/* Som opcional, sintetizado na hora (nenhum arquivo de áudio).
   Desligado por padrão; só toca depois que a pessoa liga o botão "Som". */
type Listener = (on: boolean) => void;

let ctx: AudioContext | null = null;
let enabled = false;
const listeners = new Set<Listener>();

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export const sound = {
  get on() {
    return enabled;
  },
  toggle() {
    enabled = !enabled;
    if (enabled) {
      audio();
      sound.click();
    }
    listeners.forEach((l) => l(enabled));
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },

  /** Ronco curto de motor: sobe a rotação e volta. `heavy` deixa mais grave (caminhão). */
  rev(heavy = 0.5) {
    if (!enabled) return;
    const a = audio();
    const t = a.currentTime;
    const base = 38 - heavy * 14;
    const out = a.createGain();
    out.gain.setValueAtTime(0.0001, t);
    out.gain.exponentialRampToValueAtTime(0.22, t + 0.08);
    out.gain.exponentialRampToValueAtTime(0.12, t + 0.7);
    out.gain.exponentialRampToValueAtTime(0.0001, t + 1.5);
    const lp = a.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(900, t + 0.35);
    lp.frequency.linearRampToValueAtTime(320, t + 1.4);
    lp.Q.value = 4;
    lp.connect(out).connect(a.destination);
    [1, 2.01, 0.5].forEach((mult, i) => {
      const o = a.createOscillator();
      o.type = i === 2 ? 'square' : 'sawtooth';
      o.frequency.setValueAtTime(base * mult, t);
      o.frequency.exponentialRampToValueAtTime(base * mult * 2.6, t + 0.35);
      o.frequency.exponentialRampToValueAtTime(base * mult * 1.2, t + 1.3);
      const g = a.createGain();
      g.gain.value = i === 0 ? 0.6 : 0.25;
      // pulsação dos cilindros
      const lfo = a.createOscillator();
      const lg = a.createGain();
      lfo.frequency.setValueAtTime(18, t);
      lfo.frequency.linearRampToValueAtTime(42, t + 0.35);
      lg.gain.value = 0.35;
      lfo.connect(lg).connect(g.gain);
      o.connect(g).connect(lp);
      o.start(t);
      lfo.start(t);
      o.stop(t + 1.6);
      lfo.stop(t + 1.6);
    });
  },

  /** Clique seco de catraca (mostrador, seletores). */
  tick() {
    if (!enabled) return;
    const a = audio();
    const t = a.currentTime;
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(2400, t);
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(g).connect(a.destination);
    o.start(t);
    o.stop(t + 0.04);
  },

  /** Clique de interruptor (faróis, luzes da garagem). */
  click() {
    if (!enabled) return;
    const a = audio();
    const t = a.currentTime;
    const buf = a.createBuffer(1, a.sampleRate * 0.05, a.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 6);
    const src = a.createBufferSource();
    src.buffer = buf;
    const g = a.createGain();
    g.gain.value = 0.25;
    src.connect(g).connect(a.destination);
    src.start(t);
  },
};
