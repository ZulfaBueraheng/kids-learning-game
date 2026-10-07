import { computeMastery, memoryStrength, nextReviewAt, recommendedDifficulty, statusFor, type AttemptSample } from './mastery.engine.js';

const DAY = 24 * 60 * 60 * 1000;
const start = new Date('2026-01-05T09:00:00Z');

function attempts(n: number, opts: Partial<AttemptSample> & { correctEvery?: number; dayOffset?: number } = {}): AttemptSample[] {
  return Array.from({ length: n }, (_, i) => ({
    isCorrect: opts.correctEvery ? i % opts.correctEvery !== 0 : (opts.isCorrect ?? true),
    difficulty: opts.difficulty ?? 3,
    timeMs: opts.timeMs ?? 5000,
    hintUsed: opts.hintUsed ?? false,
    createdAt: new Date(start.getTime() + (opts.dayOffset ?? 0) * DAY + i * 1000),
  }));
}

describe('mastery engine', () => {
  it('returns the prior when there is no data', () => {
    expect(computeMastery([], 0.8).mastery).toBe(0.8);
    expect(computeMastery([]).mastery).toBe(0);
  });

  it('rewards accurate, fast, hard, retained practice', () => {
    const data = [...attempts(10, { difficulty: 5 }), ...attempts(10, { difficulty: 5, dayOffset: 3 })];
    const m = computeMastery(data);
    expect(m.accuracy).toBe(1);
    expect(m.retention).toBe(1);
    expect(m.mastery).toBeGreaterThanOrEqual(0.95);
    expect(statusFor(m.mastery, data.length)).toBe('MASTERED');
  });

  it('is not just accuracy: easy items and hints lower mastery', () => {
    const hard = computeMastery(attempts(15, { difficulty: 5 }));
    const easyWithHints = computeMastery(attempts(15, { difficulty: 1, hintUsed: true }));
    expect(easyWithHints.accuracy).toBe(hard.accuracy);
    expect(easyWithHints.mastery).toBeLessThan(hard.mastery - 0.15);
  });

  it('gives only partial retention credit until the child returns another day', () => {
    const sameDay = computeMastery(attempts(20));
    const nextDay = computeMastery([...attempts(10), ...attempts(10, { dayOffset: 1 })]);
    expect(sameDay.retention).toBeLessThan(nextDay.retention);
  });

  it('blends the placement prior until enough evidence exists', () => {
    const few = computeMastery(attempts(3, { isCorrect: false }), 0.9);
    expect(few.confidence).toBe(0.2);
    expect(few.mastery).toBeGreaterThan(0.6);
    const many = computeMastery(attempts(20, { isCorrect: false }), 0.9);
    expect(many.mastery).toBeLessThan(0.1);
  });

  it('never lowers the placement estimate after (almost) all-correct practice', () => {
    const easyButRight = computeMastery(attempts(5, { difficulty: 1, timeMs: 15_000 }), 0.85);
    expect(easyButRight.mastery).toBeGreaterThanOrEqual(0.85);
    const withMistakes = computeMastery(attempts(6, { correctEvery: 2 }), 0.85);
    expect(withMistakes.mastery).toBeLessThan(0.85);
  });

  it('maps mastery to status', () => {
    expect(statusFor(0, 0)).toBe('NOT_STARTED');
    expect(statusFor(0.2, 3)).toBe('LEARNING');
    expect(statusFor(0.7, 3)).toBe('PRACTICING');
    expect(statusFor(0.9, 3)).toBe('MASTERED');
  });

  it('schedules spaced reviews further apart', () => {
    expect(nextReviewAt(start, 0).getTime() - start.getTime()).toBe(1 * DAY);
    expect(nextReviewAt(start, 2).getTime() - start.getTime()).toBe(7 * DAY);
    expect(nextReviewAt(start, 99).getTime() - start.getTime()).toBe(30 * DAY);
  });

  it('models forgetting: memory fades, and fades slower after each review', () => {
    expect(memoryStrength(start, 0, start)).toBe(1);
    expect(memoryStrength(start, 0, new Date(start.getTime() + 3 * DAY))).toBe(0.5);
    expect(memoryStrength(start, 2, new Date(start.getTime() + 3 * DAY))).toBeGreaterThan(0.8);
    expect(memoryStrength(null, 0)).toBe(0);
  });

  it('recommends difficulty from mastery', () => {
    expect(recommendedDifficulty(0)).toBe(1);
    expect(recommendedDifficulty(0.5)).toBe(3);
    expect(recommendedDifficulty(1)).toBe(5);
  });
});
