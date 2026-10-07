import { generateQuestion } from './generators.js';
import { factOptions, fractionOptions } from './generators.phase2.js';
import { seededRng } from './random.js';

const rng = seededRng(2026);
const many = (skill: string, d: number, n = 200) => Array.from({ length: n }, () => generateQuestion(skill, d, rng));
const value = (f: string) => {
  const [n, d] = f.split('/').map(Number);
  return n / d;
};

describe('phase 2 generators', () => {
  it('times tables compute products in the right range', () => {
    for (const d of [1, 2, 3, 4]) {
      for (const q of many('MULT_TABLES_2_5', d)) {
        const [a, , b] = q.expression!.split(' ').map(Number);
        expect(Number(q.answer)).toBe(a * b);
        expect([a, b].some((x) => x >= 2 && x <= 5)).toBe(true);
      }
      for (const q of many('MULT_TABLES_6_10', d)) {
        const [a, , b] = q.expression!.split(' ').map(Number);
        expect(Number(q.answer)).toBe(a * b);
        expect([a, b].some((x) => x >= 6 && x <= 10)).toBe(true);
      }
    }
  });

  it('missing-factor questions are consistent', () => {
    for (const q of many('MULT_TABLES_2_5', 5)) {
      const [a, , , , product] = q.expression!.split(' ');
      expect(Number(a) * Number(q.answer)).toBe(Number(product));
    }
  });

  it('multi-digit multiplication regroups at difficulty 3', () => {
    for (const q of many('MULT_MULTI_DIGIT', 3)) {
      const [a, , m] = q.expression!.split(' ').map(Number);
      expect(Number(q.answer)).toBe(a * m);
      expect((a % 10) * m).toBeGreaterThanOrEqual(10);
    }
    for (const q of many('MULT_MULTI_DIGIT', 2)) {
      const [a, , m] = q.expression!.split(' ').map(Number);
      expect((a % 10) * m).toBeLessThan(10);
      expect(Math.floor(a / 10) * m).toBeLessThan(10);
    }
  });

  it('division always divides exactly', () => {
    for (const d of [1, 2, 3, 4]) {
      for (const q of many('DIV_BASIC', d)) {
        const [dividend, , divisor] = q.expression!.split(' ').map(Number);
        expect(dividend % divisor).toBe(0);
        expect(Number(q.answer)).toBe(dividend / divisor);
      }
    }
    for (const q of many('DIV_CONCEPT', 1)) {
      expect(q.visual?.kind).toBe('share');
      if (q.visual?.kind === 'share') expect(Number(q.answer)).toBe(q.visual.total / q.visual.groups);
    }
  });

  it('fraction pictures match the answer', () => {
    for (const d of [1, 2, 3]) {
      for (const q of many('FRAC_CONCEPT', d)) {
        if (q.visual?.kind !== 'fraction') throw new Error('expected a fraction visual');
        const { parts, shaded } = q.visual.items[0];
        expect(q.answer).toBe(`${shaded}/${parts}`);
        expect(shaded).toBeLessThan(parts);
      }
    }
  });

  it('fraction comparisons pick the larger fraction', () => {
    for (const d of [1, 2, 3]) {
      for (const q of many('FRAC_COMPARE', d)) {
        const other = q.options.find((o) => o !== q.answer)!;
        expect(value(q.answer)).toBeGreaterThan(value(other));
      }
    }
  });

  it('equivalent-fraction questions have exactly one equivalent option', () => {
    for (const q of many('FRAC_COMPARE', 5)) {
      const target = value(q.expression!);
      expect(q.options.filter((o) => Math.abs(value(o) - target) < 1e-9)).toEqual([q.answer]);
    }
  });

  it('fraction distractors are never equivalent to the answer', () => {
    for (let parts = 2; parts <= 10; parts++) {
      for (let shaded = 1; shaded < parts; shaded++) {
        const options = fractionOptions(rng, shaded, parts);
        expect(options).toHaveLength(4);
        expect(options.filter((o) => Math.abs(value(o) - shaded / parts) < 1e-9)).toEqual([`${shaded}/${parts}`]);
      }
    }
  });

  it('fact options always include the answer', () => {
    for (let a = 1; a <= 10; a++) {
      for (let b = 1; b <= 10; b++) {
        const o = factOptions(rng, a * b, a, b);
        expect(o).toContain(String(a * b));
        expect(new Set(o).size).toBe(o.length);
        expect(o.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('word problems have non-negative whole-number answers', () => {
    for (const skill of ['WORD_ADD_SUB', 'WORD_MULT_DIV']) {
      for (let d = 1; d <= 5; d++) {
        for (const q of many(skill, d, 100)) {
          expect(Number.isInteger(Number(q.answer))).toBe(true);
          expect(Number(q.answer)).toBeGreaterThanOrEqual(0);
          expect(q.prompt).toMatch(/\?$/);
        }
      }
    }
  });
});
