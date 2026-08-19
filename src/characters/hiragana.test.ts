import { describe, expect, it } from 'vitest'
import { HIRAGANA } from './hiragana'
import { allCharacters } from './registry'

const characters = allCharacters(HIRAGANA)

/**
 * The hiragana letter block, U+3041 (ぁ) through U+3096 (ゖ). It covers the
 * small kana (っ ゃ ゅ ょ) and the precomposed dakuten forms (が ぱ), which
 * legitimately appear inside example words.
 *
 * It deliberately EXCLUDES the prolonged sound mark ー (U+30FC), which lives in
 * the katakana block: hiragana words write a long vowel by doubling it
 * (おおきい), so ー appearing here would mean a katakana word slipped in.
 */
const HIRAGANA_ONLY = /^[ぁ-ゖ]+$/

describe('the gojūon', () => {
  it('has all 46 characters', () => {
    expect(characters).toHaveLength(46)
  })

  it('lays out eleven rows against five vowel columns', () => {
    expect(HIRAGANA.columns).toEqual(['a', 'i', 'u', 'e', 'o'])
    expect(HIRAGANA.rows).toHaveLength(11)
    for (const row of HIRAGANA.rows) {
      expect(row.cells).toHaveLength(HIRAGANA.columns.length)
    }
  })

  it('keeps the gaps as real gaps rather than dropping them', () => {
    const gapsIn = (rowId: string) =>
      HIRAGANA.rows.find((r) => r.id === rowId)?.cells.filter((c) => c === null).length

    // No yi, no ye.
    expect(gapsIn('y')).toBe(2)
    // No wi, wu, we.
    expect(gapsIn('w')).toBe(3)
    // ん occupies one position; the rest of its row is empty.
    expect(gapsIn('nn')).toBe(4)
  })

  it('gives every character a unique id and a unique glyph', () => {
    expect(new Set(characters.map((c) => c.id)).size).toBe(46)
    expect(new Set(characters.map((c) => c.glyph)).size).toBe(46)
  })

  /**
   * Romaji is NOT unique, and that is a fact about the language rather than a
   * data error: お and を are both pronounced "o". This test pins the collision
   * to exactly that pair, so a second one can never appear unnoticed — the quiz
   * has to special-case it (CLAUDE.md §6) and would silently break if a third
   * duplicate showed up.
   */
  it('has exactly one romaji collision, and it is お/を', () => {
    const byRomaji = new Map<string, string[]>()
    for (const character of characters) {
      byRomaji.set(character.romaji, [
        ...(byRomaji.get(character.romaji) ?? []),
        character.glyph,
      ])
    }

    const collisions = [...byRomaji.entries()].filter(([, glyphs]) => glyphs.length > 1)

    expect(collisions).toHaveLength(1)
    expect(collisions[0]?.[0]).toBe('o')
    expect(collisions[0]?.[1]?.sort()).toEqual(['お', 'を'].sort())
  })

  /**
   * Row labels double as the select/clear control and become its accessible
   * name, so two rows sharing one makes the control ambiguous. The な-row and
   * ん both want to be called "N"; ん is "Final N" for exactly this reason.
   */
  it('gives every row a distinct label', () => {
    const labels = HIRAGANA.rows.map((row) => row.label)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('gives ん no vowel, and every other character one', () => {
    const withoutVowel = characters.filter((c) => c.vowel === null)
    expect(withoutVowel.map((c) => c.glyph)).toEqual(['ん'])
  })

  it('places every character in the column its vowel names', () => {
    for (const row of HIRAGANA.rows) {
      row.cells.forEach((cell, index) => {
        if (cell === null || cell.vowel === null) return
        expect(cell.vowel).toBe(HIRAGANA.columns[index])
      })
    }
  })
})

describe('example words', () => {
  it('gives every character at least one', () => {
    for (const character of characters) {
      expect(character.examples.length).toBeGreaterThanOrEqual(1)
    }
  })

  /** The whole point of an example: it must actually demonstrate the character. */
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

  it('is written in hiragana only — a beginner cannot read kanji', () => {
    for (const character of characters) {
      for (const example of character.examples) {
        expect(
          HIRAGANA_ONLY.test(example.kana),
          `${character.glyph}: "${example.kana}" contains non-hiragana`,
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
   * The two documented exceptions (CLAUDE.md §3.4), pinned so a later tidy-up
   * cannot quietly "fix" them into something wrong. を is a particle and never
   * appears inside a word; ん never appears word-initially.
   */
  it('handles を with a phrase and ん with a non-initial word', () => {
    const wo = characters.find((c) => c.id === 'hiragana:wo')
    expect(wo?.examples[0]?.kana).toBe('ほんをよむ')

    const n = characters.find((c) => c.id === 'hiragana:nn')
    expect(n?.examples[0]?.kana).toBe('みかん')
    expect(n?.examples[0]?.kana.startsWith('ん')).toBe(false)
  })
})
