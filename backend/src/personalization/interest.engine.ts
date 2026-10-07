import type { Rng } from '../questions/random.js';
import { INTEREST_THEMES, isTheme, type Theme } from '../questions/themes.js';

/** Interest score per theme. Grows from explicit picks and from sessions the child enjoys. */
export type Interests = Partial<Record<Theme, number>>;

export const PICK_SCORE = 5;
export const ENJOYED_SESSION_SCORE = 1;
const MAX_SCORE = 20;
const TOTAL_BEFORE_DECAY = 60;
/** Weight of the neutral theme so questions still vary even for a child with one strong interest. */
const GENERAL_WEIGHT = 1;

export function sanitizeInterests(raw: unknown): Interests {
  const out: Interests = {};
  if (raw && typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw)) {
      if (isTheme(k) && k !== 'GENERAL' && typeof v === 'number' && v > 0) out[k] = Math.min(v, MAX_SCORE);
    }
  }
  return out;
}

/** Explicit choices from the "what do you like?" screen replace the picked themes' scores. */
export function fromPicks(themes: string[], current: Interests = {}): Interests {
  const picked = new Set(themes.filter(isTheme));
  const out: Interests = {};
  for (const t of INTEREST_THEMES) {
    if (picked.has(t)) out[t] = Math.max(PICK_SCORE, current[t] ?? 0);
  }
  return out;
}

/**
 * Implicit signal: the child enjoyed a session in this theme. Old interests
 * fade slowly once the profile is large, so new interests can take over.
 */
export function recordSignal(interests: Interests, theme: Theme, amount = ENJOYED_SESSION_SCORE): Interests {
  if (theme === 'GENERAL') return interests;
  const next: Interests = { ...interests, [theme]: Math.min(MAX_SCORE, (interests[theme] ?? 0) + amount) };
  const total = Object.values(next).reduce((s, v) => s + (v ?? 0), 0);
  if (total > TOTAL_BEFORE_DECAY) {
    for (const t of Object.keys(next) as Theme[]) next[t] = Math.round((next[t] ?? 0) * 0.9 * 100) / 100;
  }
  return next;
}

/** Weighted random theme for the next session. */
export function pickTheme(interests: Interests, rng: Rng = Math.random): Theme {
  const entries = Object.entries(interests).filter(([, v]) => (v ?? 0) > 0) as [Theme, number][];
  if (entries.length === 0) return 'GENERAL';
  const pool: [Theme, number][] = [...entries, ['GENERAL', GENERAL_WEIGHT]];
  const total = pool.reduce((s, [, w]) => s + w, 0);
  let r = rng() * total;
  for (const [theme, w] of pool) {
    r -= w;
    if (r < 0) return theme;
  }
  return pool[pool.length - 1][0];
}

/** Sorted profile for the dashboard, with each theme's share of the strongest interest. */
export function interestProfile(interests: Interests): { theme: Theme; score: number; level: number }[] {
  const max = Math.max(0, ...Object.values(interests).map((v) => v ?? 0));
  return INTEREST_THEMES.map((theme) => ({ theme, score: interests[theme] ?? 0, level: max ? (interests[theme] ?? 0) / max : 0 }))
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score);
}

export function topInterest(interests: Interests): Theme | null {
  return interestProfile(interests)[0]?.theme ?? null;
}
