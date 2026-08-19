/**
 * The deck — the set of characters chosen for study.
 *
 * IN MEMORY ONLY. No localStorage, no sessionStorage, no URL state, no backend
 * (CLAUDE.md §10). The consequence is deliberate and load-bearing: **every
 * refresh returns an empty deck**, which makes the empty state a primary screen
 * rather than an edge case.
 *
 * The reducer is pure and lives apart from the provider so the rules can be
 * tested without rendering anything.
 */

export type DeckState = ReadonlySet<string>

export type DeckAction =
  | { type: 'toggle'; id: string }
  | { type: 'select'; ids: readonly string[] }
  | { type: 'deselect'; ids: readonly string[] }
  | { type: 'clear' }

export const EMPTY_DECK: DeckState = new Set<string>()

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'toggle': {
      const next = new Set(state)
      if (!next.delete(action.id)) next.add(action.id)
      return next
    }

    case 'select': {
      // Return the SAME state when nothing changes, so React can skip the
      // re-render. Selecting an already-full row is a common no-op — the row
      // label is a toggle and people press it twice.
      if (action.ids.every((id) => state.has(id))) return state
      const next = new Set(state)
      for (const id of action.ids) next.add(id)
      return next
    }

    case 'deselect': {
      if (!action.ids.some((id) => state.has(id))) return state
      const next = new Set(state)
      for (const id of action.ids) next.delete(id)
      return next
    }

    case 'clear':
      return state.size === 0 ? state : EMPTY_DECK
  }
}

/**
 * Whether every id is already in the deck. This is what makes a row label a
 * toggle: a full row clears, anything else fills.
 *
 * An EMPTY list is not "all selected" — otherwise a row of nothing but gaps
 * would report itself as complete and its control would read "Clear".
 */
export function hasAll(state: DeckState, ids: readonly string[]): boolean {
  return ids.length > 0 && ids.every((id) => state.has(id))
}
