/**
 * A hint that needs no reading: which wrong options to cross out when the
 * child asks for help. Two of four (or more), one of three, none of two.
 * Seeded by the question id so the same question always crosses out the same options.
 */
export function hintRemovals(options: string[], answer: string, seed: string): string[] {
  const wrong = options.filter((o) => o !== answer);
  const count = options.length >= 4 ? 2 : options.length === 3 ? 1 : 0;
  return wrong
    .map((o) => ({ o, k: hash(`${seed}:${o}`) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, count)
    .map((x) => x.o);
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
