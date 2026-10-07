/**
 * Mastery is not just "% correct". It blends accuracy, difficulty reached,
 * consistency, speed, hint usage and retention (success on later days).
 */

export type SkillStatus = 'NOT_STARTED' | 'LEARNING' | 'PRACTICING' | 'MASTERED';

export interface AttemptSample {
  isCorrect: boolean;
  difficulty: number;
  timeMs: number;
  hintUsed: boolean;
  createdAt: Date;
}

export interface MasteryBreakdown {
  accuracy: number;
  difficulty: number;
  consistency: number;
  speed: number;
  retention: number;
  hintRate: number;
  /** 0..1 — how much evidence we have */
  confidence: number;
  mastery: number;
}

export const MASTERY_WINDOW = 30;
export const MASTERED_AT = 0.85;
export const PRACTICING_AT = 0.6;
/** Number of attempts after which practice data fully replaces the placement prior. */
const FULL_CONFIDENCE_ATTEMPTS = 15;
const TARGET_TIME_MS = 10_000;
const MAX_DIFFICULTY = 5;

const WEIGHTS = { accuracy: 0.35, difficulty: 0.2, consistency: 0.15, retention: 0.15, speed: 0.1 };

export function statusFor(mastery: number, attempts: number): SkillStatus {
  if (mastery >= MASTERED_AT) return 'MASTERED';
  if (mastery >= PRACTICING_AT) return 'PRACTICING';
  if (attempts > 0 || mastery > 0) return 'LEARNING';
  return 'NOT_STARTED';
}

/**
 * @param attempts all attempts for one skill, any order (the last MASTERY_WINDOW are used)
 * @param prior placement estimate, used while there is little practice data
 */
export function computeMastery(attempts: AttemptSample[], prior: number | null = null): MasteryBreakdown {
  const recent = [...attempts]
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(-MASTERY_WINDOW);
  const n = recent.length;
  if (n === 0) {
    const m = prior ?? 0;
    return { accuracy: 0, difficulty: 0, consistency: 0, speed: 0, retention: 0, hintRate: 0, confidence: 0, mastery: m };
  }

  // Recency-weighted accuracy: newer answers count more.
  let wSum = 0;
  let wCorrect = 0;
  recent.forEach((a, i) => {
    const w = Math.pow(0.92, n - 1 - i);
    wSum += w;
    if (a.isCorrect) wCorrect += w;
  });
  const accuracy = wCorrect / wSum;

  const correct = recent.filter((a) => a.isCorrect);
  const difficulty = correct.length ? avg(correct.map((a) => a.difficulty)) / MAX_DIFFICULTY : 0;

  // Consistency: how stable accuracy is across chunks of 5 answers.
  const chunks: number[] = [];
  for (let i = 0; i < n; i += 5) {
    const chunk = recent.slice(i, i + 5);
    chunks.push(chunk.filter((a) => a.isCorrect).length / chunk.length);
  }
  const consistency = chunks.length < 2 ? accuracy : clamp01(1 - stddev(chunks) * 2) * avg(chunks);

  const correctTimes = correct.map((a) => a.timeMs);
  const speed = correctTimes.length ? clamp01(TARGET_TIME_MS / Math.max(median(correctTimes), 1)) : 0;

  const hintRate = recent.filter((a) => a.hintUsed).length / n;

  // Retention: accuracy on days after the first practice day. Until a child
  // comes back on another day we only give partial credit.
  const firstDay = dayKey(recent[0].createdAt);
  const later = recent.filter((a) => dayKey(a.createdAt) !== firstDay);
  const retention = later.length ? later.filter((a) => a.isCorrect).length / later.length : accuracy * 0.7;

  const practice = clamp01(
    accuracy * WEIGHTS.accuracy +
      difficulty * WEIGHTS.difficulty +
      consistency * WEIGHTS.consistency +
      retention * WEIGHTS.retention +
      speed * WEIGHTS.speed -
      hintRate * 0.1,
  );

  const confidence = Math.min(1, n / FULL_CONFIDENCE_ATTEMPTS);
  let mastery = prior == null ? practice : prior * (1 - confidence) + practice * confidence;
  // Getting (almost) everything right must never make a skill look weaker than
  // the placement estimate — only mistakes can lower it.
  if (prior != null && accuracy >= 0.9) mastery = Math.max(mastery, prior);

  return {
    accuracy: round2(accuracy),
    difficulty: round2(difficulty),
    consistency: round2(consistency),
    speed: round2(speed),
    retention: round2(retention),
    hintRate: round2(hintRate),
    confidence: round2(confidence),
    mastery: round2(mastery),
  };
}

/** Spaced practice: review after 1, 3, 7, 14, 30 days. */
const REVIEW_INTERVAL_DAYS = [1, 3, 7, 14, 30];

export function nextReviewAt(from: Date, reviewCount: number): Date {
  const days = REVIEW_INTERVAL_DAYS[Math.min(reviewCount, REVIEW_INTERVAL_DAYS.length - 1)];
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

/**
 * Forgetting curve: how much of a skill is likely still remembered.
 * Each successful review doubles the half-life (3, 6, 12, 24, 48 days…).
 */
export function memoryStrength(lastPracticedAt: Date | null, reviewCount: number, now: Date = new Date()): number {
  if (!lastPracticedAt) return 0;
  const days = Math.max(0, (now.getTime() - lastPracticedAt.getTime()) / (24 * 60 * 60 * 1000));
  const halfLife = 3 * Math.pow(2, Math.min(reviewCount, 6));
  return round2(Math.pow(0.5, days / halfLife));
}

/** Recommended starting difficulty for practice given current mastery. */
export function recommendedDifficulty(mastery: number): number {
  return Math.min(MAX_DIFFICULTY, Math.max(1, 1 + Math.round(mastery * 4)));
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function avg(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0) / xs.length;
}
function stddev(xs: number[]): number {
  const m = avg(xs);
  return Math.sqrt(avg(xs.map((x) => (x - m) ** 2)));
}
function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
