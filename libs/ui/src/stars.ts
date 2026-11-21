const STAR_COUNT = 40;

/** Deterministic star field from the prototype: same positions and delays on every render. */
export const STARS = Array.from({ length: STAR_COUNT }, (_, j) => ({
  left: `${(j * 37) % 100}%`,
  top: `${(j * 53) % 70}%`,
  delay: `${((j * 0.37) % 3).toFixed(2)}s`,
}));
