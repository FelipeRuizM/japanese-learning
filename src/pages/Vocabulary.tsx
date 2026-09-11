import { useState } from 'react'
import type { VocabItem, VocabSet } from '../types/vocab'
import { VOCAB_SETS, speakable } from '../vocab/registry'
import { useVocabSet } from '../lib/useVocabSet'
import { shuffle, systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { SetPicker } from '../components/SetPicker'
import { VocabCard } from '../components/VocabCard'
import { Button, HeadingLabel, Label } from '../components/ui/primitives'

/**
 * Vocabulary flashcards (CLAUDE.md §11).
 *
 * THERE IS NO SELECTION STEP, AND THAT IS THE DECISION PHASE 8 DEFERRED.
 *
 * The kana deck exists because 142 characters is far too many for one sitting,
 * so the grid had to come first and the deck had to carry a choice between
 * screens. A vocabulary set is a class note — sixteen to nineteen items, which
 * is one sitting. The set IS the deck, so picking one is the whole of the
 * selection, and building a second selection grid would add a screen to save
 * nobody any work.
 *
 * The consequence worth stating: vocabulary never enters `DeckProvider`, so the
 * kana quiz cannot receive a vocabulary item (CLAUDE.md §10, bite 11). That
 * constraint is now structural rather than something to remember.
 */
export function Vocabulary() {
  const { set, choose } = useVocabSet()

  return (
    <section className="flex flex-col gap-6">
      <SetPicker
        sets={VOCAB_SETS}
        activeId={set?.id ?? ''}
        onChange={choose}
        label="Vocabulary set"
      />

      {set === null ? (
        <p className="m-0 max-w-prose font-sans text-ink-1">
          No vocabulary has been added yet.
        </p>
      ) : (
        // Remounting on a set change reshuffles and resets the position in one
        // move, the same way the kana flashcards remount on a deck change.
        <Cards key={set.id} set={set} />
      )}
    </section>
  )
}

/** A card carries its group so the reveal can name it (see `VocabCard`). */
type Card = { item: VocabItem; group: string }

function Cards({ set }: { set: VocabSet }) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [cards] = useState<Card[]>(() =>
    shuffle(
      set.groups.flatMap((group) =>
        group.items.map((item) => ({ item, group: group.label })),
      ),
      systemRng,
    ),
  )

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const card = cards[index]
  if (!card) {
    return (
      <p className="m-0 max-w-prose font-sans text-ink-1">
        This set has no cards in it yet.
      </p>
    )
  }

  const go = (next: number) => {
    setIndex(next)
    // A new card always starts face down. Carrying the revealed state across
    // would hand over the next meaning for free.
    setRevealed(false)
  }

  const flip = () => {
    const next = !revealed
    setRevealed(next)
    // Sound on the reveal only — flipping back should be silent.
    if (next) speak(speakable(card.item))
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Card {index + 1} of {cards.length}
        </HeadingLabel>
        <Label>{revealed ? 'Showing the meaning' : 'Tap the card to reveal'}</Label>
      </header>

      <VocabCard
        item={card.item}
        group={card.group}
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

      <p className="m-0 max-w-prose font-sans text-sm text-ink-2">From {set.source}.</p>
    </>
  )
}
