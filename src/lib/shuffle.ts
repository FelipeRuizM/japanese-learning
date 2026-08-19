/**
 * A random source in [0, 1). Injected everywhere rather than reaching for
 * `Math.random`, so quiz behaviour can be tested deterministically instead of
 * being asserted at statistically.
 */
export type Rng = () => number

export const systemRng: Rng = () => Math.random()

/**
 * Fisher-Yates, returning a new array.
 *
 * Not `sort(() => rng() - 0.5)`: that is not a uniform shuffle — it biases
 * toward the original order and how badly depends on the engine's sort.
 */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = out[i]
    const b = out[j]
    // Indexed access is `T | undefined` under noUncheckedIndexedAccess; both
    // indices are in range by construction, so this guard never fires.
    if (a === undefined || b === undefined) continue
    out[i] = b
    out[j] = a
  }
  return out
}
