import { hintRemovals } from './hint-remove.js';

describe('hintRemovals', () => {
  it('crosses out only wrong options, two of four, one of three, none of two', () => {
    const four = hintRemovals(['1', '2', '3', '4'], '3', 'q1');
    expect(four).toHaveLength(2);
    expect(four).not.toContain('3');
    expect(new Set(four).size).toBe(2);
    expect(hintRemovals(['a', 'b', 'c'], 'a', 'q2')).toHaveLength(1);
    expect(hintRemovals(['ใช่', 'ไม่ใช่'], 'ใช่', 'q3')).toEqual([]);
  });

  it('is stable for the same question and varies between questions', () => {
    const options = ['10', '11', '12', '13'];
    expect(hintRemovals(options, '12', 'same')).toEqual(hintRemovals(options, '12', 'same'));
    const picks = new Set(Array.from({ length: 30 }, (_, i) => hintRemovals(options, '12', `q${i}`).sort().join()));
    expect(picks.size).toBeGreaterThan(1);
  });
});
