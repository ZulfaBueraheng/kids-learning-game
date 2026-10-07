import { PRACTICING_AT, recommendedDifficulty } from '../mastery/mastery.engine.js';

export interface LevelNode {
  id: string;
  skillCode: string;
  sortOrder: number;
  isBoss?: boolean;
}

/**
 * A stage is open when the child is ready for its skill (prerequisites at
 * least "practicing", or placement showed they already know it) and they have
 * cleared the previous stage of the same skill in that world.
 * The boss wakes up once every other stage in the world is cleared, or when the
 * child is already at least "practicing" every skill the world teaches (e.g.
 * from placement) so a strong child can challenge it without grinding.
 */
export function unlockedLevels(
  worldLevels: LevelNode[],
  prerequisites: Map<string, string[]>,
  mastery: Map<string, number>,
  bestStars: Map<string, number>,
): Set<string> {
  const m = (code: string) => mastery.get(code) ?? 0;
  const unlocked = new Set<string>();
  const lastOfSkill = new Map<string, LevelNode>();
  const stages = worldLevels.filter((l) => !l.isBoss);
  for (const level of [...worldLevels].sort((a, b) => a.sortOrder - b.sortOrder)) {
    if (level.isBoss) {
      const cleared = stages.every((l) => (bestStars.get(l.id) ?? 0) >= 1);
      const skilled = stages.every((l) => m(l.skillCode) >= PRACTICING_AT);
      if (stages.length && (cleared || skilled)) unlocked.add(level.id);
      continue;
    }
    const knowsSkill = m(level.skillCode) >= PRACTICING_AT;
    const ready = knowsSkill || (prerequisites.get(level.skillCode) ?? []).every((p) => m(p) >= PRACTICING_AT);
    const prev = lastOfSkill.get(level.skillCode);
    const prevCleared = !prev || (bestStars.get(prev.id) ?? 0) >= 1;
    if (ready && (prevCleared || knowsSkill)) unlocked.add(level.id);
    lastOfSkill.set(level.skillCode, level);
  }
  return unlocked;
}

/**
 * Adaptive difficulty inside a stage: two correct in a row → harder,
 * a mistake → easier, staying within one step of the stage's base difficulty.
 */
export function adaptDifficulty(
  current: number,
  streak: number,
  isCorrect: boolean,
  base: number,
  opts: { fast?: boolean } = {},
): { difficulty: number; streak: number } {
  const min = Math.max(1, base - 1);
  const max = Math.min(5, base + 1);
  if (!isCorrect) return { difficulty: Math.max(min, current - 1), streak: 0 };
  // A quick, confident answer (no hint) counts as two in a row.
  const gained = opts.fast ? 2 : 1;
  if (streak + gained >= 2 && current < max) return { difficulty: current + 1, streak: 0 };
  return { difficulty: current, streak: Math.min(streak + gained, 1) };
}

/** Answers this fast without a hint show the question was comfortable. */
export const FAST_ANSWER_MS = 4000;

export function isFastAnswer(timeMs: number, hintUsed: boolean): boolean {
  return !hintUsed && timeMs > 0 && timeMs < FAST_ANSWER_MS;
}

/** Where a stage starts: near the child's mastery, within one step of the stage's design. */
export function startDifficulty(base: number, mastery: number | null): number {
  if (mastery == null || mastery <= 0) return base;
  return Math.min(Math.max(recommendedDifficulty(mastery), Math.max(1, base - 1)), Math.min(5, base + 1));
}

/** After this many mistakes in a row the game eases off and offers the hint straight away. */
export const EASE_AFTER_WRONG = 2;

export function frustrationGuard(
  wrongStreak: number,
  isCorrect: boolean,
  base: number,
  difficulty: number,
): { wrongStreak: number; difficulty: number; support: boolean } {
  const next = isCorrect ? 0 : wrongStreak + 1;
  if (next >= EASE_AFTER_WRONG) return { wrongStreak: next, difficulty: Math.max(1, base - 1), support: true };
  return { wrongStreak: next, difficulty, support: false };
}

// ───────────── Boss battle ─────────────

export const BOSS_HP = 5;
export const BOSS_SHIELDS = 3;
export const BOSS_MAX_QUESTIONS = BOSS_HP + BOSS_SHIELDS - 1;

export interface BossState {
  hp: number;
  maxHp: number;
  shields: number;
  maxShields: number;
  done: boolean;
  won: boolean;
}

/** Each correct answer hits the boss; each mistake costs the child one shield. */
export function bossState(answered: number, correct: number): BossState {
  const hp = Math.max(0, BOSS_HP - correct);
  const shields = Math.max(0, BOSS_SHIELDS - (answered - correct));
  return { hp, maxHp: BOSS_HP, shields, maxShields: BOSS_SHIELDS, done: hp === 0 || shields === 0, won: hp === 0 };
}

export function bossStars(state: BossState): number {
  if (!state.won) return 0;
  const mistakes = BOSS_SHIELDS - state.shields;
  return mistakes === 0 ? 3 : mistakes === 1 ? 2 : 1;
}

/** Round-robin through the world's skills so the boss tests all of them. */
export function bossSkillFor(skills: string[], answered: number): string {
  return skills[answered % skills.length];
}

/** The skill the child struggled with most in a session (lowest accuracy, then most mistakes). */
export function weakestSkill(attempts: { skillCode: string; isCorrect: boolean }[]): string | null {
  const stats = new Map<string, { n: number; correct: number }>();
  for (const a of attempts) {
    const s = stats.get(a.skillCode) ?? { n: 0, correct: 0 };
    s.n += 1;
    if (a.isCorrect) s.correct += 1;
    stats.set(a.skillCode, s);
  }
  let worst: { code: string; acc: number; wrong: number } | null = null;
  for (const [code, s] of stats) {
    const acc = s.correct / s.n;
    const wrong = s.n - s.correct;
    if (wrong === 0) continue;
    if (!worst || acc < worst.acc || (acc === worst.acc && wrong > worst.wrong)) worst = { code, acc, wrong };
  }
  return worst?.code ?? null;
}
