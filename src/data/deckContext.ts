import { createContext } from 'react'
import type { DeckState } from './deck'

export type DeckContextValue = {
  selected: DeckState
  count: number
  has: (id: string) => boolean
  toggle: (id: string) => void
  select: (ids: readonly string[]) => void
  deselect: (ids: readonly string[]) => void
  clear: () => void
}

/**
 * Lives apart from the provider component so the module exports either
 * components or values, never both — which is what `react/only-export-components`
 * is asking for, and what keeps fast refresh working.
 *
 * `null` rather than a default value: a missing provider is a bug, and
 * `useDeck` throws on it rather than silently handing back an empty deck that
 * drops every selection.
 */
export const DeckContext = createContext<DeckContextValue | null>(null)
