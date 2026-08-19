import { describe, expect, it } from 'vitest'
import {
  buildQuestion,
  buildRound,
  displayValue,
  distractorsFor,
  OPTION_COUNT,
  type QuizQuestion,
} from './quiz'
import type { Rng } from './shuffle'
import { allCharacters, DEFAULT_CHARACTER_SET } from '../characters/registry'
import type { Character } from '../types/characters'

const ALL = allCharacters(DEFAULT_CHARACTER_SET)

const byRomaji = (romaji: string): Character => {
  const found = ALL.find((c) => c.romaji === romaji)
  if (!found) throw new Error(`No character with romaji "${romaji}"`)
  return found
}
const byGlyph = (glyph: string): Character => {
  const found = ALL.find((c) => c.glyph === glyph)
  if (!found) throw new Error(`No character with glyph "${glyph}"`)
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

const KA = byRomaji('ka')
const O = byGlyph('お')
const WO = byGlyph('を')

describe('buildQuestion', () => {
  it('always offers four options, one of which is the answer', () => {
    const rng = seeded(1)
    for (let i = 0; i < 50; i++) {
      const answer = ALL[i % ALL.length]
      if (!answer) continue
      const q = buildQuestion(answer, ALL, ALL, rng)
      expect(q.options).toHaveLength(OPTION_COUNT)
      expect(q.options.map((o) => o.id)).toContain(answer.id)
    }
  })

  it('never shows the same value twice among the options', () => {
    const rng = seeded(7)
    for (let i = 0; i < 200; i++) {
      const answer = ALL[i % ALL.length]
      if (!answer) continue
      const q = buildQuestion(answer, ALL, ALL, rng)
      const shown = q.options.map((o) => displayValue(o, q.direction))
      expect(new Set(shown).size).toBe(shown.length)
    }
  })

  /**
   * Both directions must actually occur. A 50/50 that silently became 100/0
   * would still pass every other test here while halving the exercise.
   */
  it('mixes both directions over a round', () => {
    const rng = seeded(3)
    const directions = new Set(
      Array.from({ length: 60 }, () => buildQuestion(KA, ALL, ALL, rng).direction),
    )
    expect(directions).toEqual(new Set(['glyph-to-romaji', 'romaji-to-glyph']))
  })
})

/**
 * THE お/を RULE (CLAUDE.md §6). Both are pronounced "o", so a question holding
 * both is unanswerable in one direction and ambiguous in the other.
 */
describe('the romaji collision', () => {
  it('never puts を in a question about お', () => {
    const rng = seeded(11)
    for (let i = 0; i < 200; i++) {
      const q = buildQuestion(O, ALL, ALL, rng)
      expect(q.options.map((o) => o.glyph)).not.toContain('を')
    }
  })

  it('never puts お in a question about を', () => {
    const rng = seeded(13)
    for (let i = 0; i < 200; i++) {
      const q = buildQuestion(WO, ALL, ALL, rng)
      expect(q.options.map((o) => o.glyph)).not.toContain('お')
    }
  })

  /**
   * The subtler half: when the answer is neither, both お and を are eligible
   * distractors and could be drawn together — showing "o" twice in a question
   * that has nothing to do with either.
   */
  it('never draws お and を as distractors for some third character', () => {
    const rng = seeded(17)
    for (let i = 0; i < 400; i++) {
      const answer = ALL[i % ALL.length]
      if (!answer || answer.romaji === 'o') continue
      const glyphs = buildQuestion(answer, ALL, ALL, rng).options.map((o) => o.glyph)
      expect(glyphs.includes('お') && glyphs.includes('を')).toBe(false)
    }
  })
})

describe('distractor sourcing', () => {
  /**
   * Same row first is the whole point: さ/ち, ぬ/め and れ/わ/ね are the
   * confusions a beginner actually has. Random distractors test luck rather
   * than discrimination.
   */
  it('prefers the answer’s own row', () => {
    const distractors = distractorsFor(KA, ALL, ALL, seeded(5))
    expect(distractors).toHaveLength(3)
    expect(distractors.every((d) => d.rowId === KA.rowId)).toBe(true)
  })

  it('falls through to the same vowel once the row runs out', () => {
    // The や-row holds three characters, so one distractor must come from
    // beyond it — and the next preference is the shared vowel.
    const ya = byGlyph('や')
    const distractors = distractorsFor(ya, ALL, ALL, seeded(9))
    const beyondRow = distractors.filter((d) => d.rowId !== ya.rowId)
    expect(beyondRow.length).toBeGreaterThan(0)
    expect(beyondRow.every((d) => d.vowel === ya.vowel)).toBe(true)
  })

  it('draws from the deck before the full set', () => {
    // A deck of five unrelated characters: every distractor should come from
    // it, even though the full set has same-row candidates on offer.
    const deck = [KA, byGlyph('み'), byGlyph('ぬ'), byGlyph('へ'), byGlyph('ろ')]
    const distractors = distractorsFor(KA, deck, ALL, seeded(21))
    const deckIds = new Set(deck.map((c) => c.id))
    expect(distractors.every((d) => deckIds.has(d.id))).toBe(true)
  })

  /**
   * A two-character deck cannot fill four options from itself, and a question
   * with two options is not a question. This is why the full-set fallback
   * exists at all.
   */
  it('still produces four distinct options from a two-character deck', () => {
    const deck = [KA, byGlyph('ぬ')]
    const rng = seeded(23)
    for (let i = 0; i < 50; i++) {
      const q = buildQuestion(KA, deck, ALL, rng)
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options.map((o) => o.id)).size).toBe(4)
    }
  })

  it('copes with a single-character deck', () => {
    const q = buildQuestion(KA, [KA], ALL, seeded(29))
    expect(q.options).toHaveLength(4)
    expect(new Set(q.options.map((o) => o.id)).size).toBe(4)
  })

  it('never offers the answer twice', () => {
    const rng = seeded(31)
    for (let i = 0; i < 200; i++) {
      const answer = ALL[i % ALL.length]
      if (!answer) continue
      const q = buildQuestion(answer, ALL, ALL, rng)
      expect(q.options.filter((o) => o.id === answer.id)).toHaveLength(1)
    }
  })
})

describe('buildRound', () => {
  it('asks about every character in the deck, exactly once', () => {
    const deck = ALL.slice(0, 10)
    const round = buildRound(deck, ALL, seeded(41))

    expect(round).toHaveLength(deck.length)
    expect(new Set(round.map((q) => q.answer.id))).toEqual(
      new Set(deck.map((c) => c.id)),
    )
  })

  it('does not ask them in deck order', () => {
    const deck = ALL.slice(0, 20)
    const round = buildRound(deck, ALL, seeded(43))
    expect(round.map((q) => q.answer.id)).not.toEqual(deck.map((c) => c.id))
  })

  it('produces a valid question for every character in the set', () => {
    const round: QuizQuestion[] = buildRound(ALL, ALL, seeded(47))
    for (const q of round) {
      expect(q.options).toHaveLength(4)
      const shown = q.options.map((o) => displayValue(o, q.direction))
      expect(new Set(shown).size).toBe(4)
      expect(q.options.map((o) => o.id)).toContain(q.answer.id)
    }
  })
})
