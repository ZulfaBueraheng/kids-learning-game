// Curated question banks for subjects whose questions are facts rather than arithmetic.
import type { GeneratedQuestion, Generator, QuestionVisual } from './kit.js';
import { pick, shuffle, type Rng } from './random.js';

export interface BankItem {
  /** difficulty 1–5 this item is written for */
  d: number;
  prompt: string;
  /** big text/emoji shown in the middle of the card */
  expression?: string;
  visual?: QuestionVisual;
  answer: string;
  /** wrong options; three are picked at random */
  distractors: string[];
  hint: string;
}

/**
 * Picks an item at the requested difficulty, falling back to the nearest easier
 * one, so every skill works at every difficulty even with a small bank.
 */
export function fromBank(rng: Rng, difficulty: number, bank: BankItem[]): GeneratedQuestion {
  if (bank.length === 0) throw new Error('Empty question bank');
  let pool: BankItem[] = [];
  for (let d = difficulty; d >= 1 && pool.length === 0; d--) pool = bank.filter((b) => b.d === d);
  if (pool.length === 0) pool = bank.filter((b) => b.d === Math.min(...bank.map((x) => x.d)));
  const item = pick(rng, pool);
  const wrong = shuffle(rng, [...new Set(item.distractors)].filter((x) => x !== item.answer)).slice(0, 3);
  return {
    prompt: item.prompt,
    expression: item.expression,
    visual: item.visual,
    options: shuffle(rng, [item.answer, ...wrong]),
    answer: item.answer,
    hint: item.hint,
  };
}

/** A generator backed by a bank (theme context is not used by fact questions). */
export function bankGenerator(bank: BankItem[]): Generator {
  return (rng, d) => fromBank(rng, d, bank);
}
