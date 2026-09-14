import { useState } from 'react'

/**
 * A PASS THROUGH A STACK OF FLASHCARDS, with marks.
 *
 * MARKING IS ONE-SIDED ON PURPOSE. Every card counts as right unless you say
 * otherwise, so the only control is "I got that wrong" — nobody wants to grade
 * forty-four cards they knew. The consequence is that an unmarked card and a
 * card you never reached are indistinguishable, which is correct for a pass you
 * walked to the end of and is why the summary reports against the cards in the
 * pass rather than against the ones you looked at.
 *
 * Marks are held by ID rather than by position, so paging back to a card shows
 * it still marked, and a redo pass over a subset carries nothing with it.
 *
 * NOTHING HERE IS PERSISTED — it dies with the component, like the quiz score
 * (CLAUDE.md §10). Marking a card is not a record of a character you find hard;
 * it is a note about the pass you are in the middle of, and refreshing loses it
 * exactly as refreshing loses the deck.
 */
export type CardPass<T> = {
  cards: readonly T[]
  index: number
  card: T | undefined
  revealed: boolean
  /** Whether the card on screen is marked wrong. */
  isMarked: boolean
  markedCount: number
  done: boolean
  isLast: boolean
  canGoBack: boolean
  flip: () => void
  toggleMark: () => void
  next: () => void
  previous: () => void
  /** The marked cards, in pass order. What a redo pass is built from. */
  missed: T[]
}

export function useCardPass<T>(
  cards: readonly T[],
  idOf: (card: T) => string,
  /** Called when a card is turned face up — the one moment audio plays (§5). */
  onReveal: (card: T) => void,
): CardPass<T> {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [marked, setMarked] = useState<ReadonlySet<string>>(() => new Set())
  const [done, setDone] = useState(false)

  const card = cards[index]

  const go = (next: number) => {
    setIndex(next)
    // A card always arrives face down, forwards or backwards. Carrying the
    // revealed state across would hand over the next answer for free (§5).
    setRevealed(false)
  }

  return {
    cards,
    index,
    card,
    revealed,
    isMarked: card !== undefined && marked.has(idOf(card)),
    markedCount: marked.size,
    done,
    isLast: index + 1 >= cards.length,
    canGoBack: index > 0,
    missed: cards.filter((c) => marked.has(idOf(c))),

    flip: () => {
      const next = !revealed
      setRevealed(next)
      // Sound on the reveal only — flipping back should be silent.
      if (next && card !== undefined) onReveal(card)
    },

    toggleMark: () => {
      if (card === undefined) return
      setMarked((current) => {
        const next = new Set(current)
        if (!next.delete(idOf(card))) next.add(idOf(card))
        return next
      })
    },

    next: () => {
      if (index + 1 >= cards.length) setDone(true)
      else go(index + 1)
    },

    previous: () => {
      if (index > 0) go(index - 1)
    },
  }
}
