import { describe, expect, it } from 'vitest'
import {
  buildVocabQuestion,
  buildVocabRound,
  vocabDisplayValue,
  vocabDistractorsFor,
  roundLength,
  roundSizeOptions,
  VOCAB_OPTION_COUNT,
  type VocabQuizQuestion,
} from './vocabQuiz'
import type { Rng } from './shuffle'
import { VOCAB_SETS, everyVocabEntry, vocabEntries } from '../vocab/registry'
import type { VocabEntry } from '../types/vocab'

const ALL = everyVocabEntry()

const byKana = (kana: string): VocabEntry => {
  const found = ALL.find((e) => e.item.kana === kana)
  if (!found) throw new Error(`No vocabulary item written "${kana}"`)
  return found
}

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

/**
 * THE COLLIDING PAIR. The class note glosses both of these "Thank you for the
 * food", separating them only by when they are said — so they may never be two
 * options in one question (CLAUDE.md §11.2).
 *
 * They also sit in the same group, "Meals", which makes them the sharpest case
 * in the file: the tier that would reach for a distractor first is the tier
 * holding the one item that must never be drawn.
 */
const ITADAKIMASU = byKana('いただきます')
const GOCHISOOSAMA = byKana('ごちそうさまでした')

const OHAYOO = byKana('おはよう')
const KONNICHIWA = byKana('こんにちは')
const GOZEN = byKana('ごぜん')

const firstSet = () => {
  const set = VOCAB_SETS[0]
  if (!set) throw new Error('no vocabulary set is registered')
  return set
}

describe('vocabDisplayValue', () => {
  it('shows the meaning one way and the kana the other', () => {
    expect(vocabDisplayValue(OHAYOO, 'kana-to-english')).toBe(OHAYOO.item.english)
    expect(vocabDisplayValue(OHAYOO, 'english-to-kana')).toBe('おはよう')
  })
})

describe('distractors', () => {
  const scope = vocabEntries(firstSet())

  it('fills the question with three of them', () => {
    for (let seed = 0; seed < 25; seed++) {
      const picked = vocabDistractorsFor(OHAYOO, scope, ALL, seeded(seed))
      expect(picked).toHaveLength(VOCAB_OPTION_COUNT - 1)
    }
  })

  it('never includes the answer itself', () => {
    for (let seed = 0; seed < 25; seed++) {
      const picked = vocabDistractorsFor(OHAYOO, scope, ALL, seeded(seed))
      expect(picked.map((e) => e.item.id)).not.toContain(OHAYOO.item.id)
    }
  })

  /**
   * THE COLLISION RULE (CLAUDE.md §11.2).
   *
   * いただきます and ごちそうさまでした are both glossed "Thank you for the
   * food". Putting them in one question makes it unanswerable in both
   * directions at once — two options would read "Thank you for the food", and
   * the prompt "Thank you for the food" would match two options.
   */
  it('never puts a colliding pair in the same question', () => {
    for (let seed = 0; seed < 60; seed++) {
      const forBefore = vocabDistractorsFor(ITADAKIMASU, scope, ALL, seeded(seed))
      expect(forBefore.map((e) => e.item.kana)).not.toContain('ごちそうさまでした')

      const forAfter = vocabDistractorsFor(GOCHISOOSAMA, scope, ALL, seeded(seed))
      expect(forAfter.map((e) => e.item.kana)).not.toContain('いただきます')
    }
  })

  /**
   * The pair must not slip in as two DISTRACTORS either. A question whose
   * answer is こんにちは could otherwise draw both meal phrases and show
   * "Thank you for the food" twice.
   */
  it('never draws a colliding pair as two distractors', () => {
    for (let seed = 0; seed < 60; seed++) {
      for (const answer of [KONNICHIWA, OHAYOO, GOZEN]) {
        const kana = vocabDistractorsFor(answer, scope, ALL, seeded(seed)).map(
          (e) => e.item.kana,
        )
        expect(
          kana.includes('いただきます') && kana.includes('ごちそうさまでした'),
        ).toBe(false)
      }
    }
  })

  it('prefers the answer’s own group before reaching outside it', () => {
    // "Greetings & set phrases" has seven items, so all three distractors can
    // and must come from it — those are the ones a beginner actually mixes up.
    for (let seed = 0; seed < 25; seed++) {
      const picked = vocabDistractorsFor(OHAYOO, scope, ALL, seeded(seed))
      expect(picked.every((e) => e.groupId === OHAYOO.groupId)).toBe(true)
    }
  })

  /**
   * A group smaller than four cannot fill a question from itself. "Time" has
   * exactly two items, so one distractor comes from the group and the rest
   * from the wider set.
   */
  it('falls outside a group too small to fill the question', () => {
    const picked = vocabDistractorsFor(GOZEN, scope, ALL, seeded(7))
    expect(picked).toHaveLength(3)
    expect(picked.filter((e) => e.groupId === GOZEN.groupId)).toHaveLength(1)
  })

  /**
   * THE HARSHER CASE, and the reason the two rules are not one rule. "Meals"
   * also has two items — but the other one is the answer's collision, so the
   * first tier yields NOTHING and all three distractors come from outside a
   * group that is not empty. A fallback keyed on "is the group big enough"
   * rather than on "how many did we actually get" would ship three options
   * here.
   */
  it('falls outside a group whose only other member collides', () => {
    for (let seed = 0; seed < 25; seed++) {
      const picked = vocabDistractorsFor(ITADAKIMASU, scope, ALL, seeded(seed))
      expect(picked).toHaveLength(3)
      expect(picked.filter((e) => e.groupId === ITADAKIMASU.groupId)).toHaveLength(0)
    }
  })

  /**
   * THE SMALL-SCOPE FALLBACK. A set of two cannot fill four options from
   * itself, and a question with two options is not a question — so the whole
   * registry is the last resort.
   */
  it('fills four options from a scope holding only a colliding pair', () => {
    const tiny = [ITADAKIMASU, GOCHISOOSAMA]
    for (let seed = 0; seed < 25; seed++) {
      const question = buildVocabQuestion(ITADAKIMASU, tiny, ALL, seeded(seed))
      expect(question.options).toHaveLength(VOCAB_OPTION_COUNT)

      const shown = question.options.map((o) =>
        vocabDisplayValue(o, question.direction),
      )
      expect(new Set(shown).size).toBe(VOCAB_OPTION_COUNT)
      // The one other item in scope is the one that may never be drawn.
      expect(question.options.map((o) => o.item.kana)).not.toContain(
        'ごちそうさまでした',
      )
    }
  })

  it('fills four options even from a scope of one', () => {
    const question = buildVocabQuestion(GOCHISOOSAMA, [GOCHISOOSAMA], ALL, seeded(3))
    expect(question.options).toHaveLength(VOCAB_OPTION_COUNT)
    expect(question.options.map((o) => o.item.kana)).not.toContain('いただきます')
  })
})

describe('questions', () => {
  const scope = vocabEntries(firstSet())

  it('always contains the answer, exactly once', () => {
    for (let seed = 0; seed < 40; seed++) {
      const question = buildVocabQuestion(OHAYOO, scope, ALL, seeded(seed))
      const matches = question.options.filter((o) => o.item.id === OHAYOO.item.id)
      expect(matches).toHaveLength(1)
    }
  })

  it('never shows one displayed value twice, in either direction', () => {
    for (let seed = 0; seed < 60; seed++) {
      for (const entry of scope) {
        const question = buildVocabQuestion(entry, scope, ALL, seeded(seed))
        const shown = question.options.map((o) =>
          vocabDisplayValue(o, question.direction),
        )
        expect(new Set(shown).size, `seed ${seed}, ${entry.item.kana}`).toBe(
          shown.length,
        )
      }
    }
  })

  it('asks in both directions', () => {
    const seen = new Set<VocabQuizQuestion['direction']>()
    for (let seed = 0; seed < 40; seed++) {
      seen.add(buildVocabQuestion(OHAYOO, scope, ALL, seeded(seed)).direction)
    }
    expect([...seen].sort()).toEqual(['english-to-kana', 'kana-to-english'])
  })
})

describe('a round', () => {
  it('asks one question per item in the chosen set', () => {
    const scope = vocabEntries(firstSet())
    const round = buildVocabRound(scope, ALL, seeded(1))

    expect(round).toHaveLength(scope.length)
    expect(new Set(round.map((q) => q.answer.item.id)).size).toBe(scope.length)
  })

  it('holds together for every registered set', () => {
    for (const set of VOCAB_SETS) {
      const scope = vocabEntries(set)
      for (let seed = 0; seed < 10; seed++) {
        for (const question of buildVocabRound(scope, ALL, seeded(seed))) {
          expect(question.options).toHaveLength(VOCAB_OPTION_COUNT)
          const shown = question.options.map((o) =>
            vocabDisplayValue(o, question.direction),
          )
          expect(new Set(shown).size, `${set.id}, seed ${seed}`).toBe(
            VOCAB_OPTION_COUNT,
          )
          expect(question.options).toContain(question.answer)
        }
      }
    }
  })
})

describe('round size', () => {
  it('offers only presets the scope can actually fill, then all', () => {
    expect(roundSizeOptions(44)).toEqual([5, 10, 15, 20, 'all'])
    expect(roundSizeOptions(12)).toEqual([5, 10, 'all'])
    expect(roundSizeOptions(7)).toEqual([5, 'all'])
  })

  /**
   * A preset EQUAL to the total is dropped, not kept. `20` beside `All (20)`
   * is two controls doing the same thing, and one of them is about to look
   * wrong when a topic is turned on.
   */
  it('drops a preset that equals the total', () => {
    expect(roundSizeOptions(20)).toEqual([5, 10, 15, 'all'])
    expect(roundSizeOptions(5)).toEqual(['all'])
  })

  /** One option is nothing to choose, and the picker renders nothing. */
  it('leaves a tiny scope with a single option', () => {
    expect(roundSizeOptions(3)).toEqual(['all'])
    expect(roundSizeOptions(0)).toEqual(['all'])
  })

  it('resolves a size against the scope it is applied to', () => {
    expect(roundLength('all', 44)).toBe(44)
    expect(roundLength(10, 44)).toBe(10)
    // Clamped: a stored 20 against a scope of 12 is 12, never a round padded
    // out with words asked twice.
    expect(roundLength(20, 12)).toBe(12)
  })

  it('asks no word twice, however short the round', () => {
    const scope = vocabEntries(firstSet())
    for (let seed = 0; seed < 20; seed++) {
      const round = buildVocabRound(scope, ALL, seeded(seed), 5)
      expect(round).toHaveLength(5)
      expect(new Set(round.map((q) => q.answer.item.id)).size).toBe(5)
    }
  })

  it('asks the whole scope when the limit exceeds it', () => {
    const scope = vocabEntries(firstSet())
    expect(buildVocabRound(scope, ALL, seeded(1), 500)).toHaveLength(scope.length)
  })

  /**
   * SHUFFLE THEN TAKE. Taking before shuffling would deal the same five words
   * every time and make the rest of a week unreachable through a short round —
   * which is the failure a length control exists to avoid, not to cause.
   */
  it('samples the scope rather than taking its first few', () => {
    const scope = vocabEntries(firstSet())
    const drawn = new Set<string>()
    for (let seed = 0; seed < 20; seed++) {
      for (const q of buildVocabRound(scope, ALL, seeded(seed), 5)) {
        drawn.add(q.answer.item.id)
      }
    }
    // Twenty rounds of five over a scope of 44: far more than the five a
    // take-then-shuffle implementation could ever reach.
    expect(drawn.size).toBeGreaterThan(20)
  })

  /**
   * THE LIMIT IS ON THE QUESTIONS, NOT THE DISTRACTORS. A five-question round
   * over a whole week must still draw its wrong answers from the whole week —
   * otherwise the shorter the round, the easier each question gets.
   */
  it('still draws distractors from the whole scope', () => {
    const scope = vocabEntries(firstSet())
    const asked = new Set<string>()
    const offered = new Set<string>()

    for (let seed = 0; seed < 20; seed++) {
      for (const q of buildVocabRound(scope, ALL, seeded(seed), 2)) {
        asked.add(q.answer.item.id)
        for (const option of q.options) offered.add(option.item.id)
      }
    }

    expect(offered.size).toBeGreaterThan(asked.size)
  })
})
