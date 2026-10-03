// The random numbers of one particle system: a function giving the next in
// [0, 1), which `seed(n)` starts over from a known place. A system starts
// anywhere; a test seeds it to get the same particles every time.
export function generator(seed = (Math.random() * 2 ** 32) >>> 0) {
  let state = seed >>> 0;
  // mulberry32: small, fast, and good enough for where a spark goes.
  const next = () => {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
  next.seed = (value) => void (state = value >>> 0);
  return next;
}
