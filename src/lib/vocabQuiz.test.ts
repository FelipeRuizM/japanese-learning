import { describe, expect, it } from 'vitest'
import {
  buildVocabQuestion,
  buildVocabRound,
  vocabDisplayValue,
  vocabDistractorsFor,
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

const OHAYOO = byKana('おはよう')
const OHAYOO_POLITE = byKana('おはようございます')
const ARIGATOO = byKana('ありがとう')
const ARIGATOO_POLITE = byKana('ありがとうございます')

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
   * おはよう and おはようございます both mean "Good morning". Putting them in one
   * question makes it unanswerable in both directions at once — two options
   * would read "Good morning", and the prompt "Good morning" would match two
   * options. Same for ありがとう / ありがとうございます.
   */
  it('never puts a casual/polite pair in the same question', () => {
    for (let seed = 0; seed < 60; seed++) {
      const forCasual = vocabDistractorsFor(OHAYOO, scope, ALL, seeded(seed))
      expect(forCasual.map((e) => e.item.kana)).not.toContain('おはようございます')

      const forPolite = vocabDistractorsFor(OHAYOO_POLITE, scope, ALL, seeded(seed))
      expect(forPolite.map((e) => e.item.kana)).not.toContain('おはよう')

      const forThanks = vocabDistractorsFor(ARIGATOO, scope, ALL, seeded(seed))
      expect(forThanks.map((e) => e.item.kana)).not.toContain('ありがとうございます')
    }
  })

  /**
   * The pair must not slip in as two DISTRACTORS either. A question whose
   * answer is いただきます could otherwise draw both おはよう and
   * おはようございます and show "Good morning" twice.
   */
  it('never draws a colliding pair as two distractors', () => {
    for (let seed = 0; seed < 60; seed++) {
      for (const answer of [byKana('いただきます'), byKana('こんにちは')]) {
        const kana = vocabDistractorsFor(answer, scope, ALL, seeded(seed)).map(
          (e) => e.item.kana,
        )
        expect(kana.includes('おはよう') && kana.includes('おはようございます')).toBe(
          false,
        )
        expect(
          kana.includes('ありがとう') && kana.includes('ありがとうございます'),
        ).toBe(false)
      }
    }
  })

  it('prefers the answer’s own group before reaching outside it', () => {
    // "Leaving & returning home" has four items, so all three distractors can
    // and must come from it — those are the four a beginner actually mixes up.
    const tadaima = byKana('ただいま')
    for (let seed = 0; seed < 25; seed++) {
      const picked = vocabDistractorsFor(tadaima, scope, ALL, seeded(seed))
      expect(picked.every((e) => e.groupId === tadaima.groupId)).toBe(true)
    }
  })

  /**
   * A group smaller than four cannot fill a question from itself. "Meals" has
   * exactly two items, so the rest must come from the wider set.
   */
  it('falls outside a group too small to fill the question', () => {
    const meals = byKana('いただきます')
    const picked = vocabDistractorsFor(meals, scope, ALL, seeded(7))
    expect(picked).toHaveLength(3)
    expect(picked.filter((e) => e.groupId === meals.groupId)).toHaveLength(1)
  })

  /**
   * THE SMALL-SCOPE FALLBACK. A set of two cannot fill four options from
   * itself, and a question with two options is not a question — so the whole
   * registry is the last resort.
   */
  it('fills four options from a scope holding only a colliding pair', () => {
    const tiny = [OHAYOO, OHAYOO_POLITE]
    for (let seed = 0; seed < 25; seed++) {
      const question = buildVocabQuestion(OHAYOO, tiny, ALL, seeded(seed))
      expect(question.options).toHaveLength(VOCAB_OPTION_COUNT)

      const shown = question.options.map((o) =>
        vocabDisplayValue(o, question.direction),
      )
      expect(new Set(shown).size).toBe(VOCAB_OPTION_COUNT)
      // The one other item in scope is the one that may never be drawn.
      expect(question.options.map((o) => o.item.kana)).not.toContain(
        'おはようございます',
      )
    }
  })

  it('fills four options even from a scope of one', () => {
    const question = buildVocabQuestion(
      ARIGATOO_POLITE,
      [ARIGATOO_POLITE],
      ALL,
      seeded(3),
    )
    expect(question.options).toHaveLength(VOCAB_OPTION_COUNT)
    expect(question.options.map((o) => o.item.kana)).not.toContain('ありがとう')
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
