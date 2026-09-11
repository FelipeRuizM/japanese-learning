import { shuffle, type Rng } from './shuffle'

/**
 * Numbers 1–100 (CLAUDE.md §11.3).
 *
 * A GENERATOR, NOT A DECK. A hundred flashcards would teach the list; the class
 * taught a rule — `[tens]じゅう[ones]`, drop either half when it is zero — plus a
 * short table of forms that refuse to follow it. So the rule is code and the
 * exceptions are data, and the drill samples the range instead of enumerating
 * it.
 *
 * Pure functions with an injected `rng`, exactly as `quiz.ts` is.
 */

export const MIN = 1
export const MAX = 100

/**
 * The counting readings. Index 0 is unused — there is no reading for zero in
 * this drill, and a leading blank keeps the array indexable by the digit.
 *
 * 4, 7 and 9 have two readings each, and these are the ones used for counting:
 * **よん** not し, **なな** not しち, **きゅう** not く. The class note gives the
 * reason — し collides with 死 and しち is misheard as いち — and the drill uses
 * the discarded readings as distractors, so the choice is practised rather than
 * merely asserted.
 */
const ONES = ['', 'いち', 'に', 'さん', 'よん', 'ご', 'ろく', 'なな', 'はち', 'きゅう']

/** The readings the class says NOT to use for counting, and what they replace. */
const DISCOURAGED: readonly (readonly [string, string])[] = [
  ['よん', 'し'],
  ['なな', 'しち'],
  ['きゅう', 'く'],
]

function digit(n: number): string {
  const reading = ONES[n]
  // Unreachable for 1-9, which is all this is ever called with.
  if (reading === undefined) throw new RangeError(`no reading for digit ${n}`)
  return reading
}

function assertInRange(n: number): void {
  if (!Number.isInteger(n) || n < MIN || n > MAX) {
    throw new RangeError(`${n} is outside ${MIN}–${MAX}`)
  }
}

/**
 * The counting reading of a number.
 *
 * The whole rule, and it is four lines: ones below ten, じゅう on its own at
 * ten (never いちじゅう), the tens digit in FRONT of じゅう above that, and the
 * ones digit after it when there is one. 100 is ひゃく and joins no pattern.
 */
export function countReading(n: number): string {
  assertInRange(n)
  if (n === 100) return 'ひゃく'
  if (n < 10) return digit(n)

  const tens = Math.floor(n / 10)
  const ones = n % 10
  const tensPart = tens === 1 ? 'じゅう' : `${digit(tens)}じゅう`

  return ones === 0 ? tensPart : `${tensPart}${digit(ones)}`
}

/**
 * The reading of an age, 〜さい.
 *
 * The class note lists 1, 8, 10 and 20 as irregular. Three of those four are
 * not one-off forms but one sound change that **propagates**: a reading ending
 * in いち, はち or じゅう takes the small っ before さい. So 18 is じゅうはっさい
 * and 30 is さんじゅっさい, neither of which is in the note, and both of which a
 * learner would get wrong by generalising the note alone.
 *
 * **20 is the genuine one-off.** はたち uses no さい at all.
 *
 * Implemented as the sound change rather than as a lookup table because a table
 * would have to list thirty entries and would still be wrong for the thirty-first.
 */
export function ageReading(n: number): string {
  assertInRange(n)
  if (n === 20) return 'はたち'

  const base = countReading(n)
  if (base.endsWith('いち')) return `${base.slice(0, -2)}いっさい`
  if (base.endsWith('はち')) return `${base.slice(0, -2)}はっさい`
  if (base.endsWith('じゅう')) return `${base.slice(0, -3)}じゅっさい`

  return `${base}さい`
}

/** Years in school run 1–6: four at university, six at elementary school. */
export const MAX_YEAR = 6

/**
 * The reading of a year in school, 〜ねんせい.
 *
 * One irregular, and the class note calls it out: 4 is **よ**ねんせい, not
 * よんねんせい. Everything else takes its counting reading unchanged.
 */
export function yearReading(n: number): string {
  if (!Number.isInteger(n) || n < 1 || n > MAX_YEAR) {
    throw new RangeError(`${n} is outside school years 1–${MAX_YEAR}`)
  }
  if (n === 4) return 'よねんせい'
  return `${countReading(n)}ねんせい`
}

export type NumberDrillKind = 'count' | 'age' | 'year'

export type NumberPrompt = {
  kind: NumberDrillKind
  value: number
  /** What the screen shows — "47", "20 years old", "4th year". */
  label: string
  /** The correct kana reading. */
  reading: string
}

const ORDINALS = ['', '1st', '2nd', '3rd', '4th', '5th', '6th']

export function promptFor(kind: NumberDrillKind, value: number): NumberPrompt {
  if (kind === 'count') {
    return { kind, value, label: String(value), reading: countReading(value) }
  }
  if (kind === 'age') {
    return {
      kind,
      value,
      label: `${value} years old`,
      reading: ageReading(value),
    }
  }
  const ordinal = ORDINALS[value] ?? `${value}th`
  return { kind, value, label: `${ordinal} year`, reading: yearReading(value) }
}

/** The reading a learner produces by using the discarded reading of 4, 7 or 9. */
function discouragedForm(reading: string): string | null {
  let out = reading
  for (const [counting, avoided] of DISCOURAGED) out = out.replaceAll(counting, avoided)
  return out === reading ? null : out
}

/** 47 → 74. `null` when the digits are the same, or the swap leaves the range. */
function swapDigits(n: number): number | null {
  if (n < 10 || n > 99) return null
  const tens = Math.floor(n / 10)
  const ones = n % 10
  if (tens === ones || ones === 0) return null
  return ones * 10 + tens
}

function readingFor(kind: NumberDrillKind, value: number): string {
  if (kind === 'count') return countReading(value)
  if (kind === 'age') return ageReading(value)
  return yearReading(value)
}

const upperBound = (kind: NumberDrillKind) => (kind === 'year' ? MAX_YEAR : MAX)

/**
 * Wrong readings a learner would plausibly produce, best first.
 *
 * Not random other numbers — those test luck. Every entry here is a mistake the
 * class note predicts:
 *
 *   - the **digit swap**, 74 for 47, which is the error the tens-before-じゅう
 *     rule exists to prevent;
 *   - the **discouraged reading**, しじゅうしち for よんじゅうなな;
 *   - for an age, the **regular form where an irregular is correct** —
 *     にじゅうさい instead of はたち, じゅうはちさい instead of じゅうはっさい.
 *     This is the single most useful distractor in the drill;
 *   - for the fourth year, **よねんせい's near miss** よんねんせい;
 *   - and only then, neighbouring numbers.
 */
export function plausibleWrongReadings(prompt: NumberPrompt, rng: Rng): string[] {
  const { kind, value, reading } = prompt
  const out: string[] = []

  const add = (candidate: string | null) => {
    if (candidate !== null && candidate !== reading && !out.includes(candidate)) {
      out.push(candidate)
    }
  }

  if (kind === 'age') {
    // The form produced by ignoring the sound change entirely.
    add(`${countReading(value)}さい`)
    add(value === 20 ? 'にじゅうさい' : 'はたち')
  }

  if (kind === 'year' && value === 4) add('よんねんせい')

  if (kind !== 'year') {
    const swapped = swapDigits(value)
    if (swapped !== null) add(readingFor(kind, swapped))
  }

  add(discouragedForm(reading))

  // Neighbours last, shuffled so the same question does not always offer the
  // same near miss.
  const bound = upperBound(kind)
  const neighbours = [value - 1, value + 1, value - 10, value + 10].filter(
    (n) => n >= MIN && n <= bound,
  )
  for (const n of shuffle(neighbours, rng)) add(readingFor(kind, n))

  return out
}

export const NUMBER_OPTION_COUNT = 4

export type NumberQuestion = {
  prompt: NumberPrompt
  /** Four distinct readings including the correct one, already shuffled. */
  options: string[]
}

export function buildNumberQuestion(prompt: NumberPrompt, rng: Rng): NumberQuestion {
  const wrong = plausibleWrongReadings(prompt, rng)

  // A year question has only six values in range, so the plausible list can run
  // short. Anything in range fills the rest; `add` semantics keep it distinct.
  if (wrong.length < NUMBER_OPTION_COUNT - 1) {
    const bound = upperBound(prompt.kind)
    const all = Array.from({ length: bound }, (_, i) => i + 1)
    for (const n of shuffle(all, rng)) {
      if (wrong.length >= NUMBER_OPTION_COUNT - 1) break
      const candidate = readingFor(prompt.kind, n)
      if (candidate !== prompt.reading && !wrong.includes(candidate)) {
        wrong.push(candidate)
      }
    }
  }

  const options = shuffle(
    [prompt.reading, ...wrong.slice(0, NUMBER_OPTION_COUNT - 1)],
    rng,
  )
  return { prompt, options }
}

/**
 * The shape of a round.
 *
 * The range is generative and unbounded in a way a character set is not, so a
 * round is a SAMPLE rather than an enumeration — there is no "one question per
 * item" to fall back on. Fixed proportions rather than a random draw per
 * question, so every round actually exercises all three forms: a uniform draw
 * would regularly produce a round with no ages in it, and the age irregulars
 * are the hardest part of the whole topic.
 */
export const ROUND_SHAPE: readonly { kind: NumberDrillKind; count: number }[] = [
  { kind: 'count', count: 5 },
  { kind: 'age', count: 4 },
  { kind: 'year', count: 3 },
]

/** Distinct values for one kind, sampled without replacement. */
function sample(kind: NumberDrillKind, count: number, rng: Rng): number[] {
  const bound = upperBound(kind)
  const all = Array.from({ length: bound }, (_, i) => i + 1)
  return shuffle(all, rng).slice(0, Math.min(count, bound))
}

export function buildNumberRound(rng: Rng): NumberQuestion[] {
  const prompts = ROUND_SHAPE.flatMap(({ kind, count }) =>
    sample(kind, count, rng).map((value) => promptFor(kind, value)),
  )
  return shuffle(prompts, rng).map((prompt) => buildNumberQuestion(prompt, rng))
}
