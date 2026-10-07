'use client';

/**
 * Small game sounds made with the Web Audio API — no sound files to load.
 * Mistakes get a soft, friendly "boop", never a harsh buzzer.
 */

const SOUND_KEY = 'klg.sound';
let ctx: AudioContext | null = null;

export function readSoundOn(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeSoundOn(on: boolean) {
  try {
    localStorage.setItem(SOUND_KEY, on ? 'on' : 'off');
  } catch {}
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || !readSoundOn()) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, at: number, duration: number, type: OscillatorType = 'sine', volume = 0.12, slideTo?: number) {
  const ac = audio();
  if (!ac) return;
  const start = ac.currentTime + at;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ac.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

// C major pentatonic: always sounds happy whatever order the notes come in.
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568];

export const sfx = {
  /** Rises with the combo, so a streak sounds like climbing up. */
  correct(combo = 1) {
    const base = Math.min(combo - 1, SCALE.length - 3);
    tone(SCALE[base], 0, 0.12, 'triangle');
    tone(SCALE[base + 2], 0.08, 0.22, 'triangle');
  },
  wrong() {
    tone(330, 0, 0.18, 'sine', 0.08, 262);
  },
  hit() {
    tone(180, 0, 0.12, 'square', 0.06, 90);
    tone(880, 0.05, 0.18, 'triangle', 0.1);
  },
  countdown(last = false) {
    tone(last ? 1047 : 659, 0, last ? 0.35 : 0.12, 'triangle', 0.1);
  },
  star(i: number) {
    tone(SCALE[3 + i * 2], 0, 0.25, 'triangle', 0.12);
  },
  coin() {
    tone(1319, 0, 0.06, 'square', 0.04);
    tone(1760, 0.05, 0.1, 'square', 0.04);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.12));
  },
  tryAgain() {
    [392, 523].forEach((f, i) => tone(f, i * 0.15, 0.25, 'sine', 0.1));
  },
};
