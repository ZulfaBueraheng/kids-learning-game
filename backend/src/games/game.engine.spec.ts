import {
  adaptDifficulty,
  BOSS_MAX_QUESTIONS,
  bossSkillFor,
  bossStars,
  bossState,
  frustrationGuard,
  isFastAnswer,
  startDifficulty,
  unlockedLevels,
  weakestSkill,
  type LevelNode,
} from './game.engine.js';

const LEVELS: LevelNode[] = [
  { id: 'l1', skillCode: 'ADD', sortOrder: 1 },
  { id: 'l2', skillCode: 'ADD', sortOrder: 2 },
  { id: 'l3', skillCode: 'ADD2', sortOrder: 3 },
];
const PREREQS = new Map([
  ['ADD', ['COUNT']],
  ['ADD2', ['ADD']],
]);

describe('game engine', () => {
  it('locks everything until prerequisites are ready', () => {
    expect(unlockedLevels(LEVELS, PREREQS, new Map(), new Map()).size).toBe(0);
  });

  it('opens the first stage of a ready skill, then the next once cleared', () => {
    const mastery = new Map([['COUNT', 0.7]]);
    expect([...unlockedLevels(LEVELS, PREREQS, mastery, new Map())]).toEqual(['l1']);
    expect([...unlockedLevels(LEVELS, PREREQS, mastery, new Map([['l1', 1]]))]).toEqual(['l1', 'l2']);
  });

  it('opens every stage of a skill the child already knows', () => {
    const mastery = new Map([
      ['COUNT', 0.9],
      ['ADD', 0.8],
    ]);
    expect([...unlockedLevels(LEVELS, PREREQS, mastery, new Map())]).toEqual(['l1', 'l2', 'l3']);
  });

  it('raises difficulty after two correct answers and lowers it after a mistake', () => {
    let s = { difficulty: 2, streak: 0 };
    s = adaptDifficulty(s.difficulty, s.streak, true, 2);
    expect(s).toEqual({ difficulty: 2, streak: 1 });
    s = adaptDifficulty(s.difficulty, s.streak, true, 2);
    expect(s).toEqual({ difficulty: 3, streak: 0 });
    s = adaptDifficulty(s.difficulty, 1, true, 2);
    expect(s.difficulty).toBe(3); // capped at base + 1
    s = adaptDifficulty(s.difficulty, s.streak, false, 2);
    expect(s).toEqual({ difficulty: 2, streak: 0 });
    s = adaptDifficulty(1, 0, false, 2);
    expect(s.difficulty).toBe(1);
  });

  describe('boss battle', () => {
    const WORLD: LevelNode[] = [...LEVELS, { id: 'boss', skillCode: 'ADD2', sortOrder: 9, isBoss: true }];
    const ready = new Map([['COUNT', 0.9]]);

    it('wakes up only after every stage in the world is cleared', () => {
      const someCleared = new Map([['l1', 3], ['l2', 1]]);
      expect(unlockedLevels(WORLD, PREREQS, ready, someCleared).has('boss')).toBe(false);
      const allCleared = new Map([['l1', 3], ['l2', 1], ['l3', 2]]);
      expect(unlockedLevels(WORLD, PREREQS, ready, allCleared).has('boss')).toBe(true);
    });

    it('also wakes up when the child already knows every skill in the world', () => {
      const known = new Map([['COUNT', 0.9], ['ADD', 0.9], ['ADD2', 0.65]]);
      expect(unlockedLevels(WORLD, PREREQS, known, new Map()).has('boss')).toBe(true);
      const notYet = new Map([['COUNT', 0.9], ['ADD', 0.9], ['ADD2', 0.5]]);
      expect(unlockedLevels(WORLD, PREREQS, notYet, new Map()).has('boss')).toBe(false);
    });

    it('is defeated by 5 hits before the child runs out of 3 shields', () => {
      expect(bossState(0, 0)).toMatchObject({ hp: 5, shields: 3, done: false });
      expect(bossState(5, 5)).toMatchObject({ hp: 0, done: true, won: true });
      expect(bossState(7, 5)).toMatchObject({ hp: 0, shields: 1, won: true });
      expect(bossState(5, 2)).toMatchObject({ hp: 3, shields: 0, done: true, won: false });
      expect(BOSS_MAX_QUESTIONS).toBe(7);
    });

    it('awards stars by mistakes on a win, none on a loss', () => {
      expect(bossStars(bossState(5, 5))).toBe(3);
      expect(bossStars(bossState(6, 5))).toBe(2);
      expect(bossStars(bossState(7, 5))).toBe(1);
      expect(bossStars(bossState(5, 2))).toBe(0);
    });

    it('rotates through the world skills', () => {
      expect([0, 1, 2, 3].map((i) => bossSkillFor(['A', 'B', 'C'], i))).toEqual(['A', 'B', 'C', 'A']);
    });

    it('finds the weakest skill to practise after a loss', () => {
      expect(
        weakestSkill([
          { skillCode: 'A', isCorrect: true },
          { skillCode: 'B', isCorrect: false },
          { skillCode: 'A', isCorrect: false },
          { skillCode: 'B', isCorrect: false },
          { skillCode: 'C', isCorrect: true },
        ]),
      ).toBe('B');
      expect(weakestSkill([{ skillCode: 'A', isCorrect: true }])).toBeNull();
    });
  });

  describe('personalised difficulty', () => {
    it('starts near the child’s mastery, within one step of the stage', () => {
      expect(startDifficulty(3, null)).toBe(3);
      expect(startDifficulty(3, 0.95)).toBe(4); // strong child starts harder
      expect(startDifficulty(3, 0.1)).toBe(2); // struggling child starts easier
      expect(startDifficulty(1, 0.1)).toBe(1);
    });

    it('a fast confident answer raises difficulty straight away', () => {
      expect(adaptDifficulty(2, 0, true, 2, { fast: true })).toEqual({ difficulty: 3, streak: 0 });
      expect(adaptDifficulty(2, 0, true, 2)).toEqual({ difficulty: 2, streak: 1 });
      expect(isFastAnswer(2500, false)).toBe(true);
      expect(isFastAnswer(2500, true)).toBe(false);
      expect(isFastAnswer(9000, false)).toBe(false);
    });

    it('eases off and offers help after two mistakes in a row', () => {
      let g = frustrationGuard(0, false, 3, 3);
      expect(g).toEqual({ wrongStreak: 1, difficulty: 3, support: false });
      g = frustrationGuard(g.wrongStreak, false, 3, 3);
      expect(g).toEqual({ wrongStreak: 2, difficulty: 2, support: true });
      expect(frustrationGuard(g.wrongStreak, true, 3, 2)).toEqual({ wrongStreak: 0, difficulty: 2, support: false });
    });
  });
});
