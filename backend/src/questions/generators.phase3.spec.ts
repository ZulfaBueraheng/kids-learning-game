import { generateQuestion } from './generators.js';
import { angleType, decimalOptions, decimalText, gcd } from './generators.phase3.js';
import { seededRng } from './random.js';

const rng = seededRng(3003);
const many = (skill: string, d: number, n = 200) => Array.from({ length: n }, () => generateQuestion(skill, d, rng));
const frac = (f: string) => {
  if (!f.includes('/')) return Number(f);
  const [n, d] = f.split('/').map(Number);
  return n / d;
};
const ratioValue = (r: string) => {
  const [a, b] = r.split(' : ').map(Number);
  return a / b;
};
const close = (a: number, b: number) => Math.abs(a - b) < 1e-9;

describe('phase 3 generators', () => {
  it('formats decimals without float noise', () => {
    expect(decimalText(347)).toBe('3.47');
    expect(decimalText(340)).toBe('3.4');
    expect(decimalText(300)).toBe('3');
    expect(decimalText(5)).toBe('0.05');
    for (let n = 1; n < 2000; n += 7) {
      const opts = decimalOptions(rng, n);
      expect(opts).toContain(decimalText(n));
      expect(new Set(opts).size).toBe(opts.length);
    }
  });

  it('decimal pictures and sums are exact', () => {
    for (const q of many('DEC_CONCEPT', 2)) {
      if (q.visual?.kind !== 'grid100') throw new Error('expected grid');
      expect(Math.round(Number(q.answer) * 100)).toBe(q.visual.shaded);
    }
    for (const d of [1, 2, 3, 4]) {
      for (const q of many('DEC_ADD_SUB', d)) {
        const [a, op, b] = q.expression!.replace(' = ?', '').split(' ');
        const expected = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
        expect(close(Number(q.answer), Math.round(expected * 100) / 100)).toBe(true);
      }
    }
  });

  it('decimal comparisons pick the larger value (even 0.5 vs 0.45)', () => {
    for (const d of [1, 2, 4]) {
      for (const q of many('DEC_COMPARE', d)) {
        expect(Number(q.answer)).toBe(Math.max(...q.options.map(Number)));
      }
    }
    for (const q of many('DEC_COMPARE', 5)) {
      const nums = q.answer.split(' < ').map(Number);
      expect([...nums].sort((a, b) => a - b)).toEqual(nums);
    }
  });

  it('fraction sums are right and only one option has that value', () => {
    for (const d of [1, 2, 3, 5]) {
      for (const q of many('FRAC_ADD_SUB', d)) {
        const [l, op, r] = q.expression!.replace(' = ?', '').split(' ');
        const expected = op === '+' ? frac(l) + frac(r) : frac(l) - frac(r);
        expect(close(frac(q.answer), expected)).toBe(true);
        expect(q.options.filter((o) => close(frac(o), expected))).toEqual([q.answer]);
      }
    }
    for (const q of many('FRAC_ADD_SUB', 4)) {
      const [n, d] = q.answer.split('/').map(Number);
      expect(gcd(n, d)).toBe(1);
      expect(close(frac(q.answer), frac(q.expression!))).toBe(true);
    }
  });

  it('percentages are whole numbers and consistent', () => {
    for (const q of many('PERCENT_CONCEPT', 1)) {
      if (q.visual?.kind !== 'grid100') throw new Error('expected grid');
      expect(q.answer).toBe(`${q.visual.shaded}%`);
    }
    for (const d of [1, 2, 3, 4, 5]) {
      for (const q of many('PERCENT_OF', d)) expect(Number.isInteger(Number(q.answer))).toBe(true);
      for (const q of many('PERCENT_CONCEPT', d)) expect(q.options).toContain(q.answer);
    }
    for (const q of many('PERCENT_OF', 2)) {
      const [p, , n] = q.expression!.replace(' = ?', '').split(' ');
      expect(Number(q.answer)).toBe((parseInt(p) * Number(n)) / 100);
    }
  });

  it('ratio questions have exactly one equivalent option', () => {
    for (const q of many('RATIO_CONCEPT', 2)) {
      const target = ratioValue(q.expression!);
      expect(q.options.filter((o) => close(ratioValue(o), target))).toEqual([q.answer]);
      const [a, b] = q.answer.split(' : ').map(Number);
      expect(gcd(a, b)).toBe(1);
    }
    for (const q of many('RATIO_CONCEPT', 5)) {
      const target = ratioValue(q.expression!);
      expect(q.options.filter((o) => close(ratioValue(o), target))).toEqual([q.answer]);
    }
    for (const q of many('RATIO_CONCEPT', 1)) {
      if (q.visual?.kind !== 'tally') throw new Error('expected tally');
      expect(q.answer).toBe(`${q.visual.items[0].count} : ${q.visual.items[1].count}`);
    }
  });

  it('geometry answers follow the formulas', () => {
    for (const q of many('GEO_PERIMETER_AREA', 1)) {
      if (q.visual?.kind !== 'rect') throw new Error('expected rect');
      expect(Number(q.answer)).toBe(2 * (q.visual.width + q.visual.height));
    }
    for (const q of many('GEO_PERIMETER_AREA', 2)) {
      if (q.visual?.kind !== 'rect') throw new Error('expected rect');
      expect(Number(q.answer)).toBe(q.visual.width * q.visual.height);
    }
    for (const q of many('GEO_ANGLES', 3)) {
      if (q.visual?.kind !== 'triangle') throw new Error('expected triangle');
      const [a, b] = q.visual.labels.map((l) => parseInt(l));
      expect(Number(q.answer)).toBe(180 - a - b);
    }
    for (const d of [1, 2, 4, 5]) for (const q of many('GEO_ANGLES', d)) expect(Number(q.answer)).toBeGreaterThan(0);
    expect([30, 90, 120, 180].map(angleType)).toEqual(['มุมแหลม', 'มุมฉาก', 'มุมป้าน', 'มุมตรง']);
  });

  it('equations are solved by the answer', () => {
    for (const d of [1, 2, 3, 4]) {
      for (const q of many('ALG_EQUATIONS', d)) {
        const x = Number(q.answer);
        const [lhs, rhs] = q.expression!.split(' = ');
        const expr = lhs.replace(/(\d)x/, '$1*x').replace(/[□x]/g, String(x)).replace('×', '*').replace('÷', '/').replace('−', '-');
        expect(Function(`return ${expr}`)()).toBe(Number(rhs));
      }
    }
  });

  it('pattern answers continue the sequence', () => {
    for (const q of many('ALG_PATTERNS', 1)) {
      const nums = q.expression!.replace(', ?', '').split(', ').map(Number);
      expect(Number(q.answer) - nums.at(-1)!).toBe(nums[1] - nums[0]);
    }
    for (const q of many('ALG_PATTERNS', 3)) {
      const nums = q.expression!.replace(', ?', '').split(', ').map(Number);
      expect(Number(q.answer) / nums.at(-1)!).toBe(nums[1] / nums[0]);
    }
  });

  it('multi-step problems have sensible positive answers', () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of many('PS_MULTI_STEP', d, 100)) {
        expect(Number(q.answer)).toBeGreaterThan(0);
        expect(q.prompt).toMatch(/\?$/);
      }
    }
  });
});
