// A small seeded random number generator: the same seed gives the same game, which
// is what makes the screenshot scenes repeatable. This is a splitmix-style
// generator written for this game: the state is scrambled on every draw and the
// output is the top bits of the scrambled state.
export function createRandom(seed) {
  let state = (seed >>> 0) || 0x9e3779b9;
  return function random() {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad) >>> 0;
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97) >>> 0;
    z = (z ^ (z >>> 15)) >>> 0;
    return z / 4294967296;
  };
}

/** Pick an integer in [min, max). */
export function intBetween(random, min, max) {
  return min + Math.floor(random() * (max - min));
}
