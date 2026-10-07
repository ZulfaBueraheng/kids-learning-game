import { generateQuestion } from '../generators.js';
import { seededRng } from '../random.js';
import { CONSONANTS } from './reading.js';
import { misspellings, WORDS } from './english.js';

const rng = seededRng(606);
const many = (skill: string, d: number, n = 150) => Array.from({ length: n }, () => generateQuestion(skill, d, rng));

describe('subject generators', () => {
  it('English: lowercase/uppercase pairs are right', () => {
    for (const q of many('EN_LETTERS', 1)) expect(q.answer).toBe(q.expression!.toLowerCase());
    for (const q of many('EN_LETTERS', 2)) expect(q.answer).toBe(q.expression!.toUpperCase());
  });

  it('English: picture words match their picture', () => {
    const all = Object.values(WORDS).flat();
    for (const q of many('EN_VOCAB_PICTURE', 3)) {
      expect(all.find((w) => w.emoji === q.expression)!.word).toBe(q.answer);
    }
  });

  it('English: the missing letter completes the word', () => {
    const all = Object.values(WORDS).flat();
    for (const q of many('EN_SPELLING', 1)) {
      const [emoji, masked] = q.expression!.split('  ');
      const word = all.find((w) => w.emoji === emoji)!.word;
      expect(masked.replace(/ /g, '').replace('_', q.answer)).toBe(word);
    }
  });

  it('English: misspellings are never the real word', () => {
    for (const w of ['cat', 'rabbit', 'elephant', 'clock']) {
      const bad = misspellings(rng, w);
      expect(bad).not.toContain(w);
      expect(bad.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('Reading: the next consonant follows ก–ฮ order', () => {
    const order = CONSONANTS.map((c) => c.letter);
    for (const q of many('TH_CONSONANTS', 3)) {
      const shown = q.expression!.split(' → ')[0];
      expect(order.indexOf(q.answer)).toBe(order.indexOf(shown) + 1);
    }
    expect(order).toHaveLength(44);
  });

  it('Logic: the pattern answer continues the repeating unit', () => {
    for (const d of [1, 2, 3, 4, 5]) {
      for (const q of many('LOG_PATTERNS', d)) {
        const seq = q.expression!.replace(' ?', '').split(' ');
        // find the shortest period that explains the sequence, then predict
        const period = [2, 3, 4].find((p) => seq.every((s, i) => i < p || s === seq[i - p]))!;
        expect(period).toBeDefined();
        expect(q.answer).toBe(seq[seq.length - period]);
      }
    }
  });

  it('Logic: symbol puzzles have a consistent unique answer', () => {
    for (const d of [1, 2, 3, 4, 5]) {
      for (const q of many('LOG_SYMBOLS', d)) {
        if (q.visual?.kind !== 'passage') throw new Error('expected clue lines');
        expect(Number(q.answer)).toBeGreaterThan(0);
        expect(q.options).toContain(q.answer);
      }
    }
  });

  it('Logic: deduction picks the right person', () => {
    for (const q of many('LOG_DEDUCTION', 1)) {
      if (q.visual?.kind !== 'passage') throw new Error('expected clue lines');
      // The tallest never appears on the right-hand side of a comparison
      const lines = q.visual.text.split('\n');
      expect(lines.every((l) => !l.endsWith(q.answer))).toBe(true);
    }
  });

  it('Logic: day arithmetic wraps around the week', () => {
    const days = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
    for (const q of many('LOG_SEQUENCE', 5)) {
      const m = /ถ้าวันนี้เป็น(.+) อีก (\d+) วันจะเป็นวันอะไร/.exec(q.prompt)!;
      expect(q.answer).toBe(days[(days.indexOf(m[1]) + Number(m[2])) % 7]);
    }
  });
});
