import {
  INFERRED_MASTERY,
  QUESTIONS_PER_SKILL,
  applyPlacementAnswer,
  createPlacementState,
  finalizePlacement,
  nextQuestionSpec,
  type PlacementState,
} from './placement.engine.js';

const ORDER = ['A', 'B', 'C', 'D', 'E'];

/** Simulates a child who can do every skill up to (and including) index `ability`. */
function run(startIndex: number, ability: number): PlacementState {
  let state = createPlacementState(ORDER, startIndex);
  let spec = nextQuestionSpec(state);
  while (spec) {
    state = applyPlacementAnswer(state, ORDER.indexOf(spec.skillCode) <= ability);
    spec = nextQuestionSpec(state);
  }
  return state;
}

describe('placement engine', () => {
  it('raises difficulty after correct answers and lowers it after wrong ones', () => {
    let s = createPlacementState(ORDER, 0);
    expect(s.difficulty).toBe(2);
    s = applyPlacementAnswer(s, true);
    expect(s.difficulty).toBe(3);
    s = applyPlacementAnswer(s, false);
    expect(s.difficulty).toBe(2);
  });

  it('moves up while the child succeeds and stops at the first failure', () => {
    const s = run(1, 2);
    expect(s.done).toBe(true);
    expect(s.probes.B.passed).toBe(true);
    expect(s.probes.C.passed).toBe(true);
    expect(s.probes.D.passed).toBe(false);
    expect(s.probes.E).toBeUndefined();
  });

  it('falls back to prerequisites when the starting skill is too hard', () => {
    const s = run(3, 0);
    expect(s.probes.D.passed).toBe(false);
    expect(s.probes.C.passed).toBe(false);
    expect(s.probes.B.passed).toBe(false);
    expect(s.probes.A.passed).toBe(true);
    expect(s.totalAsked).toBe(4 * QUESTIONS_PER_SKILL);
  });

  it('infers mastery for untested skills below the highest passed one', () => {
    const results = finalizePlacement(run(2, 3));
    const byCode = Object.fromEntries(results.map((r) => [r.skillCode, r]));
    expect(byCode.A).toEqual({ skillCode: 'A', mastery: INFERRED_MASTERY, source: 'inferred' });
    expect(byCode.B.source).toBe('inferred');
    expect(byCode.C.source).toBe('tested');
    expect(byCode.D.mastery).toBeGreaterThan(0.6);
    expect(byCode.E.mastery).toBeLessThan(0.3);
  });

  it('gives no inferred skills when the child fails everything', () => {
    const results = finalizePlacement(run(2, -1));
    expect(results.every((r) => r.source === 'tested')).toBe(true);
    expect(results.map((r) => r.skillCode).sort()).toEqual(['A', 'B', 'C']);
  });

  it('finishes when the top of the tree is reached', () => {
    const s = run(0, 99);
    expect(s.done).toBe(true);
    expect(Object.keys(s.probes)).toEqual(ORDER);
  });

  describe('with a branching skill graph', () => {
    // A → B → D (number branch), A → C → E (shape branch), F needs D and E
    const ORDER2 = ['A', 'B', 'C', 'D', 'E', 'F'];
    const GRAPH = { A: [], B: ['A'], C: ['A'], D: ['B'], E: ['C'], F: ['D', 'E'] };

    function runKnowing(start: number, knows: string[]) {
      let state = createPlacementState(ORDER2, start, GRAPH);
      let spec = nextQuestionSpec(state);
      while (spec) {
        state = applyPlacementAnswer(state, knows.includes(spec.skillCode));
        spec = nextQuestionSpec(state);
      }
      return state;
    }

    it('keeps probing other branches after a miss, skipping dependents of the miss', () => {
      const s = runKnowing(1, ['A', 'C', 'E']);
      expect(s.probes.B.passed).toBe(false);
      expect(s.probes.A.passed).toBe(true); // stepped down to B's prerequisite
      expect(s.probes.C.passed).toBe(true); // other branch still tested
      expect(s.probes.E.passed).toBe(true);
      expect(s.probes.D).toBeUndefined(); // depends on B: skipped
      expect(s.probes.F).toBeUndefined();
    });

    it("steps down to the failed skill's own prerequisites, not just the previous skill", () => {
      const s = runKnowing(3, ['A', 'C']); // start at D (needs B)
      expect(s.probes.D.passed).toBe(false);
      expect(s.probes.B.passed).toBe(false);
      expect(s.probes.A.passed).toBe(true);
      expect(Object.keys(s.probes)).not.toContain('F');
    });

    it('stops after two failures in a row on the way up', () => {
      const s = runKnowing(0, ['A']);
      expect(s.probes.B.passed).toBe(false);
      expect(s.probes.C.passed).toBe(false);
      expect(s.done).toBe(true);
      expect(Object.keys(s.probes)).toEqual(['A', 'B', 'C']);
    });

    it('infers only real prerequisites of passed skills', () => {
      let state = createPlacementState(ORDER2, 4, GRAPH); // start at E
      for (let i = 0; i < 3; i++) state = applyPlacementAnswer(state, true); // pass E
      state = { ...state, done: true };
      const inferred = finalizePlacement(state).filter((r) => r.source === 'inferred').map((r) => r.skillCode);
      expect(inferred.sort()).toEqual(['A', 'C']); // not B or D: different branch
    });

    it("checks a failed skill's untested prerequisite before moving on (diagnose)", () => {
      // Q → Z and X → S; start at S. Missing Z: was it because Q is missing?
      const order = ['Q', 'X', 'S', 'Z', 'T'];
      const graph = { Q: [], X: [], S: ['X'], Z: ['Q'], T: [] };
      let state = createPlacementState(order, 2, graph);
      const knows = ['Q', 'S', 'T'];
      const asked: string[] = [];
      for (let spec = nextQuestionSpec(state); spec; spec = nextQuestionSpec(state)) {
        if (asked.at(-1) !== spec.skillCode) asked.push(spec.skillCode);
        state = applyPlacementAnswer(state, knows.includes(spec.skillCode));
      }
      expect(asked).toEqual(['S', 'Z', 'Q', 'T']);
      expect(state.probes.Q.passed).toBe(true);
      const results = Object.fromEntries(finalizePlacement(state).map((r) => [r.skillCode, r.source]));
      expect(results).toEqual({ Q: 'tested', X: 'inferred', S: 'tested', Z: 'tested', T: 'tested' });
    });

    it('sweeps lower-grade skills that nothing else covered', () => {
      // L stands alone below the start; nothing that is tested depends on it.
      const order = ['L', 'M', 'N'];
      const graph = { L: [], M: [], N: ['M'] };
      let state = createPlacementState(order, 1, graph);
      for (let spec = nextQuestionSpec(state); spec; spec = nextQuestionSpec(state)) state = applyPlacementAnswer(state, true);
      expect(state.probes.L.passed).toBe(true);
      expect(state.sweeps).toBe(1);
    });

    it('resumes states saved by the previous engine', () => {
      const legacy = { ...createPlacementState(ORDER, 1), direction: 'up' } as unknown as Record<string, unknown>;
      delete legacy.prerequisites;
      delete legacy.phase;
      delete legacy.upFails;
      let s = legacy as unknown as ReturnType<typeof createPlacementState>;
      for (let i = 0; i < 3; i++) s = applyPlacementAnswer(s, true);
      expect(s.order[s.index]).toBe('C');
    });
  });
});
