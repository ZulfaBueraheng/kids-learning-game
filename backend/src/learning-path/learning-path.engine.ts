import { MASTERED_AT, PRACTICING_AT } from '../mastery/mastery.engine.js';

export interface SkillNode {
  code: string;
  sortOrder: number;
  prerequisites: string[];
}

export interface StudentSkillState {
  mastery: number;
  nextReviewAt?: Date | null;
}

export type PathItemState = 'CURRENT' | 'READY' | 'LOCKED';

export interface PathItem {
  skillCode: string;
  mastery: number;
  state: PathItemState;
  /** prerequisites still below PRACTICING_AT */
  missingPrerequisites: string[];
}

export interface LearningPlan {
  path: PathItem[];
  /** mastered skills whose spaced-review date has arrived */
  reviews: string[];
  current: string | null;
}

/** Kahn's algorithm, ties broken by curriculum sort order. Throws on cycles. */
export function topologicalOrder(skills: SkillNode[]): string[] {
  const byCode = new Map(skills.map((s) => [s.code, s]));
  const indegree = new Map(skills.map((s) => [s.code, 0]));
  const dependents = new Map<string, string[]>(skills.map((s) => [s.code, []]));
  for (const s of skills) {
    for (const p of s.prerequisites) {
      if (!byCode.has(p)) continue;
      indegree.set(s.code, indegree.get(s.code)! + 1);
      dependents.get(p)!.push(s.code);
    }
  }
  const ready = skills.filter((s) => indegree.get(s.code) === 0).map((s) => s.code);
  const order: string[] = [];
  const bySort = (a: string, b: string) => byCode.get(a)!.sortOrder - byCode.get(b)!.sortOrder;
  while (ready.length) {
    ready.sort(bySort);
    const code = ready.shift()!;
    order.push(code);
    for (const d of dependents.get(code)!) {
      indegree.set(d, indegree.get(d)! - 1);
      if (indegree.get(d) === 0) ready.push(d);
    }
  }
  if (order.length !== skills.length) throw new Error('Skill prerequisite graph has a cycle');
  return order;
}

/** All skills needed to reach the goal skills (goal skills + every prerequisite, transitively). */
export function prerequisiteClosure(skills: SkillNode[], goals: string[]): Set<string> {
  const byCode = new Map(skills.map((s) => [s.code, s]));
  const seen = new Set<string>();
  const stack = [...goals];
  while (stack.length) {
    const code = stack.pop()!;
    if (seen.has(code) || !byCode.has(code)) continue;
    seen.add(code);
    stack.push(...byCode.get(code)!.prerequisites);
  }
  return seen;
}

export function buildLearningPlan(
  skills: SkillNode[],
  student: Map<string, StudentSkillState>,
  options: { goals?: string[]; now?: Date } = {},
): LearningPlan {
  const now = options.now ?? new Date();
  const scope = options.goals ? prerequisiteClosure(skills, options.goals) : null;
  const byCode = new Map(skills.map((s) => [s.code, s]));
  const masteryOf = (code: string) => student.get(code)?.mastery ?? 0;

  const path: PathItem[] = [];
  const reviews: string[] = [];
  for (const code of topologicalOrder(skills)) {
    if (scope && !scope.has(code)) continue;
    const mastery = masteryOf(code);
    if (mastery >= MASTERED_AT) {
      const due = student.get(code)?.nextReviewAt;
      if (due && due.getTime() <= now.getTime()) reviews.push(code);
      continue;
    }
    const missingPrerequisites = byCode.get(code)!.prerequisites.filter((p) => masteryOf(p) < PRACTICING_AT);
    path.push({ skillCode: code, mastery, state: missingPrerequisites.length ? 'LOCKED' : 'READY', missingPrerequisites });
  }

  const current = path.find((p) => p.state === 'READY') ?? null;
  if (current) current.state = 'CURRENT';
  return { path, reviews, current: current?.skillCode ?? null };
}

// ───────────── Goals ─────────────

export const GOALS = ['FOUNDATION', 'GRADE_LEVEL', 'EXAM_PREP', 'PROBLEM_SOLVING', 'MASTERY'] as const;
export type Goal = (typeof GOALS)[number];

const GRADE_ORDER = ['K1', 'K2', 'K3', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6'];

export function isGoal(value: unknown): value is Goal {
  return typeof value === 'string' && (GOALS as readonly string[]).includes(value);
}

/** The goal a child set for one subject, falling back to their general goal. */
export function goalFor(student: { goal: Goal; subjectGoals: unknown }, subject: string): Goal {
  const own = (student.subjectGoals as Record<string, unknown> | null)?.[subject];
  return isGoal(own) ? own : student.goal;
}

/**
 * The skills a goal aims at within one subject (the plan then adds every prerequisite):
 * - FOUNDATION: the basics up to P3, without the "applied" skills
 * - GRADE_LEVEL: everything up to the child's grade
 * - EXAM_PREP: the child's own grade
 * - PROBLEM_SOLVING: the subject's applied skills (word problems, conversation, experiments, critical reading, reasoning)
 * - MASTERY: the whole subject
 * `applied` defaults to the PROBLEM_SOLVING skill group (mathematics).
 */
export function goalTargets(
  goal: Goal,
  skills: { code: string; grade: string; group: string }[],
  grade: string,
  applied?: string[],
): string[] {
  const g = (code: string) => GRADE_ORDER.indexOf(code);
  const isApplied = (s: { code: string; group: string }) => (applied ? applied.includes(s.code) : s.group === 'PROBLEM_SOLVING');
  switch (goal) {
    case 'FOUNDATION':
      return skills.filter((s) => g(s.grade) <= g('P3') && !isApplied(s)).map((s) => s.code);
    case 'GRADE_LEVEL':
      return skills.filter((s) => g(s.grade) <= g(grade)).map((s) => s.code);
    case 'EXAM_PREP': {
      const own = skills.filter((s) => s.grade === grade).map((s) => s.code);
      // no skills at this exact grade (e.g. K2 has few): fall back to grade level
      return own.length ? own : goalTargets('GRADE_LEVEL', skills, grade, applied);
    }
    case 'PROBLEM_SOLVING':
      return skills.filter(isApplied).map((s) => s.code);
    case 'MASTERY':
      return skills.map((s) => s.code);
  }
}
