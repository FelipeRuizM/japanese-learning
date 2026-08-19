import { describe, expect, it } from 'vitest'
import { shuffle, type Rng } from './shuffle'

/** mulberry32 — deterministic, so these assertions are not statistical. */
function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

describe('shuffle', () => {
  it('keeps every element exactly once', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8]
    const out = shuffle(input, seeded(1))
    expect([...out].sort((a, b) => a - b)).toEqual(input)
  })

  it('does not mutate its input', () => {
    const input = [1, 2, 3, 4, 5]
    shuffle(input, seeded(2))
    expect(input).toEqual([1, 2, 3, 4, 5])
  })

  it('handles empty and single-element arrays', () => {
    expect(shuffle([], seeded(3))).toEqual([])
    expect(shuffle(['only'], seeded(3))).toEqual(['only'])
  })

  /**
   * Fisher-Yates reaches every arrangement. The naive
   * `sort(() => rng() - 0.5)` does not: it biases toward the input order, and
   * how badly depends on the engine's sort implementation.
   */
  it('reaches every permutation of a three-element array', () => {
    const rng = seeded(5)
    const seen = new Set<string>()
    for (let i = 0; i < 300; i++) seen.add(shuffle(['a', 'b', 'c'], rng).join(''))
    expect(seen.size).toBe(6)
  })

  it('does not leave a long array in its original order', () => {
    const input = Array.from({ length: 40 }, (_, i) => i)
    expect(shuffle(input, seeded(7))).not.toEqual(input)
  })
})
