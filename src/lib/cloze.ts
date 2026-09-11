import type { ClozeItem, ClozeKind } from '../types/grammar'
import { shuffle, type Rng } from './shuffle'

/**
 * The grammar cloze (CLAUDE.md §11.7).
 *
 * Pure functions with an injected `rng`, no React, exactly as `quiz.ts`,
 * `vocabQuiz.ts` and `numbers.ts` are.
 */

/**
 * A set of forms that fill the same slot, and whether they MEAN the same thing.
 *
 * Two different questions are tangled up here and Week 1 contains both:
 *
 *   - **じゃないです and ではありません are interchangeable.** Either is a correct
 *     answer to "I am not a teacher". Offering both would make the question
 *     unanswerable, and a learner who picks the one the data did not choose is
 *     not wrong — so the reveal says so.
 *   - **です and だ are NOT interchangeable.** Both fill the slot grammatically,
 *     but だ is the plain form and every sentence in this drill is polite. They
 *     must not be offered together, because "which one is correct" would then
 *     depend on a register the prompt never states — but だ is a perfectly good
 *     wrong answer next to でした, and the reveal must NOT call it equally
 *     correct.
 *
 * So "never offer together" and "equally correct" are separate facts, and
 * collapsing them into one list would get one of the two pairs wrong.
 */
type FormGroup = {
  forms: readonly string[]
  /** True when every form here means the same thing at the same politeness. */
  interchangeable: boolean
}

/**
 * The four particles Week 1 teaches, and no others.
 *
 * が, に, で and も are not here on purpose: a distractor the class has not
 * taught tests whether you recognise an unknown, not whether you know は from
 * の. With exactly four, every particle question offers the whole taught set —
 * which is the real choice a learner faces anyway.
 */
const PARTICLE_GROUPS: readonly FormGroup[] = [
  { forms: ['は'], interchangeable: false },
  { forms: ['の'], interchangeable: false },
  { forms: ['を'], interchangeable: false },
  { forms: ['か'], interchangeable: false },
]

/** です across present/past and affirmative/negative, plus the plain form. */
const COPULA_GROUPS: readonly FormGroup[] = [
  { forms: ['です', 'だ'], interchangeable: false },
  { forms: ['でした'], interchangeable: false },
  { forms: ['じゃないです', 'ではありません'], interchangeable: true },
  { forms: ['じゃなかったです', 'ではありませんでした'], interchangeable: true },
]

export const CLOZE_OPTION_COUNT = 4

function groupsFor(kind: ClozeKind): readonly FormGroup[] {
  return kind === 'particle' ? PARTICLE_GROUPS : COPULA_GROUPS
}

function groupOf(kind: ClozeKind, form: string): FormGroup | undefined {
  return groupsFor(kind).find((group) => group.forms.includes(form))
}

/**
 * The other forms that would have been just as correct.
 *
 * Empty unless the answer sits in an interchangeable group — so です returns
 * nothing even though it shares a group with だ, which is the whole reason
 * `interchangeable` exists.
 */
export function alsoCorrect(item: ClozeItem): string[] {
  const group = groupOf(item.kind, item.answer)
  if (group === undefined || !group.interchangeable) return []
  return group.forms.filter((form) => form !== item.answer)
}

export type ClozeQuestion = {
  item: ClozeItem
  /** Four forms including the answer, already shuffled. */
  options: string[]
}

/**
 * One option per group, which is what guarantees four distinct, individually
 * defensible options without any retry loop.
 *
 * Both pools happen to hold exactly four groups today, so every question offers
 * the whole taught set. If a later week adds a fifth, the groups are shuffled
 * and three are taken — the shape does not change.
 */
export function clozeOptions(item: ClozeItem, rng: Rng): string[] {
  const groups = groupsFor(item.kind)
  const answerGroup = groupOf(item.kind, item.answer)

  const others = shuffle(
    groups.filter((group) => group !== answerGroup),
    rng,
  )

  const distractors: string[] = []
  for (const group of others) {
    if (distractors.length >= CLOZE_OPTION_COUNT - 1) break
    // One form from the group, chosen at random, so ではありません and
    // じゃないです take turns appearing rather than one always standing in.
    const pick = shuffle(group.forms, rng)[0]
    if (pick !== undefined) distractors.push(pick)
  }

  return shuffle([item.answer, ...distractors], rng)
}

export function buildClozeQuestion(item: ClozeItem, rng: Rng): ClozeQuestion {
  return { item, options: clozeOptions(item, rng) }
}

/**
 * Every pattern, shuffled — one question each.
 *
 * A round is an enumeration here, not a sample. Unlike the numbers, the
 * patterns are a finite authored list, and there are few enough that leaving
 * one out would mean the drill skipped something the class taught.
 *
 * です and の are NOT separated into their own rounds. Telling them apart is the
 * skill: わたし___がくせいです takes は, わたし___ほん takes の, and a round that
 * announced which topic it was drilling would answer half of that in advance.
 */
export function buildClozeRound(
  items: readonly ClozeItem[],
  rng: Rng,
): ClozeQuestion[] {
  return shuffle(items, rng).map((item) => buildClozeQuestion(item, rng))
}
