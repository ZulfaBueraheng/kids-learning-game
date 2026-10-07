import { topologicalOrder } from '../learning-path/learning-path.engine.js';
import { GENERATORS, generateQuestion } from '../questions/generators.js';
import { seededRng } from '../questions/random.js';
import { SUBJECTS } from './subjects.js';

const allSkills = SUBJECTS.flatMap((s) => s.skills);

describe('curriculum of every subject', () => {
  it('has unique subject, skill, world and item codes', () => {
    const unique = (xs: string[]) => expect(new Set(xs).size).toBe(xs.length);
    unique(SUBJECTS.map((s) => s.code));
    unique(allSkills.map((s) => s.code));
    unique(SUBJECTS.flatMap((s) => s.worlds.map((w) => w.code)));
    unique(SUBJECTS.flatMap((s) => s.items.map((i) => i.code)));
  });

  it.each(SUBJECTS.map((s) => [s.code, s] as const))('%s: prerequisites stay inside the subject and in topological order', (_, subject) => {
    const codes = subject.skills.map((s) => s.code);
    for (const s of subject.skills) for (const p of s.prerequisites) expect(codes).toContain(p);
    const order = topologicalOrder(subject.skills.map((s, i) => ({ code: s.code, sortOrder: i, prerequisites: s.prerequisites })));
    expect(order).toEqual(codes);
  });

  it.each(SUBJECTS.map((s) => [s.code, s] as const))('%s: every skill has a question generator and a world to play it in', (_, subject) => {
    const staged = new Set(subject.worlds.flatMap((w) => w.stages.map((st) => st.skill)));
    for (const s of subject.skills) {
      expect(GENERATORS[s.code]).toBeDefined();
      expect(staged.has(s.code)).toBe(true);
    }
    for (const w of subject.worlds) for (const st of w.stages) expect(subject.skills.map((s) => s.code)).toContain(st.skill);
  });

  it.each(SUBJECTS.map((s) => [s.code, s] as const))('%s: placement starts on a real skill for every grade', (_, subject) => {
    for (const code of Object.values(subject.placementStart)) expect(subject.skills.map((s) => s.code)).toContain(code);
  });

  it('gives every world a boss collectible', () => {
    const rewardWorlds = new Set(SUBJECTS.flatMap((s) => s.items.map((i) => i.rewardWorldCode).filter(Boolean)));
    for (const w of SUBJECTS.flatMap((s) => s.worlds)) expect(rewardWorlds.has(w.code)).toBe(true);
  });

  it('never offers the answer twice or as a distractor, at any difficulty', () => {
    const rng = seededRng(66);
    for (const s of SUBJECTS.filter((x) => x.code !== 'MATH').flatMap((x) => x.skills)) {
      for (let d = 1; d <= 5; d++) {
        for (let k = 0; k < 60; k++) {
          const q = generateQuestion(s.code, d, rng);
          expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(3);
        }
      }
    }
  });
});
