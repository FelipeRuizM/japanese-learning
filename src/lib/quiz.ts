import type { Character } from '../types/characters'
import { shuffle, type Rng } from './shuffle'

/**
 * The quiz (CLAUDE.md §6).
 *
 * Pure functions with an injected `rng`, no React. The UI renders what this
 * returns and holds no question logic.
 */

export type QuizDirection = 'glyph-to-romaji' | 'romaji-to-glyph'

export type QuizQuestion = {
  direction: QuizDirection
  /** The character being asked about — the correct option. */
  answer: Character
  /** Four options including the answer, already shuffled. */
  options: Character[]
}

export const OPTION_COUNT = 4

/**
 * What an option SHOWS in a given direction. Two options that would display
 * the same thing make a question unanswerable, so this is the identity that
 * matters, not the character id.
 */
export function displayValue(character: Character, direction: QuizDirection): string {
  return direction === 'glyph-to-romaji' ? character.romaji : character.glyph
}

/**
 * Two characters that cannot appear in the same question.
 *
 * お and を are both pronounced "o" (CLAUDE.md §3.3), and that breaks BOTH
 * directions, not one:
 *
 *   - glyph→romaji: two options would read "o", and both would be correct.
 *   - romaji→glyph: the prompt "o" matches two of the options shown.
 *
 * Keyed on romaji rather than on the specific pair, so a future set that
 * introduces another homophone is handled without editing this.
 */
function collides(a: Character, b: Character): boolean {
  return a.romaji === b.romaji
}

/**
 * Order candidates by how confusable they are with the answer.
 *
 * Same row first — さ/ち, ぬ/め and れ/わ/ね are the confusions a beginner
 * actually has. Random distractors test luck instead of discrimination, which
 * is the whole reason this function exists rather than a `shuffle().slice(0,3)`.
 *
 * Shuffled WITHIN each band, so the same question does not produce the same
 * three distractors every time.
 */
function byConfusability(
  candidates: readonly Character[],
  answer: Character,
  rng: Rng,
): Character[] {
  const sameRow = candidates.filter((c) => c.rowId === answer.rowId)
  const sameVowel = candidates.filter(
    (c) => c.rowId !== answer.rowId && c.vowel !== null && c.vowel === answer.vowel,
  )
  const rest = candidates.filter(
    (c) => c.rowId !== answer.rowId && !(c.vowel !== null && c.vowel === answer.vowel),
  )

  return [...shuffle(sameRow, rng), ...shuffle(sameVowel, rng), ...shuffle(rest, rng)]
}

/**
 * Three distractors for one answer.
 *
 * Sourced from the DECK first and only then from the full set. The fallback is
 * not a nicety: a two-character deck cannot fill four options from itself, and
 * a question with two options is not a question.
 */
export function distractorsFor(
  answer: Character,
  deck: readonly Character[],
  all: readonly Character[],
  rng: Rng,
  count = OPTION_COUNT - 1,
): Character[] {
  const picked: Character[] = []
  const taken = new Set<string>([answer.id])

  const admit = (candidates: readonly Character[]) => {
    for (const candidate of candidates) {
      if (picked.length >= count) return
      if (taken.has(candidate.id)) continue
      // Against the answer AND against everything already picked: otherwise a
      // question whose answer is neither お nor を could still draw both of
      // them as distractors and show the same value twice.
      if (collides(candidate, answer)) continue
      if (picked.some((chosen) => collides(candidate, chosen))) continue
      picked.push(candidate)
      taken.add(candidate.id)
    }
  }

  admit(byConfusability(deck, answer, rng))
  if (picked.length < count) admit(byConfusability(all, answer, rng))

  return picked
}

export function buildQuestion(
  answer: Character,
  deck: readonly Character[],
  all: readonly Character[],
  rng: Rng,
): QuizQuestion {
  // Chosen per question, not per round: the point is that a learner cannot
  // settle into one direction (CLAUDE.md §6).
  const direction: QuizDirection = rng() < 0.5 ? 'glyph-to-romaji' : 'romaji-to-glyph'
  const options = shuffle([answer, ...distractorsFor(answer, deck, all, rng)], rng)
  return { direction, answer, options }
}

/** The deck, shuffled, one question per character. */
export function buildRound(
  deck: readonly Character[],
  all: readonly Character[],
  rng: Rng,
): QuizQuestion[] {
  return shuffle(deck, rng).map((character) => buildQuestion(character, deck, all, rng))
}
