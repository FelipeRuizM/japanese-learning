import { describe, expect, it } from 'vitest'
import {
  ageReading,
  buildNumberQuestion,
  buildNumberRound,
  countReading,
  MAX,
  MAX_YEAR,
  MIN,
  NUMBER_OPTION_COUNT,
  plausibleWrongReadings,
  promptFor,
  ROUND_SHAPE,
  yearReading,
} from './numbers'
import type { Rng } from './shuffle'

/** mulberry32 — a seeded PRNG, so every assertion here is deterministic. */
function seeded(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const KANA_ONLY = /^[ぁ-ゟ]+$/u

const everyNumber = Array.from({ length: MAX }, (_, i) => i + 1)

describe('counting readings', () => {
  /**
   * Written out rather than generated. A test that rebuilds the reading from
   * the same rule the code uses proves only that the rule is applied twice.
   */
  const EXPECTED: Record<number, string> = {
    1: 'いち',
    2: 'に',
    3: 'さん',
    4: 'よん',
    5: 'ご',
    6: 'ろく',
    7: 'なな',
    8: 'はち',
    9: 'きゅう',
    10: 'じゅう',
    11: 'じゅういち',
    14: 'じゅうよん',
    17: 'じゅうなな',
    19: 'じゅうきゅう',
    20: 'にじゅう',
    23: 'にじゅうさん',
    30: 'さんじゅう',
    40: 'よんじゅう',
    45: 'よんじゅうご',
    47: 'よんじゅうなな',
    50: 'ごじゅう',
    60: 'ろくじゅう',
    70: 'ななじゅう',
    74: 'ななじゅうよん',
    80: 'はちじゅう',
    90: 'きゅうじゅう',
    99: 'きゅうじゅうきゅう',
    100: 'ひゃく',
  }

  it.each(Object.entries(EXPECTED))('reads %s as %s', (n, reading) => {
    expect(countReading(Number(n))).toBe(reading)
  })

  /** Ten is じゅう on its own. いちじゅう is the classic over-application. */
  it('never puts いち in front of じゅう', () => {
    for (const n of everyNumber) {
      expect(countReading(n).startsWith('いちじゅう')).toBe(false)
    }
  })

  /**
   * A substring sweep for く would be wrong, and the first draft of this test
   * was: く is inside ろく and ひゃく, both of them correct. し is safe to sweep
   * for — no counting reading contains it — and 9 is pinned positively instead.
   */
  it('never uses し or しち', () => {
    for (const n of everyNumber) {
      expect(countReading(n).includes('し'), `${n} → ${countReading(n)}`).toBe(false)
    }
  })

  it('uses よん, なな and きゅう wherever a 4, 7 or 9 appears', () => {
    const digitReading: Record<number, string> = { 4: 'よん', 7: 'なな', 9: 'きゅう' }

    for (const n of everyNumber) {
      if (n === 100) continue
      const reading = countReading(n)
      const ones = n % 10
      const tens = Math.floor(n / 10)

      const onesReading = digitReading[ones]
      if (onesReading !== undefined) {
        expect(reading.endsWith(onesReading), `${n} → ${reading}`).toBe(true)
      }
      const tensReading = digitReading[tens]
      if (tensReading !== undefined) {
        expect(reading.startsWith(`${tensReading}じゅう`), `${n} → ${reading}`).toBe(
          true,
        )
      }
    }
  })

  it('is kana, all the way up', () => {
    for (const n of everyNumber) expect(countReading(n)).toMatch(KANA_ONLY)
  })

  /** Two numbers sharing a reading would make the drill unanswerable. */
  it('gives every number in range its own reading', () => {
    const readings = everyNumber.map(countReading)
    expect(new Set(readings).size).toBe(readings.length)
  })

  it('refuses anything outside the range it was taught', () => {
    expect(() => countReading(0)).toThrow(RangeError)
    expect(() => countReading(101)).toThrow(RangeError)
    expect(() => countReading(4.5)).toThrow(RangeError)
    expect(() => countReading(MIN)).not.toThrow()
    expect(() => countReading(MAX)).not.toThrow()
  })
})

describe('age readings', () => {
  /**
   * The class note lists 1, 8, 10 and 20. Three of those are one sound change
   * that PROPAGATES — 18 and 30 are in this table precisely because they are
   * not in the note, and a learner generalising the note alone gets them wrong.
   */
  const EXPECTED: Record<number, string> = {
    1: 'いっさい',
    2: 'にさい',
    4: 'よんさい',
    7: 'ななさい',
    8: 'はっさい',
    9: 'きゅうさい',
    10: 'じゅっさい',
    11: 'じゅういっさい',
    18: 'じゅうはっさい',
    19: 'じゅうきゅうさい',
    20: 'はたち',
    21: 'にじゅういっさい',
    28: 'にじゅうはっさい',
    30: 'さんじゅっさい',
    40: 'よんじゅっさい',
    41: 'よんじゅういっさい',
    50: 'ごじゅっさい',
    80: 'はちじゅっさい',
    90: 'きゅうじゅっさい',
    100: 'ひゃくさい',
  }

  it.each(Object.entries(EXPECTED))('reads %s years old as %s', (n, reading) => {
    expect(ageReading(Number(n))).toBe(reading)
  })

  it('takes the small っ for every number ending in 1 or 8, and every ten', () => {
    for (const n of everyNumber) {
      const reading = ageReading(n)
      if (n === 20) continue
      const ones = n % 10
      if (ones === 1 || ones === 8) {
        expect(reading.endsWith('っさい'), `${n} → ${reading}`).toBe(true)
      }
      if (ones === 0 && n !== 100) {
        expect(reading.endsWith('じゅっさい'), `${n} → ${reading}`).toBe(true)
      }
    }
  })

  /** はたち is the one form that drops さい entirely. */
  it('says はたち for twenty, and nothing else does', () => {
    for (const n of everyNumber) {
      expect(ageReading(n) === 'はたち').toBe(n === 20)
    }
  })

  it('is kana, and unique per age', () => {
    const readings = everyNumber.map(ageReading)
    for (const reading of readings) expect(reading).toMatch(KANA_ONLY)
    expect(new Set(readings).size).toBe(readings.length)
  })
})

describe('year-in-school readings', () => {
  const EXPECTED: Record<number, string> = {
    1: 'いちねんせい',
    2: 'にねんせい',
    3: 'さんねんせい',
    4: 'よねんせい',
    5: 'ごねんせい',
    6: 'ろくねんせい',
  }

  it.each(Object.entries(EXPECTED))('reads year %s as %s', (n, reading) => {
    expect(yearReading(Number(n))).toBe(reading)
  })

  /** よ, not よん — the one thing the class note flags about this form. */
  it('shortens four to よ', () => {
    expect(yearReading(4)).toBe('よねんせい')
    expect(yearReading(4)).not.toBe('よんねんせい')
  })

  it('goes no further than school does', () => {
    expect(() => yearReading(0)).toThrow(RangeError)
    expect(() => yearReading(MAX_YEAR + 1)).toThrow(RangeError)
  })
})

describe('prompts', () => {
  it('labels each kind the way the screen shows it', () => {
    expect(promptFor('count', 47).label).toBe('47')
    expect(promptFor('age', 20).label).toBe('20 years old')
    expect(promptFor('year', 4).label).toBe('4th year')
    expect(promptFor('year', 1).label).toBe('1st year')
    expect(promptFor('year', 3).label).toBe('3rd year')
  })

  it('carries the right reading for the kind', () => {
    expect(promptFor('count', 20).reading).toBe('にじゅう')
    expect(promptFor('age', 20).reading).toBe('はたち')
    expect(promptFor('year', 4).reading).toBe('よねんせい')
  })
})

describe('distractors', () => {
  /**
   * The most useful distractor in the drill: the form produced by ignoring the
   * sound change. Someone who has not learned はたち writes にじゅうさい.
   */
  it('offers the naive age form against an irregular one', () => {
    expect(plausibleWrongReadings(promptFor('age', 20), seeded(1))).toContain(
      'にじゅうさい',
    )
    expect(plausibleWrongReadings(promptFor('age', 10), seeded(1))).toContain(
      'じゅうさい',
    )
    expect(plausibleWrongReadings(promptFor('age', 8), seeded(1))).toContain('はちさい')
  })

  /** The error the tens-before-じゅう rule exists to prevent. */
  it('offers the digit swap', () => {
    expect(plausibleWrongReadings(promptFor('count', 47), seeded(1))).toContain(
      'ななじゅうよん',
    )
  })

  /** し, しち and く — the readings the class says not to use for counting. */
  it('offers the discouraged reading', () => {
    expect(plausibleWrongReadings(promptFor('count', 4), seeded(1))).toContain('し')
    expect(plausibleWrongReadings(promptFor('count', 47), seeded(1))).toContain(
      'しじゅうしち',
    )
  })

  it('offers よんねんせい against よねんせい', () => {
    expect(plausibleWrongReadings(promptFor('year', 4), seeded(1))).toContain(
      'よんねんせい',
    )
  })

  it('never offers the correct reading as a wrong one', () => {
    for (let seed = 0; seed < 5; seed++) {
      for (const n of everyNumber) {
        for (const kind of ['count', 'age'] as const) {
          const prompt = promptFor(kind, n)
          expect(plausibleWrongReadings(prompt, seeded(seed))).not.toContain(
            prompt.reading,
          )
        }
      }
    }
  })
})

describe('questions', () => {
  it('always offers four distinct options, one of them right', () => {
    for (let seed = 0; seed < 5; seed++) {
      const rng = seeded(seed)
      for (const n of everyNumber) {
        for (const kind of ['count', 'age'] as const) {
          const question = buildNumberQuestion(promptFor(kind, n), rng)
          expect(question.options, `${kind} ${n}`).toHaveLength(NUMBER_OPTION_COUNT)
          expect(new Set(question.options).size, `${kind} ${n}`).toBe(
            NUMBER_OPTION_COUNT,
          )
          expect(question.options).toContain(question.prompt.reading)
        }
      }
    }
  })

  /**
   * Six values in range is fewer than the plausible-mistake list usually
   * supplies, so this is the case that exercises the fill-from-range fallback.
   */
  it('fills four options for a year, with only six to choose from', () => {
    for (let seed = 0; seed < 20; seed++) {
      const rng = seeded(seed)
      for (let n = 1; n <= MAX_YEAR; n++) {
        const question = buildNumberQuestion(promptFor('year', n), rng)
        expect(question.options).toHaveLength(NUMBER_OPTION_COUNT)
        expect(new Set(question.options).size).toBe(NUMBER_OPTION_COUNT)
        expect(question.options).toContain(question.prompt.reading)
      }
    }
  })
})

describe('a round', () => {
  const total = ROUND_SHAPE.reduce((sum, part) => sum + part.count, 0)

  it('asks every kind, in the fixed proportions', () => {
    for (let seed = 0; seed < 20; seed++) {
      const round = buildNumberRound(seeded(seed))
      expect(round).toHaveLength(total)

      for (const { kind, count } of ROUND_SHAPE) {
        expect(round.filter((q) => q.prompt.kind === kind)).toHaveLength(count)
      }
    }
  })

  /** A round that asked the same number twice would waste a question. */
  it('never repeats a value within a kind', () => {
    for (let seed = 0; seed < 20; seed++) {
      for (const { kind } of ROUND_SHAPE) {
        const values = buildNumberRound(seeded(seed))
          .filter((q) => q.prompt.kind === kind)
          .map((q) => q.prompt.value)
        expect(new Set(values).size).toBe(values.length)
      }
    }
  })

  it('mixes the kinds rather than grouping them', () => {
    // Fixed proportions must not mean a block of counting then a block of ages.
    const kinds = buildNumberRound(seeded(4)).map((q) => q.prompt.kind)
    const runs = kinds.filter((kind, i) => kind !== kinds[i - 1]).length
    expect(runs).toBeGreaterThan(ROUND_SHAPE.length)
  })
})
