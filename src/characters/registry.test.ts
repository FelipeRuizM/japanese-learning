import { describe, expect, it } from 'vitest'
import {
  allCharacters,
  characterById,
  characterSetById,
  CHARACTER_SETS,
  DEFAULT_CHARACTER_SET,
  everyCharacter,
} from './registry'

describe('the registry', () => {
  it('registers two matrix sets', () => {
    expect(CHARACTER_SETS).toHaveLength(2)
    for (const set of CHARACTER_SETS) {
      expect(set.layout).toBe('matrix')
      expect(set.label).not.toBe('')
    }
  })

  it('gives every set a distinct id and a distinct label', () => {
    // The label is what the picker shows and what a screen reader reads out;
    // two sets sharing one would make the control ambiguous.
    const ids = CHARACTER_SETS.map((set) => set.id)
    const labels = CHARACTER_SETS.map((set) => set.label)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('finds each registered set by id', () => {
    for (const set of CHARACTER_SETS) {
      expect(characterSetById(set.id)).toBe(set)
    }
  })

  it('returns undefined for a set that is not registered yet', () => {
    // Not a throw: kanji is named in the type but has no data module, and a
    // caller asking for one must get a miss rather than a crash.
    expect(characterSetById('kanji')).toBeUndefined()
    expect(characterSetById('nonsense')).toBeUndefined()
  })

  it('defaults to the first registered set', () => {
    expect(DEFAULT_CHARACTER_SET).toBe(CHARACTER_SETS[0])
  })

  it('drops the gaps when flattening, and only then', () => {
    for (const set of CHARACTER_SETS) {
      const cells = set.rows.flatMap((row) => row.cells)
      expect(cells.length).toBe(80) // 16 rows × 5 columns, gaps included
      expect(allCharacters(set)).toHaveLength(71)
    }

    expect(everyCharacter()).toHaveLength(142)
  })

  it('keeps ids unique across every set at once', () => {
    // This is what the script-qualified id buys: two sets can hold the same
    // reading in the same cell of the chart and the deck still cannot confuse
    // them. A collision here would make one character unselectable.
    const ids = everyCharacter().map((character) => character.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('resolves an id back to its character in any set', () => {
    expect(characterById('hiragana:ka')?.glyph).toBe('か')
    expect(characterById('katakana:ka')?.glyph).toBe('カ')
    // The written form, not the pronunciation — を is `wo` though it reads "o".
    expect(characterById('hiragana:wo')?.glyph).toBe('を')
    expect(characterById('katakana:wo')?.glyph).toBe('ヲ')
    expect(characterById('hiragana:o')?.glyph).toBe('お')
    expect(characterById('hiragana:nope')).toBeUndefined()
  })
})
