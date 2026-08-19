import { useContext } from 'react'
import { DeckContext, type DeckContextValue } from './deckContext'

export function useDeck(): DeckContextValue {
  const value = useContext(DeckContext)
  if (value === null) {
    throw new Error('useDeck must be used inside <DeckProvider>.')
  }
  return value
}
