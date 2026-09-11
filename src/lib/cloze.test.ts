import { describe, expect, it } from 'vitest'
import {
  alsoCorrect,
  buildClozeQuestion,
  buildClozeRound,
  clozeOptions,
  CLOZE_OPTION_COUNT,
} from './cloze'
import type { Rng } from './shuffle'
import { CLOZE_ITEMS } from '../grammar/registry'
import { BLANK, type ClozeItem } from '../types/grammar'

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

const byId = (id: string): ClozeItem => {
  const found = CLOZE_ITEMS.find((item) => item.id === id)
  if (!found) throw new Error(`no cloze item "${id}"`)
  return found
}

describe('the cloze data', () => {
  it('gives every item a unique id', () => {
    const ids = CLOZE_ITEMS.map((item) => item.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  /** One blank. Two would make the question ambiguous; none would make it free. */
  it('puts exactly one blank in every sentence', () => {
    for (const item of CLOZE_ITEMS) {
      expect(item.kana.split(BLANK), item.id).toHaveLength(2)
    }
  })

  /**
   * THE BLANK IS NEVER THE NOUN (CLAUDE.md §11.7). A cloze over the noun is a
   * vocabulary question wearing a grammar question's clothes, and the
   * vocabulary quiz asks that better.
   */
  it('only ever blanks a particle or a copula', () => {
    const PARTICLES = ['は', 'の', 'を', 'か']
    const COPULAS = [
      'です',
      'でした',
      'じゃないです',
      'ではありません',
      'じゃなかったです',
      'ではありませんでした',
    ]

    for (const item of CLOZE_ITEMS) {
      const allowed = item.kind === 'particle' ? PARTICLES : COPULAS
      expect(allowed, `${item.id} answers "${item.answer}"`).toContain(item.answer)
    }
  })

  it('carries a meaning and a reason for every item', () => {
    for (const item of CLOZE_ITEMS) {
      expect(item.english.trim(), item.id).not.toBe('')
      expect(item.note.trim(), item.id).not.toBe('')
      expect(item.romaji.trim(), item.id).not.toBe('')
    }
  })

  /**
   * The sentence with its blank filled must be what the romaji transcribes —
   * otherwise the reveal contradicts the prompt. Checked through the kana,
   * since the romaji is spaced and the kana is not.
   */
  it('fills the blank to a sentence with no gap left in it', () => {
    for (const item of CLOZE_ITEMS) {
      const filled = item.kana.replace(BLANK, item.answer)
      expect(filled.includes(BLANK), item.id).toBe(false)
      expect(filled.includes(item.answer), item.id).toBe(true)
    }
  })

  it('exercises both of Week 1’s grammar points', () => {
    const topics = new Set(CLOZE_ITEMS.map((item) => item.topic))
    expect([...topics].sort()).toEqual(['desu', 'no'])
  })
})

describe('interchangeable forms', () => {
  /**
   * じゃないです and ではありません both answer "I am not a teacher", so a
   * learner who picks the other one is not wrong and the reveal must say so.
   */
  it('names the equally correct form for a negative', () => {
    expect(alsoCorrect(byId('jpst100:w1:cloze:ja-nai-desu'))).toEqual([
      'ではありません',
    ])
    expect(alsoCorrect(byId('jpst100:w1:cloze:ja-nakatta-desu'))).toEqual([
      'ではありませんでした',
    ])
  })

  /**
   * THE ONE THAT WOULD BE WRONG TO CONFLATE. だ fills the same slot as です and
   * must never be offered beside it — but it is the plain form, and every
   * sentence in this drill is polite, so it is NOT equally correct.
   */
  it('does not call だ an equally correct です', () => {
    expect(alsoCorrect(byId('jpst100:w1:cloze:desu-present'))).toEqual([])
  })

  it('says nothing extra for a particle', () => {
    expect(alsoCorrect(byId('jpst100:w1:cloze:wa-topic'))).toEqual([])
  })
})

describe('options', () => {
  it('always offers four distinct forms, one of them the answer', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const item of CLOZE_ITEMS) {
        const options = clozeOptions(item, seeded(seed))
        expect(options, item.id).toHaveLength(CLOZE_OPTION_COUNT)
        expect(new Set(options).size, item.id).toBe(CLOZE_OPTION_COUNT)
        expect(options, item.id).toContain(item.answer)
      }
    }
  })

  /**
   * A question offering both halves of an interchangeable pair has two right
   * answers. This is the vocabulary quiz's casual/polite collision again, in a
   * different alphabet.
   */
  it('never offers two forms that mean the same thing', () => {
    const PAIRS = [
      ['じゃないです', 'ではありません'],
      ['じゃなかったです', 'ではありませんでした'],
    ]

    for (let seed = 0; seed < 50; seed++) {
      for (const item of CLOZE_ITEMS) {
        const options = clozeOptions(item, seeded(seed))
        for (const [a, b] of PAIRS) {
          expect(
            options.includes(a as string) && options.includes(b as string),
            `${item.id}, seed ${seed}`,
          ).toBe(false)
        }
      }
    }
  })

  /** だ beside です would make the answer depend on a register never stated. */
  it('never offers だ beside です', () => {
    for (let seed = 0; seed < 50; seed++) {
      for (const item of CLOZE_ITEMS) {
        const options = clozeOptions(item, seeded(seed))
        expect(options.includes('です') && options.includes('だ')).toBe(false)
      }
    }
  })

  it('offers particles for a particle blank and copulas for a copula blank', () => {
    const PARTICLES = ['は', 'の', 'を', 'か']

    for (let seed = 0; seed < 20; seed++) {
      for (const item of CLOZE_ITEMS) {
        const options = clozeOptions(item, seeded(seed))
        const allParticles = options.every((o) => PARTICLES.includes(o))
        expect(allParticles, `${item.id}: ${options.join(' ')}`).toBe(
          item.kind === 'particle',
        )
      }
    }
  })

  /** Both halves of a pair should take turns, not one always standing in. */
  it('varies which half of a pair appears', () => {
    const seen = new Set<string>()
    const desu = byId('jpst100:w1:cloze:desu-present')

    for (let seed = 0; seed < 40; seed++) {
      for (const option of clozeOptions(desu, seeded(seed))) {
        if (option === 'じゃないです' || option === 'ではありません') seen.add(option)
      }
    }
    expect(seen.size).toBe(2)
  })
})

describe('a round', () => {
  it('asks every pattern exactly once', () => {
    for (let seed = 0; seed < 10; seed++) {
      const round = buildClozeRound(CLOZE_ITEMS, seeded(seed))
      expect(round).toHaveLength(CLOZE_ITEMS.length)
      expect(new Set(round.map((q) => q.item.id)).size).toBe(CLOZE_ITEMS.length)
    }
  })

  /**
   * です and の are mixed rather than separated. Telling them apart IS the
   * skill, and a round that announced its topic would answer half of it.
   */
  it('mixes the two topics rather than grouping them', () => {
    const topics = buildClozeRound(CLOZE_ITEMS, seeded(2)).map((q) => q.item.topic)
    const runs = topics.filter((topic, i) => topic !== topics[i - 1]).length
    expect(runs).toBeGreaterThan(2)
  })

  it('builds a question that holds together', () => {
    const item = byId('jpst100:w1:cloze:o-object')
    const question = buildClozeQuestion(item, seeded(5))
    expect(question.item).toBe(item)
    expect(question.options).toContain('を')
  })
})
