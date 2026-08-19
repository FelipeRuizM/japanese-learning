import { describe, expect, it } from 'vitest'
import {
  allCharacters,
  characterById,
  characterSetById,
  CHARACTER_SETS,
  everyCharacter,
} from './registry'

describe('the registry', () => {
  it('registers hiragana as a matrix set', () => {
    expect(CHARACTER_SETS).toHaveLength(1)
    const set = characterSetById('hiragana')
    expect(set?.layout).toBe('matrix')
    expect(set?.label).toBe('Hiragana')
  })

  it('returns undefined for a set that is not registered yet', () => {
    // Not a throw: katakana and kanji are named in the type but have no data
    // module, and a caller asking for one must get a miss rather than a crash.
    expect(characterSetById('katakana')).toBeUndefined()
    expect(characterSetById('nonsense')).toBeUndefined()
  })

  it('drops the gaps when flattening, and only then', () => {
    const set = CHARACTER_SETS[0]
    expect(set).toBeDefined()
    if (!set) return

    const cells = set.rows.flatMap((row) => row.cells)
    expect(cells.length).toBe(55) // 11 rows × 5 columns, gaps included
    expect(allCharacters(set)).toHaveLength(46)
    expect(everyCharacter()).toHaveLength(46)
  })

  it('resolves an id back to its character', () => {
    expect(characterById('hiragana:ka')?.glyph).toBe('か')
    // The written form, not the pronunciation — を is `wo` though it reads "o".
    expect(characterById('hiragana:wo')?.glyph).toBe('を')
    expect(characterById('hiragana:o')?.glyph).toBe('お')
    expect(characterById('hiragana:nope')).toBeUndefined()
  })
})
