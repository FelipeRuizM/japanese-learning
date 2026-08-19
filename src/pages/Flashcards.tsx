import { useMemo, useState } from 'react'
import type { Character } from '../types/characters'
import { characterById } from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { shuffle, systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { Flashcard } from '../components/Flashcard'
import { EmptyDeck } from '../components/EmptyDeck'
import { Button, HeadingLabel, Label } from '../components/ui/primitives'

export function Flashcards() {
  const deck = useDeck()

  const selected = useMemo(
    () =>
      [...deck.selected].map((id) => characterById(id)).filter((c) => c !== undefined),
    [deck.selected],
  )

  if (selected.length === 0) return <EmptyDeck activity="flip through" />

  // Remounting on a selection change is what re-shuffles and resets the
  // position, in one move.
  return <Cards key={[...deck.selected].sort().join(',')} deck={selected} />
}

function Cards({ deck }: { deck: Character[] }) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [cards] = useState<Character[]>(() => shuffle(deck, systemRng))

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const character = cards[index]
  if (!character) return <EmptyDeck activity="flip through" />

  const go = (next: number) => {
    setIndex(next)
    // A new card always starts face down. Carrying the revealed state across
    // would hand over the next answer for free.
    setRevealed(false)
  }

  const flip = () => {
    const next = !revealed
    setRevealed(next)
    // Sound on the reveal only — flipping back should be silent.
    if (next) speak(character)
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Card {index + 1} of {cards.length}
        </HeadingLabel>
        <Label>{revealed ? 'Showing the reading' : 'Tap the card to reveal'}</Label>
      </header>

      <Flashcard
        character={character}
        revealed={revealed}
        onFlip={flip}
        pronunciationStatus={status}
        onSpeak={speak}
      />

      <nav aria-label="Cards" className="flex items-center justify-between gap-3">
        <Button
          onClick={() => {
            go(index - 1)
          }}
          disabled={index === 0}
        >
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={() => {
            go(index + 1)
          }}
          disabled={index + 1 >= cards.length}
        >
          Next
        </Button>
      </nav>

      <PronunciationNote status={status} />
    </section>
  )
}
