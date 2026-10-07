// Shared building blocks for question generators.
import { shuffle, type Rng } from './random.js';
import { THEME_PACKS, type QuestionContext } from './themes.js';

export type QuestionVisual =
  | { kind: 'objects'; emoji: string; count: number }
  | { kind: 'groups'; groups: { label: string; emoji: string; count: number }[] }
  | { kind: 'addition'; emoji: string; a: number; b: number }
  | { kind: 'subtraction'; emoji: string; total: number; remove: number }
  /** rows × cols grid of objects (multiplication) */
  | { kind: 'array'; emoji: string; rows: number; cols: number }
  /** total objects to be shared equally between `groups` plates (division) */
  | { kind: 'share'; emoji: string; total: number; groups: number }
  /** shapes split into equal parts with some shaded (fractions) */
  | { kind: 'fraction'; shape: 'circle' | 'bar'; items: { parts: number; shaded: number; label?: string }[] }
  /** 10×10 square with `shaded` cells coloured (decimals, percentages) */
  | { kind: 'grid100'; shaded: number }
  /** counts of different things side by side (ratios) */
  | { kind: 'tally'; items: { emoji: string; count: number; label: string }[] }
  /** regular polygon with n sides */
  | { kind: 'polygon'; sides: number }
  /** rectangle with labelled sides; `grid` draws unit squares */
  | { kind: 'rect'; width: number; height: number; unit: string; grid?: boolean }
  /** triangle with its three angle labels, e.g. ['60°', '70°', '?'] */
  | { kind: 'triangle'; labels: [string, string, string] }
  /** a single angle drawn in degrees */
  | { kind: 'angle'; degrees: number }
  /** a short reading passage or clue lines, shown in a reading box (line breaks kept) */
  | { kind: 'passage'; text: string }
  /** an analogue clock face (hour 1–12, minute 0–59) */
  | { kind: 'clock'; hour: number; minute: number }
  /** Thai coins (1, 2, 5, 10) and banknotes (20, 50, 100, 500, 1000) */
  | { kind: 'money'; items: { value: number; count: number }[] };

export interface GeneratedQuestion {
  prompt: string;
  /** Big text shown in the middle of the card, e.g. "7 + 5 = ?" */
  expression?: string;
  visual?: QuestionVisual;
  options: string[];
  answer: string;
  hint: string;
}

export type Generator = (rng: Rng, difficulty: number, ctx: QuestionContext) => GeneratedQuestion;

const THAI_DIGITS = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
const THAI_UNITS = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];

/** Default (GENERAL theme) countable things. */
export const THINGS = THEME_PACKS.GENERAL.things;

export function thaiNumberWord(n: number): string {
  if (n < 10) return THAI_UNITS[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  const tensWord = tens === 1 ? 'สิบ' : tens === 2 ? 'ยี่สิบ' : `${THAI_UNITS[tens]}สิบ`;
  if (ones === 0) return tensWord;
  return tensWord + (ones === 1 ? 'เอ็ด' : THAI_UNITS[ones]);
}

export function toThaiDigits(n: number): string {
  return String(n)
    .split('')
    .map((d) => THAI_DIGITS[Number(d)])
    .join('');
}

/** Four shuffled options: the answer plus plausible nearby mistakes. */
export function numericOptions(rng: Rng, answer: number, min = 0): string[] {
  const candidates = new Set<number>([answer + 1, answer - 1, answer + 2, answer - 2]);
  if (answer >= 10) {
    candidates.add(answer + 10);
    candidates.add(answer - 10);
    const swapped = Number(String(answer).split('').reverse().join(''));
    candidates.add(swapped);
  }
  const pool = shuffle(
    rng,
    [...candidates].filter((c) => c >= min && c !== answer),
  );
  const chosen = pool.slice(0, 3);
  for (let k = 3; chosen.length < 3; k++) {
    if (!chosen.includes(answer + k)) chosen.push(answer + k);
  }
  return shuffle(rng, [answer, ...chosen]).map(String);
}

export function level<T>(difficulty: number, table: readonly T[]): T {
  return table[Math.min(Math.max(difficulty, 1), table.length) - 1];
}
