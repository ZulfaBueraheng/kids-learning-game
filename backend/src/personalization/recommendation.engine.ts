import { memoryStrength, recommendedDifficulty, type SkillStatus } from '../mastery/mastery.engine.js';
import type { Theme } from '../questions/themes.js';

/**
 * "Today's quests": a few activities picked for this child right now.
 *
 * Priority: spaced review that is due (before it is forgotten) → the next
 * skill on the learning path → a boss that is ready → skills that still need
 * practice. Stages the child just played are pushed down for variety, and
 * activities matching the child's interests get a small boost.
 */

export interface RecLevel {
  id: string;
  name: string;
  worldNameTh: string;
  worldEmoji: string;
  skillCode: string;
  skillNameTh: string;
  isBoss: boolean;
  bossEmoji: string | null;
  unlocked: boolean;
  stars: number;
  difficulty: number;
  activity: string;
}

export interface RecSkill {
  code: string;
  nameTh: string;
  mastery: number;
  status: SkillStatus;
  attempts: number;
  lastPracticedAt: Date | null;
  reviewCount: number;
}

/** ASSIGNMENT recommendations are added by the games service from teacher homework. */
export type RecKind = 'ASSIGNMENT' | 'REVIEW' | 'LEARN' | 'BOSS' | 'PRACTICE';

export interface Recommendation {
  kind: RecKind;
  /** null for a review session, which mixes several skills */
  levelId: string | null;
  skillCodes: string[];
  title: string;
  reason: string;
  emoji: string;
  score: number;
}

export interface RecInput {
  levels: RecLevel[];
  current: string | null;
  reviews: string[];
  skills: Map<string, RecSkill>;
  /** Thai names of every skill, including ones the child has not started yet */
  names?: Map<string, string>;
  /** level ids of the latest sessions, most recent first */
  recentLevelIds: string[];
  topInterest: Theme | null;
  now?: Date;
}

/** Activities that fit each interest, for a small personal boost. */
const INTEREST_ACTIVITY: Partial<Record<Theme, string[]>> = {
  RACING: ['RACING'],
  FANTASY: ['MAGIC'],
  ANIMALS: ['FISHING'],
  SPACE: ['TARGET'],
  DINOSAUR: ['BUILDING', 'PUZZLE'],
  BLOCKS: ['MINING', 'BUILDING'],
};

export const MAX_REVIEW_SKILLS = 3;
/** Mastered skills this weak in memory are worth reviewing even before their review date. */
const FADING = 0.35;

export function recommend(input: RecInput, limit = 3): Recommendation[] {
  const now = input.now ?? new Date();
  const recs: Recommendation[] = [];
  const recent = new Set(input.recentLevelIds.slice(0, 2));
  const liked = new Set(input.topInterest ? (INTEREST_ACTIVITY[input.topInterest] ?? []) : []);
  const skill = (code: string) => input.skills.get(code);
  const nameOf = (code: string) => skill(code)?.nameTh ?? input.names?.get(code) ?? code;

  const stageScore = (level: RecLevel, base: number) =>
    base + (liked.has(level.activity) ? 4 : 0) - (recent.has(level.id) ? 20 : 0);

  /** The best stage to practise a skill: not yet 3 stars, difficulty near the child's level, not just played. */
  const bestStage = (code: string): RecLevel | null => {
    const target = recommendedDifficulty(skill(code)?.mastery ?? 0);
    const options = input.levels.filter((l) => !l.isBoss && l.unlocked && l.skillCode === code);
    if (!options.length) return null;
    return [...options].sort((a, b) => cost(a) - cost(b))[0];
    function cost(l: RecLevel) {
      return Math.abs(l.difficulty - target) + (l.stars >= 3 ? 2 : 0) + (recent.has(l.id) ? 3 : 0);
    }
  };

  // 1. Spaced review: due skills plus mastered skills that are fading fast.
  const fading = [...input.skills.values()]
    .filter((s) => s.status === 'MASTERED' && memoryStrength(s.lastPracticedAt, s.reviewCount, now) < FADING)
    .map((s) => s.code);
  const reviewCodes = [...new Set([...input.reviews, ...fading])]
    .sort(
      (a, b) =>
        memoryStrength(skill(a)?.lastPracticedAt ?? null, skill(a)?.reviewCount ?? 0, now) -
        memoryStrength(skill(b)?.lastPracticedAt ?? null, skill(b)?.reviewCount ?? 0, now),
    )
    .slice(0, MAX_REVIEW_SKILLS);
  if (reviewCodes.length) {
    const weakest = memoryStrength(skill(reviewCodes[0])?.lastPracticedAt ?? null, skill(reviewCodes[0])?.reviewCount ?? 0, now);
    recs.push({
      kind: 'REVIEW',
      levelId: null,
      skillCodes: reviewCodes,
      title: 'ทบทวนความจำ',
      reason: `ถึงเวลาทบทวน ${reviewCodes.map(nameOf).join(', ')} ก่อนจะลืม`,
      emoji: '🔁',
      score: 100 + (1 - weakest) * 10,
    });
  }

  // 2. Next skill on the learning path.
  const used = new Set<string>(reviewCodes);
  if (input.current) {
    const stage = bestStage(input.current);
    if (stage) {
      recs.push({
        kind: 'LEARN',
        levelId: stage.id,
        skillCodes: [input.current],
        title: stage.name,
        reason: `ทักษะถัดไปในเส้นทางของหนู: ${nameOf(input.current)}`,
        emoji: stage.worldEmoji,
        score: stageScore(stage, 90),
      });
      used.add(input.current);
    }
  }

  // 3. A boss that is awake and not yet defeated — the one whose skills the child knows best.
  const bosses = input.levels.filter((l) => l.isBoss && l.unlocked && l.stars === 0);
  if (bosses.length) {
    const boss = bosses[0];
    recs.push({
      kind: 'BOSS',
      levelId: boss.id,
      skillCodes: [],
      title: `บอส: ${boss.name}`,
      reason: `${boss.bossEmoji ?? '👾'} บอสแห่ง${boss.worldNameTh}ตื่นแล้ว! พร้อมท้าสู้หรือยัง`,
      emoji: boss.bossEmoji ?? '👾',
      score: stageScore(boss, 80),
    });
  }

  // 4. Skills the child has started but not yet mastered, weakest first.
  const practising = [...input.skills.values()]
    .filter((s) => (s.status === 'LEARNING' || s.status === 'PRACTICING') && (s.attempts > 0 || s.mastery > 0) && !used.has(s.code))
    .sort((a, b) => a.mastery - b.mastery);
  for (const s of practising) {
    const stage = bestStage(s.code);
    if (!stage) continue;
    recs.push({
      kind: 'PRACTICE',
      levelId: stage.id,
      skillCodes: [s.code],
      title: stage.name,
      reason: `ฝึก${s.nameTh}อีกนิด จะเก่งขึ้นอีก (${Math.round(s.mastery * 100)}%)`,
      emoji: stage.worldEmoji,
      score: stageScore(stage, 60 + (1 - s.mastery) * 15),
    });
  }

  return recs.sort((a, b) => b.score - a.score).slice(0, limit);
}
