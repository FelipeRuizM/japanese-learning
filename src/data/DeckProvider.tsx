import { useCallback, useMemo, useReducer, type ReactNode } from 'react'
import { deckReducer, EMPTY_DECK } from './deck'
import { DeckContext, type DeckContextValue } from './deckContext'

/**
 * Holds the deck for the session. Mounted above the router so a selection
 * survives navigating between the grid, the flashcards and the quiz.
 *
 * It does NOT survive a refresh, and that is the design (CLAUDE.md §10).
 */
export function DeckProvider({ children }: { children: ReactNode }) {
  const [selected, dispatch] = useReducer(deckReducer, EMPTY_DECK)

  const toggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), [])
  const select = useCallback(
    (ids: readonly string[]) => dispatch({ type: 'select', ids }),
    [],
  )
  const deselect = useCallback(
    (ids: readonly string[]) => dispatch({ type: 'deselect', ids }),
    [],
  )
  const clear = useCallback(() => dispatch({ type: 'clear' }), [])

  const value = useMemo<DeckContextValue>(
    () => ({
      selected,
      count: selected.size,
      has: (id) => selected.has(id),
      toggle,
      select,
      deselect,
      clear,
    }),
    [selected, toggle, select, deselect, clear],
  )

  return <DeckContext value={value}>{children}</DeckContext>
}
