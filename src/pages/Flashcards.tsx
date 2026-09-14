import { useMemo, useState } from 'react'
import type { Character } from '../types/characters'
import { characterById, speakable } from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { shuffle, systemRng } from '../lib/shuffle'
import { useCardPass } from '../lib/useCardPass'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { Flashcard } from '../components/Flashcard'
import { MarkWrong } from '../components/MarkWrong'
import { StepNav } from '../components/StepNav'
import { PassSummary } from '../components/PassSummary'
import { EmptyDeck } from '../components/EmptyDeck'
import { Chip, HeadingLabel, Label } from '../components/ui/primitives'

export function Flashcards() {
  const deck = useDeck()
  const [passId, setPassId] = useState(0)
  /**
   * The cards a redo pass covers, TAGGED WITH THE DECK IT CAME FROM.
   *
   * The tag is not bookkeeping. A redo subset outlives the remount that starts
   * it — that is the point — so without something tying it to a deck, changing
   * the selection mid-redo leaves you in a three-card pass drawn from a deck
   * you no longer have. Comparing the tag discards it exactly when it stops
   * making sense, with no effect and no second source of truth.
   */
  const [redo, setRedo] = useState<{ deck: string; cards: Character[] } | null>(null)

  const selected = useMemo(
    () =>
      [...deck.selected].map((id) => characterById(id)).filter((c) => c !== undefined),
    [deck.selected],
  )

  if (selected.length === 0) return <EmptyDeck activity="flip through" />

  const deckKey = [...deck.selected].sort().join(',')
  const cards = redo?.deck === deckKey ? redo.cards : selected

  // Remounting on a selection change is what re-shuffles and resets the
  // position, in one move — and a redo pass is just another remount.
  return (
    <Pass
      key={`${passId}:${deckKey}`}
      cards={cards}
      onRedo={(missed) => {
        setRedo({ deck: deckKey, cards: missed })
        setPassId((n) => n + 1)
      }}
      onAgain={() => {
        setRedo(null)
        setPassId((n) => n + 1)
      }}
    />
  )
}

function Pass({
  cards,
  onRedo,
  onAgain,
}: {
  cards: Character[]
  onRedo: (missed: Character[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [shuffled] = useState<Character[]>(() => shuffle(cards, systemRng))

  const pass = useCardPass(
    shuffled,
    (card) => card.id,
    (card) => {
      speak(speakable(card))
    },
  )

  if (pass.done || pass.card === undefined) {
    return (
      <PassSummary
        total={shuffled.length}
        marked={pass.markedCount}
        onRedo={() => {
          onRedo(pass.missed)
        }}
        onAgain={onAgain}
      />
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Card {pass.index + 1} of {shuffled.length}
        </HeadingLabel>
        <div className="flex items-center gap-3">
          {pass.markedCount > 0 ? <Chip>{pass.markedCount} marked</Chip> : null}
          <Label>
            {pass.revealed ? 'Showing the reading' : 'Tap the card to reveal'}
          </Label>
        </div>
      </header>

      <Flashcard
        character={pass.card}
        revealed={pass.revealed}
        onFlip={pass.flip}
        pronunciationStatus={status}
        onSpeak={speak}
      />

      {/* Below the card, not on its back face: a button cannot contain another
          button, which is the same constraint that puts the replay control
          here (§5). */}
      <div className="flex justify-center">
        <MarkWrong marked={pass.isMarked} onToggle={pass.toggleMark} />
      </div>

      <StepNav
        label="Cards"
        nextLabel={pass.isLast ? 'See how you did' : 'Next'}
        onPrevious={pass.previous}
        onNext={pass.next}
        canGoBack={pass.canGoBack}
      />

      <PronunciationNote status={status} />
    </section>
  )
}
