import type { VocabEntry } from '../types/vocab'
import { shuffle, type Rng } from './shuffle'

/**
 * The vocabulary quiz (CLAUDE.md §11.6).
 *
 * The sibling of `quiz.ts`, and deliberately a separate module rather than a
 * generalisation of it. The two share a SHAPE — four options, a direction
 * chosen per question, distractors tiered by confusability — and share nothing
 * else. The character quiz tiers on `rowId` and `vowel`; this one tiers on the
 * group a word was taught in. Making one module serve both would mean passing
 * in the tiering, the collision rule and the display rule, at which point the
 * "shared" module is a parameter list with a shuffle in it.
 *
 * Pure functions with an injected `rng`, no React. The UI renders what this
 * returns and holds no question logic.
 */

export type VocabQuizDirection = 'kana-to-english' | 'english-to-kana'

export type VocabQuizQuestion = {
  direction: VocabQuizDirection
  /** The item being asked about — the correct option. */
  answer: VocabEntry
  /** Four options including the answer, already shuffled. */
  options: VocabEntry[]
}

export const VOCAB_OPTION_COUNT = 4

/**
 * What an option SHOWS in a given direction. Two options that would display the
 * same thing make a question unanswerable, so this is the identity that
 * matters, not the item id.
 */
export function vocabDisplayValue(
  entry: VocabEntry,
  direction: VocabQuizDirection,
): string {
  return direction === 'kana-to-english' ? entry.item.english : entry.item.kana
}

/**
 * Two items that cannot appear in the same question.
 *
 * おはよう and おはようございます both mean "Good morning"; so do ありがとう and
 * ありがとうございます (CLAUDE.md §11.2). Like the お/を collision in the
 * character quiz, this breaks BOTH directions rather than one:
 *
 *   - kana→English: two options would read "Good morning", and both are right.
 *   - English→kana: the prompt "Good morning" matches two of the options.
 *
 * Keyed on the DISPLAYED VALUES — English and kana — rather than on the named
 * pairs, so a later week that introduces another casual/polite pair is handled
 * without editing this. That generality is the same bet `collides` made in the
 * character quiz, and that bet paid when katakana arrived with 71 new
 * homophones and the quiz needed no edit at all (§3.5).
 *
 * Romaji is not checked because it is never an option's displayed value; it
 * appears only in the reveal, beside the kana it transcribes.
 */
function collides(a: VocabEntry, b: VocabEntry): boolean {
  return a.item.english === b.item.english || a.item.kana === b.item.kana
}

/**
 * Order candidates by how confusable they are with the answer.
 *
 * Same group first. The groups are the ones the class note is organised into —
 * "Leaving & returning home" holds いってきます, いってらっしゃい, ただいま and
 * おかえりなさい, which are precisely the four a beginner mixes up, and two of
 * them differ by who is speaking rather than by meaning. Random distractors
 * would test luck instead of discrimination.
 *
 * Shuffled WITHIN each band, so the same question does not produce the same
 * three distractors every time.
 */
function byConfusability(
  candidates: readonly VocabEntry[],
  answer: VocabEntry,
  rng: Rng,
): VocabEntry[] {
  const sameGroup = candidates.filter((c) => c.groupId === answer.groupId)
  const rest = candidates.filter((c) => c.groupId !== answer.groupId)

  return [...shuffle(sameGroup, rng), ...shuffle(rest, rng)]
}

/**
 * Three distractors for one answer.
 *
 * Sourced from the chosen SET first and only then from the whole registry. The
 * fallback is not a nicety: a set of three cannot fill four options from
 * itself, and a question with three options is a different question.
 */
export function vocabDistractorsFor(
  answer: VocabEntry,
  scope: readonly VocabEntry[],
  all: readonly VocabEntry[],
  rng: Rng,
  count = VOCAB_OPTION_COUNT - 1,
): VocabEntry[] {
  const picked: VocabEntry[] = []
  const taken = new Set<string>([answer.item.id])

  const admit = (candidates: readonly VocabEntry[]) => {
    for (const candidate of candidates) {
      if (picked.length >= count) return
      if (taken.has(candidate.item.id)) continue
      // Against the answer AND against everything already picked: otherwise a
      // question whose answer is neither おはよう nor おはようございます could
      // still draw both as distractors and show "Good morning" twice.
      if (collides(candidate, answer)) continue
      if (picked.some((chosen) => collides(candidate, chosen))) continue
      picked.push(candidate)
      taken.add(candidate.item.id)
    }
  }

  admit(byConfusability(scope, answer, rng))
  if (picked.length < count) admit(byConfusability(all, answer, rng))

  return picked
}

export function buildVocabQuestion(
  answer: VocabEntry,
  scope: readonly VocabEntry[],
  all: readonly VocabEntry[],
  rng: Rng,
): VocabQuizQuestion {
  // Chosen per question, not per round: the point is that a learner cannot
  // settle into one direction (CLAUDE.md §6).
  const direction: VocabQuizDirection =
    rng() < 0.5 ? 'kana-to-english' : 'english-to-kana'
  const options = shuffle(
    [answer, ...vocabDistractorsFor(answer, scope, all, rng)],
    rng,
  )
  return { direction, answer, options }
}

/** The chosen set, shuffled, one question per item. */
export function buildVocabRound(
  scope: readonly VocabEntry[],
  all: readonly VocabEntry[],
  rng: Rng,
): VocabQuizQuestion[] {
  return shuffle(scope, rng).map((entry) => buildVocabQuestion(entry, scope, all, rng))
}
