import { GENERATORS, generateQuestion, numericOptions, thaiNumberWord, toThaiDigits } from './generators.js';
import { seededRng } from './random.js';

describe('question generators', () => {
  it('reads Thai number words', () => {
    expect(thaiNumberWord(5)).toBe('ห้า');
    expect(thaiNumberWord(11)).toBe('สิบเอ็ด');
    expect(thaiNumberWord(20)).toBe('ยี่สิบ');
    expect(thaiNumberWord(21)).toBe('ยี่สิบเอ็ด');
    expect(thaiNumberWord(37)).toBe('สามสิบเจ็ด');
    expect(toThaiDigits(17)).toBe('๑๗');
  });

  it('builds 4 unique numeric options that include the answer', () => {
    const rng = seededRng(1);
    for (let answer = 0; answer < 100; answer++) {
      const options = numericOptions(rng, answer);
      expect(options).toHaveLength(4);
      expect(new Set(options).size).toBe(4);
      expect(options).toContain(String(answer));
      expect(options.every((o) => Number(o) >= 0)).toBe(true);
    }
  });

  it.each(Object.keys(GENERATORS))('%s produces valid questions at every difficulty', (skill) => {
    const rng = seededRng(42);
    for (let d = 1; d <= 5; d++) {
      for (let i = 0; i < 200; i++) {
        const q = generateQuestion(skill, d, rng);
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(q.options.length);
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        expect(q.prompt.length).toBeGreaterThan(0);
      }
    }
  });

  it('computes correct arithmetic answers', () => {
    const rng = seededRng(7);
    for (let i = 0; i < 300; i++) {
      for (const skill of ['ADD_SINGLE', 'ADD_DOUBLE', 'ADD_CARRY', 'SUB_SINGLE', 'SUB_DOUBLE', 'SUB_BORROW']) {
        const q = generateQuestion(skill, (i % 4) + 1, rng);
        const [a, op, b] = q.expression!.split(' ');
        const expected = op === '+' ? Number(a) + Number(b) : Number(a) - Number(b);
        expect(Number(q.answer)).toBe(expected);
        expect(expected).toBeGreaterThanOrEqual(0);
        expect(expected).toBeLessThan(100);
      }
    }
  });

  it('carry / borrow skills always require regrouping', () => {
    const rng = seededRng(3);
    for (let i = 0; i < 200; i++) {
      const add = generateQuestion('ADD_CARRY', 2, rng).expression!.split(' ');
      expect((Number(add[0]) % 10) + (Number(add[2]) % 10)).toBeGreaterThanOrEqual(10);
      const addNo = generateQuestion('ADD_DOUBLE', 3, rng).expression!.split(' ');
      expect((Number(addNo[0]) % 10) + (Number(addNo[2]) % 10)).toBeLessThan(10);
      const sub = generateQuestion('SUB_BORROW', 2, rng).expression!.split(' ');
      expect(Number(sub[0]) % 10).toBeLessThan(Number(sub[2]) % 10);
    }
  });

  it('rejects unknown skills', () => {
    expect(() => generateQuestion('NOPE', 1)).toThrow();
  });
});
