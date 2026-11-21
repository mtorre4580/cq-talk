/**
 * Radio sound effects synthesized with Web Audio: no audio files. Ported 1:1 from the prototype
 * (docs/prototype/Main.dc.html, `playTuneIn` / `playOff`).
 */

type ContextFactory = () => AudioContext | null;

interface WebkitWindow {
  webkitAudioContext?: typeof AudioContext;
}

/** Standard `AudioContext`, or Safari's prefixed one behind feature detection. */
export const defaultContextFactory: ContextFactory = () => {
  const AC = globalThis.AudioContext ?? (globalThis as unknown as WebkitWindow).webkitAudioContext;
  return AC ? new AC() : null;
};

/** White noise with rare crackles, the base of every static sound. */
const noise = (ctx: AudioContext, seconds: number): AudioBufferSourceNode => {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    let v = Math.random() * 2 - 1;
    if (Math.random() < 0.0015) v *= 2.5;
    data[i] = Math.max(-1, Math.min(1, v * 0.6));
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  return source;
};

/** Static sweeping through the band, a heterodyne whistle and a beep when the signal locks. */
const tuneIn = (ctx: AudioContext) => {
  const t = ctx.currentTime + 0.02;

  const src = noise(ctx, 4);
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.Q.value = 0.8;
  bandpass.frequency.setValueAtTime(700, t);
  bandpass.frequency.linearRampToValueAtTime(2400, t + 1.2);
  bandpass.frequency.linearRampToValueAtTime(1300, t + 3);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.28, t + 0.08);
  gain.gain.setValueAtTime(0.28, t + 1.5);
  gain.gain.linearRampToValueAtTime(0.07, t + 2.7);
  gain.gain.linearRampToValueAtTime(0, t + 3.6);
  src.connect(bandpass).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + 4);

  // Heterodyne whistle: two close sines gliding down beat against each other
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const whistle = ctx.createGain();
  osc.type = 'sine';
  osc2.type = 'sine';
  osc.frequency.setValueAtTime(2600, t + 0.2);
  osc.frequency.exponentialRampToValueAtTime(420, t + 1.7);
  osc2.frequency.setValueAtTime(2612, t + 0.2);
  osc2.frequency.exponentialRampToValueAtTime(426, t + 1.7);
  whistle.gain.setValueAtTime(0, t + 0.2);
  whistle.gain.linearRampToValueAtTime(0.035, t + 0.4);
  whistle.gain.linearRampToValueAtTime(0, t + 1.8);
  osc.connect(whistle);
  osc2.connect(whistle);
  whistle.connect(ctx.destination);
  osc.start(t + 0.2);
  osc2.start(t + 0.2);
  osc.stop(t + 1.9);
  osc2.stop(t + 1.9);

  // "Signal locked" beep
  const beep = ctx.createOscillator();
  const beepGain = ctx.createGain();
  beep.type = 'sine';
  beep.frequency.value = 1000;
  beepGain.gain.setValueAtTime(0, t + 3.0);
  beepGain.gain.linearRampToValueAtTime(0.05, t + 3.02);
  beepGain.gain.setValueAtTime(0.05, t + 3.14);
  beepGain.gain.linearRampToValueAtTime(0, t + 3.17);
  beep.connect(beepGain).connect(ctx.destination);
  beep.start(t + 3.0);
  beep.stop(t + 3.2);
};

/** A short burst of high static and a low click: the microphone switching off. */
const off = (ctx: AudioContext) => {
  const t = ctx.currentTime + 0.02;

  const src = noise(ctx, 0.5);
  const highpass = ctx.createBiquadFilter();
  highpass.type = 'highpass';
  highpass.frequency.value = 900;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.22, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
  src.connect(highpass).connect(gain).connect(ctx.destination);
  src.start(t);
  src.stop(t + 0.5);

  const click = ctx.createOscillator();
  const clickGain = ctx.createGain();
  click.type = 'square';
  click.frequency.value = 110;
  clickGain.gain.setValueAtTime(0.08, t);
  clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  click.connect(clickGain).connect(ctx.destination);
  click.start(t);
  click.stop(t + 0.06);
};

/** Soft band-limited static that loops under the operator's voice; returns a stop function. */
const hiss = (ctx: AudioContext): (() => void) => {
  const src = noise(ctx, 2);
  src.loop = true;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.value = 1800;
  bandpass.Q.value = 0.6;
  const gain = ctx.createGain();
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.03, t + 0.2);
  src.connect(bandpass).connect(gain).connect(ctx.destination);
  src.start(t);
  return () => {
    const end = ctx.currentTime;
    gain.gain.setValueAtTime(0.03, end);
    gain.gain.linearRampToValueAtTime(0, end + 0.3);
    src.stop(end + 0.35);
  };
};

export interface RadioSfx {
  /**
   * Creates or resumes the audio context. Call it inside a user gesture (a click), because
   * browsers only allow audio to start from one; later sounds can then play from timers.
   */
  unlock(): void;
  tuneIn(): void;
  off(): void;
  /** Starts the static bed under a transmission; call the returned function to fade it out */
  hiss(): () => void;
  dispose(): void;
}

/** Sound effects bound to one lazily created context. Every call is a no-op without Web Audio. */
export const createRadioSfx = (createContext: ContextFactory = defaultContextFactory): RadioSfx => {
  let ctx: AudioContext | null = null;

  const ensure = (): AudioContext | null => {
    try {
      ctx ??= createContext();
      if (ctx?.state === 'suspended') void ctx.resume();
      return ctx;
    } catch {
      return null;
    }
  };

  const play = (sound: (c: AudioContext) => void) => {
    const c = ensure();
    if (!c) return;
    try {
      sound(c);
    } catch {
      // A broken audio stack must never break the radio
    }
  };

  return {
    unlock: () => void ensure(),
    tuneIn: () => play(tuneIn),
    off: () => play(off),
    hiss: () => {
      const c = ensure();
      if (!c) return () => {};
      try {
        return hiss(c);
      } catch {
        return () => {};
      }
    },
    dispose: () => {
      void ctx?.close().catch(() => {});
      ctx = null;
    },
  };
};
