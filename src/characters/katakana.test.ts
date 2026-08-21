import { describe, expect, it } from 'vitest'
import { HIRAGANA } from './hiragana'
import { KATAKANA } from './katakana'
import { allCharacters } from './registry'

const characters = allCharacters(KATAKANA)

/**
 * The katakana letter block, U+30A1 (ァ) through U+30F6 (ヶ), PLUS the prolonged
 * sound mark ー (U+30FC).
 *
 * ー is the one deliberate difference from the hiragana rule, and it is not a
 * loophole: this script writes a long vowel with that mark where the other
 * doubles the vowel, so コーヒー is the correct spelling and コオヒイ is not.
 * The interpunct ・ and the half-width forms stay out.
 */
const KATAKANA_ONLY = /^[ァ-ヶー]+$/

describe('the katakana gojūon', () => {
  it('has all 71 characters — 46 gojūon, 20 dakuten, 5 handakuten', () => {
    expect(characters).toHaveLength(71)
  })

  it('lays out sixteen rows against five vowel columns', () => {
    expect(KATAKANA.columns).toEqual(['a', 'i', 'u', 'e', 'o'])
    expect(KATAKANA.rows).toHaveLength(16)
    for (const row of KATAKANA.rows) {
      expect(row.cells).toHaveLength(KATAKANA.columns.length)
    }
  })

  it('keeps the gaps as real gaps rather than dropping them', () => {
    const gapsIn = (rowId: string) =>
      KATAKANA.rows.find((r) => r.id === rowId)?.cells.filter((c) => c === null).length

    // No yi, no ye.
    expect(gapsIn('y')).toBe(2)
    // No wi, wu, we.
    expect(gapsIn('w')).toBe(3)
    // ン occupies one position; the rest of its row is empty.
    expect(gapsIn('nn')).toBe(4)

    for (const rowId of ['g', 'z', 'd', 'b', 'p']) expect(gapsIn(rowId)).toBe(0)
  })

  it('gives every character a unique id and a unique glyph', () => {
    expect(new Set(characters.map((c) => c.id)).size).toBe(71)
    expect(new Set(characters.map((c) => c.glyph)).size).toBe(71)
  })

  /**
   * The same three homophone pairs as the other kana chart, for the same
   * reasons: ヲ is the object particle, ヂ and ヅ are the voiced forms that
   * merged in pronunciation. Pinned so a fourth cannot appear unnoticed — the
   * quiz has to keep two same-romaji characters out of one question (§6).
   */
  it('has exactly three romaji collisions, all of them real homophones', () => {
    const byRomaji = new Map<string, string[]>()
    for (const character of characters) {
      byRomaji.set(character.romaji, [
        ...(byRomaji.get(character.romaji) ?? []),
        character.glyph,
      ])
    }

    const collisions = [...byRomaji.entries()]
      .filter(([, glyphs]) => glyphs.length > 1)
      .map(([romaji, glyphs]) => [romaji, [...glyphs].sort().join('')])
      .sort()

    expect(collisions).toEqual(
      [
        ['ji', ['ジ', 'ヂ'].sort().join('')],
        ['o', ['オ', 'ヲ'].sort().join('')],
        ['zu', ['ズ', 'ヅ'].sort().join('')],
      ].sort(),
    )
  })

  it('distinguishes the homophones by their written form in the id', () => {
    const idOf = (glyph: string) => characters.find((c) => c.glyph === glyph)?.id
    expect(idOf('ジ')).toBe('katakana:ji')
    expect(idOf('ヂ')).toBe('katakana:di')
    expect(idOf('ズ')).toBe('katakana:zu')
    expect(idOf('ヅ')).toBe('katakana:du')
    expect(idOf('ヲ')).toBe('katakana:wo')
  })

  it('gives every row a distinct label', () => {
    const labels = KATAKANA.rows.map((row) => row.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('gives ン no vowel, and every other character one', () => {
    const withoutVowel = characters.filter((c) => c.vowel === null)
    expect(withoutVowel.map((c) => c.glyph)).toEqual(['ン'])
  })

  it('places every character in the column its vowel names', () => {
    for (const row of KATAKANA.rows) {
      row.cells.forEach((cell, index) => {
        if (cell === null || cell.vowel === null) return
        expect(cell.vowel).toBe(KATAKANA.columns[index])
      })
    }
  })
})

/**
 * The two charts are the same chart in two scripts. These are the tests that
 * keep them that way — a row added to one and not the other, or a Hepburn
 * reading that drifted, would put the same sound in two different places and
 * quietly teach the wrong thing.
 */
describe('the two kana charts line up', () => {
  const hiragana = allCharacters(HIRAGANA)

  it('has the same rows, in the same order, with the same labels', () => {
    expect(KATAKANA.rows.map((r) => [r.id, r.label])).toEqual(
      HIRAGANA.rows.map((r) => [r.id, r.label]),
    )
  })

  it('pairs every character with a same-sounding one in the other script', () => {
    // Keyed on the ID SUFFIX — the written form — rather than on the romaji,
    // because the romaji is what collides (ji, zu, o). Same suffix, same cell
    // of the chart, same reading.
    const suffix = (id: string) => id.split(':')[1]
    expect(characters.map((c) => suffix(c.id))).toEqual(
      hiragana.map((c) => suffix(c.id)),
    )

    const readingOf = new Map(hiragana.map((c) => [suffix(c.id), c.romaji]))
    for (const character of characters) {
      expect(
        character.romaji,
        `${character.glyph} reads "${character.romaji}" but its twin does not`,
      ).toBe(readingOf.get(suffix(character.id)))
    }
  })

  it('shares no glyph and no id between the two scripts', () => {
    const glyphs = new Set(hiragana.map((c) => c.glyph))
    const ids = new Set(hiragana.map((c) => c.id))
    for (const character of characters) {
      expect(glyphs.has(character.glyph)).toBe(false)
      expect(ids.has(character.id)).toBe(false)
    }
  })
})

describe('katakana example words', () => {
  it('gives every character at least one', () => {
    for (const character of characters) {
      expect(character.examples.length).toBeGreaterThanOrEqual(1)
    }
  })

  it('always contains the character it illustrates', () => {
    for (const character of characters) {
      for (const example of character.examples) {
        expect(
          example.kana.includes(character.glyph),
          `${character.glyph} (${character.romaji}): "${example.kana}" does not contain it`,
        ).toBe(true)
      }
    }
  })

  it('is written in katakana only — a beginner cannot read kanji', () => {
    for (const character of characters) {
      for (const example of character.examples) {
        expect(
          KATAKANA_ONLY.test(example.kana),
          `${character.glyph}: "${example.kana}" contains non-katakana`,
        ).toBe(true)
      }
    }
  })

  it('carries romaji and an English meaning for each', () => {
    for (const character of characters) {
      for (const example of character.examples) {
        expect(example.romaji.trim()).not.toBe('')
        expect(example.english.trim()).not.toBe('')
      }
    }
  })

  /**
   * The three documented exceptions (CLAUDE.md §3.4), pinned so a later tidy-up
   * cannot quietly "fix" them into something wrong. ヲ is a particle with no
   * word to sit in; ヂ and ヅ appear in no loanword at all, so their examples
   * are the archaic and the culinary spellings where they genuinely survive.
   */
  it('handles ヲ, ヂ and ヅ with the spellings where they really occur', () => {
    const exampleFor = (id: string) =>
      characters.find((c) => c.id === id)?.examples[0]?.kana

    expect(exampleFor('katakana:wo')).toBe('ホンヲヨム')
    expect(exampleFor('katakana:di')).toBe('ラヂオ')
    expect(exampleFor('katakana:du')).toBe('ヅケ')
  })

  it('uses ー for a long vowel rather than doubling it', () => {
    const ko = characters.find((c) => c.id === 'katakana:ko')
    expect(ko?.examples[0]?.kana).toBe('コーヒー')
  })

  it('never starts a word with ン', () => {
    const n = characters.find((c) => c.id === 'katakana:nn')
    expect(n?.examples[0]?.kana).toBe('ラーメン')
    expect(n?.examples[0]?.kana.startsWith('ン')).toBe(false)
  })
})
