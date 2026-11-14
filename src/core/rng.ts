const UINT32 = 4294967296;

/** Returns a seeded generator of numbers in [0, 1): the same seed gives the same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  };
}

/** Returns one item of a non-empty list, chosen by the generator. */
export function pick<T>(random: () => number, items: readonly T[]): T {
  const item = items[Math.floor(random() * items.length)];
  if (item === undefined) {
    throw new Error('pick: empty list');
  }
  return item;
}
