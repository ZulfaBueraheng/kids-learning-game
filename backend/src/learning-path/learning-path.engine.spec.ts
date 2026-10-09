import { MATH_SKILLS } from '../curriculum/math-foundation.js';
import { SUBJECTS } from '../curriculum/subjects.js';
import { buildLearningPlan, goalFor, goalTargets, prerequisiteClosure, topologicalOrder, type SkillNode } from './learning-path.engine.js';

const SKILLS: SkillNode[] = MATH_SKILLS.map((s, i) => ({ code: s.code, sortOrder: i, prerequisites: s.prerequisites }));

describe('learning path engine', () => {
  it('orders skills so prerequisites always come first', () => {
    const order = topologicalOrder(SKILLS);
    for (const s of SKILLS) {
      for (const p of s.prerequisites) expect(order.indexOf(p)).toBeLessThan(order.indexOf(s.code));
    }
    // the curriculum's own order is already topological
    expect(order).toEqual(MATH_SKILLS.map((s) => s.code));
  });

  it('detects cycles', () => {
    expect(() =>
      topologicalOrder([
        { code: 'X', sortOrder: 0, prerequisites: ['Y'] },
        { code: 'Y', sortOrder: 1, prerequisites: ['X'] },
      ]),
    ).toThrow(/cycle/);
  });

  it('starts a new child at the root skill', () => {
    const plan = buildLearningPlan(SKILLS, new Map());
    expect(plan.current).toBe('NUM_RECOGNITION');
    expect(plan.path.find((p) => p.skillCode === 'COUNTING')!.state).toBe('LOCKED');
  });

  it('skips mastered skills and targets the knowledge gap', () => {
    const student = new Map([
      ['NUM_RECOGNITION', { mastery: 0.95 }],
      ['COUNTING', { mastery: 0.9 }],
      ['SHAPES_BASIC', { mastery: 0.9 }],
      ['QUANTITY', { mastery: 0.88 }],
      ['ADD_SINGLE', { mastery: 0.7 }],
    ]);
    const plan = buildLearningPlan(SKILLS, student);
    expect(plan.path.map((p) => p.skillCode)).not.toContain('COUNTING');
    expect(plan.current).toBe('ADD_SINGLE');
    const sub = plan.path.find((p) => p.skillCode === 'SUB_SINGLE')!;
    expect(sub.state).toBe('READY'); // ADD_SINGLE ≥ 0.6
    const addDouble = plan.path.find((p) => p.skillCode === 'ADD_DOUBLE')!;
    expect(addDouble.missingPrerequisites).toEqual(['PLACE_VALUE']);
  });

  it('limits the path to what a goal needs', () => {
    expect([...prerequisiteClosure(SKILLS, ['SUB_SINGLE'])].sort()).toEqual(['ADD_SINGLE', 'COUNTING', 'NUM_RECOGNITION', 'SUB_SINGLE']);
    const plan = buildLearningPlan(SKILLS, new Map(), { goals: ['SUB_SINGLE'] });
    expect(plan.path).toHaveLength(4);
  });

  it('lists mastered skills that are due for spaced review', () => {
    const now = new Date('2026-03-10');
    const student = new Map([
      ['NUM_RECOGNITION', { mastery: 0.95, nextReviewAt: new Date('2026-03-09') }],
      ['COUNTING', { mastery: 0.95, nextReviewAt: new Date('2026-03-20') }],
    ]);
    expect(buildLearningPlan(SKILLS, student, { now }).reviews).toEqual(['NUM_RECOGNITION']);
  });

  describe('goals', () => {
    const META = MATH_SKILLS.map((s) => ({ code: s.code, grade: s.grade, group: s.group }));

    it('grade level stops at the child’s grade', () => {
      const t = goalTargets('GRADE_LEVEL', META, 'P1');
      expect(t).toContain('ADD_CARRY');
      expect(t).not.toContain('MULT_CONCEPT');
    });

    it('problem solving pulls in every prerequisite through the plan', () => {
      const t = goalTargets('PROBLEM_SOLVING', META, 'P3');
      expect(t.sort()).toEqual(['PS_MULTI_STEP', 'WORD_ADD_SUB', 'WORD_MULT_DIV']);
      const plan = buildLearningPlan(SKILLS, new Map(), { goals: t });
      expect(plan.path.map((p) => p.skillCode)).toContain('PERCENT_OF'); // needed by multi-step problems
      expect(plan.path.map((p) => p.skillCode)).not.toContain('GEO_ANGLES'); // not needed
    });

    it('foundation covers core arithmetic only', () => {
      const t = goalTargets('FOUNDATION', META, 'P6');
      expect(t).toContain('DIV_BASIC');
      expect(t).not.toContain('DEC_CONCEPT');
      expect(t).not.toContain('WORD_ADD_SUB');
    });

    it('exam prep focuses on the child’s own grade', () => {
      expect(goalTargets('EXAM_PREP', META, 'P5').sort()).toEqual(['ALG_EQUATIONS', 'DEC_ADD_SUB', 'GEO_ANGLES', 'PERCENT_CONCEPT']);
    });
  });
});

describe('goals per subject', () => {
  it('uses the subject goal when set, otherwise the general goal', () => {
    const student = { goal: 'MASTERY' as const, subjectGoals: { ENGLISH: 'FOUNDATION', LOGIC: 'nonsense' } };
    expect(goalFor(student, 'ENGLISH')).toBe('FOUNDATION');
    expect(goalFor(student, 'MATH')).toBe('MASTERY');
    expect(goalFor(student, 'LOGIC')).toBe('MASTERY');
    expect(goalFor({ goal: 'EXAM_PREP', subjectGoals: null }, 'SCIENCE')).toBe('EXAM_PREP');
  });

  it.each(SUBJECTS.map((s) => [s.code, s] as const))('%s: every goal aims at real skills of the subject', (_, subject) => {
    const skills = subject.skills;
    for (const goal of ['FOUNDATION', 'GRADE_LEVEL', 'EXAM_PREP', 'PROBLEM_SOLVING', 'MASTERY'] as const) {
      const targets = goalTargets(goal, skills, 'P4', subject.applied);
      expect(targets.length).toBeGreaterThan(0);
      for (const t of targets) expect(skills.map((s) => s.code)).toContain(t);
    }
    expect(goalTargets('PROBLEM_SOLVING', skills, 'P4', subject.applied).sort()).toEqual([...subject.applied].sort());
    for (const a of subject.applied) expect(goalTargets('FOUNDATION', skills, 'P4', subject.applied)).not.toContain(a);
  });
});
