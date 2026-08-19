import { describe, expect, it } from 'vitest'
import { deckReducer, EMPTY_DECK, hasAll, type DeckState } from './deck'

const deck = (...ids: string[]): DeckState => new Set(ids)

describe('deckReducer', () => {
  it('toggles an id on and back off', () => {
    const added = deckReducer(EMPTY_DECK, { type: 'toggle', id: 'a' })
    expect([...added]).toEqual(['a'])

    const removed = deckReducer(added, { type: 'toggle', id: 'a' })
    expect([...removed]).toEqual([])
  })

  it('never mutates the state it was given', () => {
    const before = deck('a')
    deckReducer(before, { type: 'toggle', id: 'b' })
    expect([...before]).toEqual(['a'])
  })

  it('selects a whole row without disturbing the rest', () => {
    const state = deckReducer(deck('x'), { type: 'select', ids: ['a', 'b'] })
    expect([...state].sort()).toEqual(['a', 'b', 'x'])
  })

  it('deselects a whole row without disturbing the rest', () => {
    const state = deckReducer(deck('a', 'b', 'x'), {
      type: 'deselect',
      ids: ['a', 'b'],
    })
    expect([...state]).toEqual(['x'])
  })

  it('clears everything', () => {
    expect([...deckReducer(deck('a', 'b'), { type: 'clear' })]).toEqual([])
  })

  /**
   * Identity on a no-op is what lets React skip the re-render. It matters more
   * than it looks: a row label is a toggle, so pressing an already-full row is
   * a normal thing to do, and re-rendering all 46 cells for nothing is waste.
   */
  it('returns the same object when nothing changes', () => {
    const full = deck('a', 'b')
    expect(deckReducer(full, { type: 'select', ids: ['a', 'b'] })).toBe(full)
    expect(deckReducer(full, { type: 'deselect', ids: ['q'] })).toBe(full)
    expect(deckReducer(EMPTY_DECK, { type: 'clear' })).toBe(EMPTY_DECK)
  })

  it('selects a partially-selected row without duplicating', () => {
    const state = deckReducer(deck('a'), { type: 'select', ids: ['a', 'b'] })
    expect([...state].sort()).toEqual(['a', 'b'])
  })
})

describe('hasAll', () => {
  it('is true only when every id is present', () => {
    expect(hasAll(deck('a', 'b'), ['a', 'b'])).toBe(true)
    expect(hasAll(deck('a'), ['a', 'b'])).toBe(false)
  })

  /**
   * A row of nothing but gaps must not report itself complete — otherwise its
   * control would read "Clear" and do nothing when pressed.
   */
  it('is false for an empty list, not vacuously true', () => {
    expect(hasAll(deck('a'), [])).toBe(false)
    expect(hasAll(EMPTY_DECK, [])).toBe(false)
  })
})
