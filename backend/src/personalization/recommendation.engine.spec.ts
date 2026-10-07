import { recommend, type RecInput, type RecLevel, type RecSkill } from './recommendation.engine.js';

const NOW = new Date('2026-05-10T10:00:00Z');
const DAY = 24 * 60 * 60 * 1000;

function level(id: string, skillCode: string, extra: Partial<RecLevel> = {}): RecLevel {
  return {
    id,
    name: `ด่าน ${id}`,
    worldNameTh: 'โลกทดสอบ',
    worldEmoji: '🌍',
    skillCode,
    skillNameTh: skillCode,
    isBoss: false,
    bossEmoji: null,
    unlocked: true,
    stars: 0,
    difficulty: 2,
    activity: 'TARGET',
    ...extra,
  };
}

function skill(code: string, extra: Partial<RecSkill> = {}): [string, RecSkill] {
  return [code, { code, nameTh: code, mastery: 0, status: 'NOT_STARTED', attempts: 0, lastPracticedAt: null, reviewCount: 0, ...extra }];
}

const base: RecInput = {
  levels: [
    level('add1', 'ADD', { difficulty: 1 }),
    level('add2', 'ADD', { difficulty: 3 }),
    level('sub1', 'SUB', { activity: 'RACING' }),
    level('cnt1', 'COUNT'),
    level('boss', 'ADD', { isBoss: true, bossEmoji: '🐲', name: 'มังกร' }),
  ],
  current: 'ADD',
  reviews: [],
  skills: new Map([
    skill('COUNT', { mastery: 0.9, status: 'MASTERED', lastPracticedAt: new Date(NOW.getTime() - DAY), reviewCount: 1 }),
    skill('ADD', { mastery: 0.3, status: 'LEARNING', attempts: 5 }),
    skill('SUB', { mastery: 0.65, status: 'PRACTICING', attempts: 8 }),
  ]),
  recentLevelIds: [],
  topInterest: null,
  now: NOW,
};

describe('recommendation engine', () => {
  it('puts the next path skill first, then the boss, then weak skills', () => {
    const recs = recommend(base);
    expect(recs.map((r) => r.kind)).toEqual(['LEARN', 'BOSS', 'PRACTICE']);
    expect(recs[0].skillCodes).toEqual(['ADD']);
    expect(recs[2].skillCodes).toEqual(['SUB']);
  });

  it('picks the stage whose difficulty fits the child', () => {
    expect(recommend(base)[0].levelId).toBe('add1'); // mastery 0.3 → difficulty ~2, closer to 1 than 3
    const strong = { ...base, skills: new Map([...base.skills, skill('ADD', { mastery: 0.75, status: 'PRACTICING', attempts: 9 })]) };
    expect(recommend(strong)[0].levelId).toBe('add2');
  });

  it('reviews come first when due, ordered by what is fading most', () => {
    const recs = recommend({ ...base, reviews: ['COUNT'] });
    expect(recs[0]).toMatchObject({ kind: 'REVIEW', levelId: null, skillCodes: ['COUNT'] });
  });

  it('suggests reviewing a mastered skill that is fading even before its review date', () => {
    const old = new Map([...base.skills, skill('COUNT', { mastery: 0.9, status: 'MASTERED', lastPracticedAt: new Date(NOW.getTime() - 20 * DAY), reviewCount: 0 })]);
    expect(recommend({ ...base, skills: old })[0].kind).toBe('REVIEW');
  });

  it('avoids repeating the stage just played', () => {
    const recs = recommend({ ...base, recentLevelIds: ['add1'] });
    expect(recs.find((r) => r.kind === 'LEARN')!.levelId).toBe('add2');
  });

  it("boosts activities that match the child's interests", () => {
    const withInterest = recommend({ ...base, topInterest: 'RACING' });
    const without = recommend(base);
    const score = (rs: typeof without) => rs.find((r) => r.kind === 'PRACTICE')!.score;
    expect(score(withInterest)).toBe(score(without) + 4);
  });

  it('skips defeated bosses and locked stages', () => {
    const levels = base.levels.map((l) => (l.isBoss ? { ...l, stars: 2 } : l.id === 'sub1' ? { ...l, unlocked: false } : l));
    const recs = recommend({ ...base, levels });
    expect(recs.map((r) => r.kind)).toEqual(['LEARN']);
  });

  it('returns nothing useful for a brand-new child (placement comes first)', () => {
    expect(recommend({ ...base, current: null, skills: new Map(), levels: base.levels.filter((l) => !l.isBoss) })).toEqual([]);
  });
});
