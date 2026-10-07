/**
 * Adaptive placement assessment, guided by the skill prerequisite graph.
 *
 * Probing starts at the child's grade. Within a skill, difficulty goes up after
 * a correct answer and down after a wrong one (3 questions per skill).
 *
 * - If the starting skill is too hard, we step down to its prerequisites
 *   (highest untested ancestor first) until the child succeeds: the "floor".
 * - Then we move up through the curriculum. A failed skill does not end the
 *   assessment straight away: we first check its untested prerequisites
 *   ("diagnose" — is the foundation missing?), its dependents are skipped
 *   (they would be too hard), and other branches — e.g. geometry after a miss
 *   in fractions — are still probed, until two failures in a row.
 * - With questions left over, a short "sweep" checks lower-grade skills that
 *   nothing else told us about (e.g. a stand-alone word-problem skill).
 * - Untested prerequisites of passed skills are inferred as known.
 */

export const QUESTIONS_PER_SKILL = 3;
export const START_DIFFICULTY = 2;
export const MAX_DIFFICULTY = 5;
export const MAX_QUESTIONS = 36;
/** Consecutive failed skills on the way up before we stop. */
export const UP_FAIL_LIMIT = 2;
/** Lower-grade skills checked at the end when nothing else covered them. */
export const SWEEP_LIMIT = 3;

export type Prerequisites = Record<string, string[]>;

export interface SkillProbe {
  asked: number;
  correct: number;
  maxDifficultyCorrect: number;
  passed?: boolean;
}

export interface PlacementState {
  order: string[];
  /** prerequisite graph (skill → its prerequisites); stored so the state is self-contained */
  prerequisites: Prerequisites;
  index: number;
  /** where probing started (the child's grade) */
  start: number;
  phase: 'start' | 'down' | 'up' | 'diagnose' | 'sweep';
  upFails: number;
  sweeps: number;
  difficulty: number;
  probes: Record<string, SkillProbe>;
  totalAsked: number;
  done: boolean;
}

export interface PlacementSkillResult {
  skillCode: string;
  mastery: number;
  /** tested = answered questions; inferred = assumed from a harder skill passed */
  source: 'tested' | 'inferred';
}

/** Without a graph, treat the order as a simple chain (each skill needs the previous one). */
export function chainPrerequisites(order: string[]): Prerequisites {
  return Object.fromEntries(order.map((code, i) => [code, i > 0 ? [order[i - 1]] : []]));
}

export function createPlacementState(order: string[], startIndex: number, prerequisites?: Prerequisites): PlacementState {
  if (order.length === 0) throw new Error('Placement needs at least one skill');
  return {
    order,
    prerequisites: prerequisites ?? chainPrerequisites(order),
    index: Math.min(Math.max(startIndex, 0), order.length - 1),
    start: Math.min(Math.max(startIndex, 0), order.length - 1),
    phase: 'start',
    upFails: 0,
    sweeps: 0,
    difficulty: START_DIFFICULTY,
    probes: {},
    totalAsked: 0,
    done: false,
  };
}

/** States saved before the graph-aware engine had `direction` instead of `phase`. */
function normalize(state: PlacementState): PlacementState {
  const legacy = state as PlacementState & { direction?: 'up' | 'down' | null };
  return {
    ...state,
    prerequisites: state.prerequisites ?? chainPrerequisites(state.order),
    phase: state.phase ?? legacy.direction ?? 'start',
    upFails: state.upFails ?? 0,
    start: state.start ?? state.index,
    sweeps: state.sweeps ?? 0,
  };
}

export function nextQuestionSpec(state: PlacementState): { skillCode: string; difficulty: number } | null {
  if (state.done) return null;
  return { skillCode: state.order[state.index], difficulty: state.difficulty };
}

export function applyPlacementAnswer(raw: PlacementState, isCorrect: boolean): PlacementState {
  const state = normalize(raw);
  if (state.done) return state;
  const skillCode = state.order[state.index];
  const prev = state.probes[skillCode] ?? { asked: 0, correct: 0, maxDifficultyCorrect: 0 };
  const probe: SkillProbe = {
    asked: prev.asked + 1,
    correct: prev.correct + (isCorrect ? 1 : 0),
    maxDifficultyCorrect: isCorrect ? Math.max(prev.maxDifficultyCorrect, state.difficulty) : prev.maxDifficultyCorrect,
  };
  if (probe.asked >= QUESTIONS_PER_SKILL) probe.passed = probe.correct >= Math.ceil(QUESTIONS_PER_SKILL * 0.6);

  const next: PlacementState = {
    ...state,
    probes: { ...state.probes, [skillCode]: probe },
    totalAsked: state.totalAsked + 1,
    difficulty: Math.min(Math.max(state.difficulty + (isCorrect ? 1 : -1), 1), MAX_DIFFICULTY),
  };
  if (next.totalAsked >= MAX_QUESTIONS) return { ...next, done: true };
  if (probe.passed === undefined) return next;
  return moveToNextSkill(next, probe.passed);
}

function moveToNextSkill(state: PlacementState, passed: boolean): PlacementState {
  const skill = state.order[state.index];
  switch (state.phase) {
    case 'start':
    case 'down': {
      if (passed) return advanceUp({ ...state, phase: 'up', upFails: 0 });
      // Too hard: step down to the highest untested prerequisite of everything failed so far.
      const failed = codesWhere(state, (p) => p.passed === false);
      const below = ancestorsOf(state.prerequisites, failed);
      const candidate = maxIndex(state, (code) => below.has(code) && !state.probes[code]);
      if (candidate === -1) return advanceUp({ ...state, phase: 'up', upFails: 0 });
      return { ...state, phase: 'down', index: candidate, difficulty: START_DIFFICULTY };
    }
    case 'up': {
      if (passed) return advanceUp({ ...state, upFails: 0 });
      const upFails = state.upFails + 1;
      if (upFails >= UP_FAIL_LIMIT) return sweep({ ...state, upFails });
      return diagnose({ ...state, upFails }, skill);
    }
    case 'diagnose':
      // A missing foundation: keep digging; otherwise the foundation is fine, carry on up.
      return passed ? advanceUp({ ...state, phase: 'up' }) : diagnose(state, skill);
    case 'sweep':
      return sweep(state);
  }
}

/** Probe the highest untested prerequisite of a failed skill that we don't already know about. */
function diagnose(state: PlacementState, failedSkill: string): PlacementState {
  const known = ancestorsOf(state.prerequisites, codesWhere(state, (p) => p.passed === true));
  const below = ancestorsOf(state.prerequisites, [failedSkill]);
  const candidate = maxIndex(state, (code) => below.has(code) && !state.probes[code] && !known.has(code));
  if (candidate === -1) return advanceUp({ ...state, phase: 'up' });
  return { ...state, phase: 'diagnose', index: candidate, difficulty: START_DIFFICULTY };
}

/** Next skill forward that isn't tested, isn't already implied known, and doesn't depend on a failed skill. */
function advanceUp(state: PlacementState): PlacementState {
  const known = ancestorsOf(state.prerequisites, codesWhere(state, (p) => p.passed === true));
  const tooHard = descendantsOf(state.prerequisites, state.order, codesWhere(state, (p) => p.passed === false));
  for (let i = state.index + 1; i < state.order.length; i++) {
    const code = state.order[i];
    if (!state.probes[code] && !known.has(code) && !tooHard.has(code)) {
      return { ...state, phase: 'up', index: i, difficulty: START_DIFFICULTY };
    }
  }
  return sweep(state);
}

/** Lower-grade skills nothing else told us about, highest first. */
function sweep(state: PlacementState): PlacementState {
  if (state.sweeps >= SWEEP_LIMIT) return { ...state, done: true };
  const known = ancestorsOf(state.prerequisites, codesWhere(state, (p) => p.passed === true));
  const tooHard = descendantsOf(state.prerequisites, state.order, codesWhere(state, (p) => p.passed === false));
  for (let i = state.start - 1; i >= 0; i--) {
    const code = state.order[i];
    if (!state.probes[code] && !known.has(code) && !tooHard.has(code)) {
      return { ...state, phase: 'sweep', sweeps: state.sweeps + 1, index: i, difficulty: START_DIFFICULTY };
    }
  }
  return { ...state, done: true };
}

function codesWhere(state: PlacementState, test: (p: SkillProbe) => boolean): string[] {
  return Object.entries(state.probes)
    .filter(([, p]) => test(p))
    .map(([code]) => code);
}

function maxIndex(state: PlacementState, test: (code: string) => boolean): number {
  for (let i = state.order.length - 1; i >= 0; i--) if (test(state.order[i])) return i;
  return -1;
}

export function ancestorsOf(prerequisites: Prerequisites, codes: string[]): Set<string> {
  const seen = new Set<string>();
  const stack = codes.flatMap((c) => prerequisites[c] ?? []);
  while (stack.length) {
    const c = stack.pop()!;
    if (seen.has(c)) continue;
    seen.add(c);
    stack.push(...(prerequisites[c] ?? []));
  }
  return seen;
}

export function descendantsOf(prerequisites: Prerequisites, order: string[], codes: string[]): Set<string> {
  const out = new Set<string>();
  const roots = new Set(codes);
  // order is topological, so one forward pass finds everything that depends on a root
  for (const code of order) {
    if ((prerequisites[code] ?? []).some((p) => roots.has(p) || out.has(p))) out.add(code);
  }
  return out;
}

/** Mastery estimate from a probe: mostly accuracy, plus how hard the hardest correct item was. */
export function probeMastery(probe: SkillProbe): number {
  if (probe.asked === 0) return 0;
  const accuracy = probe.correct / probe.asked;
  return round2(accuracy * 0.7 + (probe.maxDifficultyCorrect / MAX_DIFFICULTY) * 0.3);
}

/** Skills below one the child passed are assumed known; spaced review will confirm them. */
export const INFERRED_MASTERY = 0.85;

export function finalizePlacement(raw: PlacementState): PlacementSkillResult[] {
  const state = normalize(raw);
  const passed = codesWhere(state, (p) => p.passed === true);
  const known = ancestorsOf(state.prerequisites, passed);
  const results: PlacementSkillResult[] = [];
  for (const skillCode of state.order) {
    const probe = state.probes[skillCode];
    if (probe && probe.asked > 0) results.push({ skillCode, mastery: probeMastery(probe), source: 'tested' });
    else if (known.has(skillCode)) results.push({ skillCode, mastery: INFERRED_MASTERY, source: 'inferred' });
  }
  return results;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
