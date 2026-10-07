'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Read-aloud for children who cannot read well yet. Uses the browser's own
 * voices (Web Speech API), so nothing leaves the device. Thai runs are read
 * with a Thai voice and English runs with an English voice.
 */

type Lang = 'th' | 'en';

export interface SpeechPart {
  text: string;
  /** Called when this part starts, e.g. to highlight the option being read. */
  onStart?: () => void;
}

const AUTO_READ_KEY = 'klg.autoRead';
const RATE = 0.85;
const MAX_CHUNK = 160;

const EMOJI = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}\u{FE0F}\u{200D}\u{20E3}]/gu;
// An English run: words joined by spaces, blanks (___) and light punctuation.
const ENGLISH = /[A-Za-z]+(?:['’][A-Za-z]+)?(?:[\s,.!?_'’-]+[A-Za-z]+(?:['’][A-Za-z]+)?)*[.!?]?/g;

/** Turns maths notation into words a Thai voice can say: "7 + 5 = ?" → "7 บวก 5 เท่ากับ เท่าไร". */
export function speakable(text: string): string {
  const unknown = /\d/.test(text) ? ' เท่าไร ' : ' อะไร ';
  return text
    .replace(EMOJI, ' ')
    .replace(/(\d+)\/(\d+)/g, ' $1 ส่วน $2 ')
    .replace(/_{2,}/g, ' ... ')
    .replace(/□/g, unknown)
    .replace(/(^|[\s=→(])\?(?=$|[\s→)])/g, `$1${unknown}`)
    .replace(/×/g, ' คูณ ')
    .replace(/÷/g, ' หาร ')
    .replace(/\+/g, ' บวก ')
    .replace(/(\d|\s)[−–-](?=\s|\d)/g, '$1 ลบ ')
    .replace(/=/g, ' เท่ากับ ')
    .replace(/</g, ' น้อยกว่า ')
    .replace(/>/g, ' มากกว่า ')
    .replace(/→/g, ' , ')
    .replace(/%/g, ' เปอร์เซ็นต์ ')
    .replace(/°/g, ' องศา ')
    .replace(/["“”]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits text into Thai and English runs, each short enough for every browser to finish. */
export function splitByLanguage(text: string): { text: string; lang: Lang }[] {
  const out: { text: string; lang: Lang }[] = [];
  const push = (t: string, lang: Lang) => {
    for (const chunk of chunks(t.trim())) if (/[\p{L}\p{N}]/u.test(chunk)) out.push({ text: chunk, lang });
  };
  let last = 0;
  for (const m of text.matchAll(ENGLISH)) {
    push(text.slice(last, m.index), 'th');
    push(m[0].replace(/_+/g, ' '), 'en');
    last = m.index + m[0].length;
  }
  push(text.slice(last), 'th');
  return out;
}

function chunks(text: string): string[] {
  if (text.length <= MAX_CHUNK) return [text];
  const out: string[] = [];
  let line = '';
  for (const word of text.split(/(?<=\s)/)) {
    if (line.length + word.length > MAX_CHUNK && line) {
      out.push(line);
      line = '';
    }
    line += word;
  }
  if (line) out.push(line);
  return out;
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | undefined {
  const matching = voices.filter((v) => v.lang.toLowerCase().replace('_', '-').startsWith(lang));
  if (lang === 'en') return matching.find((v) => /en-us/i.test(v.lang)) ?? matching[0];
  return matching[0];
}

export function readAutoRead(): boolean {
  try {
    return localStorage.getItem(AUTO_READ_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function writeAutoRead(on: boolean) {
  try {
    localStorage.setItem(AUTO_READ_KEY, on ? 'on' : 'off');
  } catch {}
}

/**
 * `available` is false when the browser has no Thai voice — reading Thai with
 * an English voice is gibberish, so the read-aloud buttons stay hidden then.
 */
export function useSpeech() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [speaking, setSpeaking] = useState(false);
  // cancel() fires end/error on the old queue later; only the latest request may clear `speaking`.
  const request = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener('voiceschanged', load);
    return () => {
      synth.removeEventListener('voiceschanged', load);
      synth.cancel();
    };
  }, []);

  const thai = pickVoice(voices, 'th');
  const english = pickVoice(voices, 'en');

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    request.current++;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    (parts: SpeechPart[]) => {
      if (!thai) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const id = ++request.current;
      const done = () => id === request.current && setSpeaking(false);
      const utterances: SpeechSynthesisUtterance[] = [];
      for (const part of parts) {
        splitByLanguage(speakable(part.text)).forEach((run, i) => {
          const u = new SpeechSynthesisUtterance(run.text);
          const voice = run.lang === 'en' ? (english ?? thai) : thai;
          u.voice = voice;
          u.lang = voice.lang;
          u.rate = RATE;
          if (i === 0 && part.onStart) u.onstart = part.onStart;
          utterances.push(u);
        });
      }
      if (!utterances.length) return;
      const last = utterances[utterances.length - 1];
      last.onend = done;
      utterances.forEach((u) => (u.onerror = done));
      setSpeaking(true);
      utterances.forEach((u) => synth.speak(u));
    },
    [thai, english],
  );

  return { available: !!thai, speaking, speak, stop };
}
