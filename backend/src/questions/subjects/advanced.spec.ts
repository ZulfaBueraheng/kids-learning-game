import { generateQuestion } from '../generators.js';
import { timeText } from '../generators.measurement.js';
import { seededRng } from '../random.js';
import { numberWord } from './english-advanced.js';
import { permutations } from './logic-advanced.js';
import { CLASSIFIERS, FINAL_SOUNDS } from './reading-advanced.js';

const rng = seededRng(707);
const many = (skill: string, d: number, n = 150) => Array.from({ length: n }, () => generateQuestion(skill, d, rng));

describe('deeper subject generators', () => {
  it('new maths skills: one right answer among distinct options at every difficulty', () => {
    for (const skill of ['SHAPES_BASIC', 'TIME_CLOCK', 'MONEY_THAI', 'MEASURE_LENGTH', 'MEASURE_WEIGHT_VOLUME', 'DATA_GRAPH']) {
      for (let d = 1; d <= 5; d++) {
        for (const q of many(skill, d, 60)) {
          expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });

  it('Time: the answer is what the clock shows', () => {
    for (let d = 1; d <= 4; d++) {
      for (const q of many('TIME_CLOCK', d)) {
        if (q.visual?.kind !== 'clock') throw new Error('expected a clock');
        expect(q.answer).toBe(timeText(q.visual.hour, q.visual.minute));
        expect(q.visual.minute % [60, 30, 15, 5][d - 1]).toBe(0);
      }
    }
  });

  it('Money: the answer is the total of the coins and notes', () => {
    for (let d = 1; d <= 3; d++) {
      for (const q of many('MONEY_THAI', d)) {
        if (q.visual?.kind !== 'money') throw new Error('expected money');
        expect(Number(q.answer)).toBe(q.visual.items.reduce((n, x) => n + x.value * x.count, 0));
        for (const it of q.visual.items) expect([1, 2, 5, 10, 20, 50, 100, 500, 1000]).toContain(it.value);
      }
    }
    for (const q of many('MONEY_THAI', 4)) expect(Number(q.answer)).toBeGreaterThanOrEqual(0);
  });

  it('Pictographs: totals and differences match the chart', () => {
    for (const q of many('DATA_GRAPH', 4)) {
      if (q.visual?.kind !== 'tally') throw new Error('expected a chart');
      expect(Number(q.answer)).toBe(q.visual.items.reduce((n, x) => n + x.count, 0));
    }
    for (const q of many('DATA_GRAPH', 5)) {
      if (q.visual?.kind !== 'tally') throw new Error('expected a chart');
      expect(Number(q.answer)).toBe(2 * q.visual.items.reduce((n, x) => n + x.count, 0));
    }
  });

  it('English numbers: words match digits, including teens and tens', () => {
    expect(numberWord(13)).toBe('thirteen');
    expect(numberWord(30)).toBe('thirty');
    expect(numberWord(47)).toBe('forty-seven');
    for (const q of many('EN_NUMBERS', 2)) expect(numberWord(Number(q.answer))).toBe(q.expression);
    for (const q of many('EN_NUMBERS', 3)) expect(q.answer).toBe(numberWord(Number(q.expression)));
  });

  it('English sentences: wrong orders use the same words', () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of many('EN_SENTENCES', d)) {
        const words = q.answer.split(' ').sort().join(' ');
        for (const o of q.options) expect(o.split(' ').sort().join(' ')).toBe(words);
        expect(q.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('Thai final consonants: the answer is the word’s own มาตรา', () => {
    const matraOf = new Map(FINAL_SOUNDS.map((w) => [w.word, w.matra]));
    for (const d of [1, 4]) for (const q of many('TH_FINAL_SOUNDS', d)) expect(q.answer).toBe(matraOf.get(q.expression!));
    for (const q of many('TH_FINAL_SOUNDS', 3)) {
      const target = /คำว่า "(.+)"/.exec(q.prompt)![1];
      expect(matraOf.get(q.answer)).toBe(matraOf.get(target));
      for (const o of q.options.filter((x) => x !== q.answer)) expect(matraOf.get(o)).not.toBe(matraOf.get(target));
    }
  });

  it('Thai classifiers: no other acceptable classifier is offered as a wrong option', () => {
    for (let d = 1; d <= 5; d++) {
      for (const q of many('TH_CLASSIFIERS', d)) {
        const noun = /: (.+) \d ___/.exec(q.prompt)![1];
        const c = CLASSIFIERS.find((x) => x.noun === noun)!;
        expect(q.answer).toBe(c.cls);
        for (const o of q.options.filter((x) => x !== q.answer)) expect(c.alsoOk ?? []).not.toContain(o);
      }
    }
  });

  it('Logic directions: compass turns land on the right heading', () => {
    const compass = ['ทิศเหนือ', 'ทิศตะวันออก', 'ทิศใต้', 'ทิศตะวันตก'];
    for (const q of many('LOG_DIRECTIONS', 1)) {
      const m = /ยืนหันหน้าไปทาง(.+) แล้ว(หันขวา|หันซ้าย) ตอนนี้/.exec(q.prompt)!;
      const turn = m[2] === 'หันขวา' ? 1 : 3;
      expect(q.answer).toBe(compass[(compass.indexOf(m[1]) + turn) % 4]);
    }
    for (const d of [4, 5]) for (const q of many('LOG_DIRECTIONS', d)) expect(q.options).toContain(q.answer);
  });

  it('Logic coding: running the program gives the answer', () => {
    for (const d of [1, 2, 3]) {
      for (const q of many('LOG_CODING', d)) {
        if (q.visual?.kind !== 'passage') throw new Error('expected a program');
        const [start, ...steps] = q.visual.text.split('\n');
        let n = Number(start.split(': ')[1]);
        for (const s of steps) {
          const [, op, k] = /: (บวก|ลบ|คูณ) (\d+)/.exec(s)!;
          n = op === 'บวก' ? n + Number(k) : op === 'ลบ' ? n - Number(k) : n * Number(k);
        }
        expect(q.answer).toBe(String(n));
      }
    }
  });

  it('Logic grid puzzles: the clues allow exactly one answer, and it is the given one', () => {
    for (const d of [2, 4, 5]) {
      for (const q of many('LOG_GRID_LOGIC', d, 80)) {
        if (q.visual?.kind !== 'passage') throw new Error('expected clues');
        const kids = q.options;
        const pets = [...q.prompt.matchAll(/\S+ (แมว|สุนัข|ปลา|กระต่าย)/g)].map((m) => m[1]);
        const ask = /ใครเลี้ยง(.+)\?/.exec(q.prompt)![1];
        const clues = q.visual.text.split('\n').map((l) => l.replace(/^เบาะแส \d+: /, ''));
        const fits = permutations(pets).filter((perm) =>
          clues.every((c) => {
            const neg = /^(.+)ไม่ได้เลี้ยง(.+)$/.exec(c);
            const pos = /^(.+)เลี้ยง(.+)$/.exec(c);
            const [, kid, pet] = (neg ?? pos)!;
            const owns = perm[kids.indexOf(kid)] === pet;
            return neg ? !owns : owns;
          }),
        );
        const owners = new Set(fits.map((perm) => kids[perm.indexOf(ask)]));
        expect(owners).toEqual(new Set([q.answer]));
      }
    }
  });
});
