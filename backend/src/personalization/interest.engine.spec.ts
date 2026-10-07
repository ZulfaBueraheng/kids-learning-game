import { seededRng } from '../questions/random.js';
import { generateQuestion } from '../questions/generators.js';
import { THEME_PACKS } from '../questions/themes.js';
import { fromPicks, interestProfile, pickTheme, recordSignal, sanitizeInterests, topInterest } from './interest.engine.js';

describe('interest engine', () => {
  it('starts from explicit picks', () => {
    const i = fromPicks(['SPACE', 'DINOSAUR', 'NOT_A_THEME', 'GENERAL']);
    expect(i).toEqual({ SPACE: 5, DINOSAUR: 5 });
  });

  it('keeps learned scores when the child re-picks, drops unpicked themes', () => {
    expect(fromPicks(['SPACE'], { SPACE: 12, RACING: 4 })).toEqual({ SPACE: 12 });
  });

  it('learns from enjoyed sessions and caps scores', () => {
    let i = fromPicks(['ANIMALS']);
    for (let k = 0; k < 40; k++) i = recordSignal(i, 'ANIMALS');
    expect(i.ANIMALS).toBe(20);
    expect(recordSignal(i, 'GENERAL')).toBe(i);
  });

  it('lets a new interest overtake an old one over time', () => {
    let i = { DINOSAUR: 20, SPACE: 20, ANIMALS: 20 } as const as Record<string, number>;
    for (let k = 0; k < 30; k++) i = recordSignal(i, 'RACING');
    expect(topInterest(i)).toBe('RACING');
  });

  it('picks themes in proportion to interest, with some variety', () => {
    const rng = seededRng(9);
    const counts: Record<string, number> = {};
    for (let k = 0; k < 2000; k++) {
      const t = pickTheme({ SPACE: 9 }, rng);
      counts[t] = (counts[t] ?? 0) + 1;
    }
    expect(counts.SPACE).toBeGreaterThan(1600);
    expect(counts.GENERAL).toBeGreaterThan(100);
    expect(pickTheme({}, rng)).toBe('GENERAL');
  });

  it('sanitizes stored JSON', () => {
    expect(sanitizeInterests({ SPACE: 3, HACK: 9, RACING: -1, FANTASY: 'x', ANIMALS: 99 })).toEqual({ SPACE: 3, ANIMALS: 20 });
    expect(sanitizeInterests(null)).toEqual({});
  });

  it('builds a dashboard profile', () => {
    expect(interestProfile({ SPACE: 4, DINOSAUR: 8 })).toEqual([
      { theme: 'DINOSAUR', score: 8, level: 1 },
      { theme: 'SPACE', score: 4, level: 0.5 },
    ]);
  });

  it('the same skill is presented in the child\'s theme', () => {
    const rng = seededRng(1);
    const dino = new Set(THEME_PACKS.DINOSAUR.things.map((t) => t.emoji));
    for (let k = 0; k < 50; k++) {
      const q = generateQuestion('COUNTING', 2, rng, { theme: 'DINOSAUR' });
      if (q.visual?.kind !== 'objects') throw new Error('expected objects');
      expect(dino.has(q.visual.emoji)).toBe(true);
    }
    const space = generateQuestion('WORD_ADD_SUB', 1, rng, { theme: 'SPACE' });
    expect(THEME_PACKS.SPACE.goods.some((g) => space.prompt.includes(g.name))).toBe(true);
  });
});
