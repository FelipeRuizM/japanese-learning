import { useState } from 'react'
import type { VocabEntry } from '../types/vocab'
import { everyVocabEntry, speakable } from '../vocab/registry'
import { useVocabScope, type VocabScope } from '../lib/useVocabScope'
import { shuffle, systemRng } from '../lib/shuffle'
import {
  buildVocabRound,
  roundLength,
  roundSizeOptions,
  type RoundSize,
  type VocabQuizQuestion,
} from '../lib/vocabQuiz'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { SetPicker } from '../components/SetPicker'
import { ScopePicker } from '../components/ScopePicker'
import { RoundSizePicker } from '../components/RoundSizePicker'
import { VocabCard } from '../components/VocabCard'
import { VocabQuizCard } from '../components/VocabQuizCard'
import { Button, Chip, HeadingLabel, Label } from '../components/ui/primitives'

/**
 * Vocabulary (CLAUDE.md §11.4).
 *
 * THE SELECTION IS WEEKS AND TOPICS, BUILT ON THE SPOT.
 *
 * Phase 9 had no selection step at all, on the reasoning that a set was one
 * class note — sixteen to nineteen items, which is one sitting. That reasoning
 * expired when a set became a WEEK: forty-four items is not one sitting, and a
 * second week will not make it shorter. So the choice came back, in the shape
 * the material actually has — some weeks, some topics inside them, and a round
 * length.
 *
 * It is still NOT the kana deck. The deck is a context above the router because
 * a kana selection has to survive walking between four screens; this is one
 * screen, so it is page state (`useVocabScope`), and vocabulary still never
 * enters `DeckProvider` (bite 11).
 *
 * CARDS AND QUIZ ARE ONE ROUTE WITH A MODE, and the scope picker is now the
 * strongest argument for that: the selection is several taps of work, and
 * splitting the two into separate routes would throw it away on the way
 * between them.
 */
const MODES = [
  { id: 'cards', label: 'Cards' },
  { id: 'quiz', label: 'Quiz' },
] as const

type Mode = (typeof MODES)[number]['id']

export function Vocabulary() {
  const scope = useVocabScope()
  const [mode, setMode] = useState<Mode>('cards')
  /**
   * Held HERE rather than inside the quiz, so switching to the cards and back
   * does not silently reset a round length that was deliberately chosen.
   */
  const [size, setSize] = useState<RoundSize>(10)

  const total = scope.entries.length
  // A stored size the current scope cannot offer falls back to `'all'`, so
  // exactly one option is ever pressed. Narrowing the topics until 20 is off
  // the menu would otherwise leave every option unpressed and the round some
  // length nothing on screen accounts for.
  const options = roundSizeOptions(total)
  const activeSize: RoundSize = options.includes(size) ? size : 'all'

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <ScopePicker scope={scope} />
        <div className="flex flex-col gap-2">
          <Label>Practice</Label>
          <SetPicker
            sets={MODES}
            activeId={mode}
            onChange={setMode}
            label="Practice mode"
          />
        </div>
        {mode === 'quiz' ? (
          <RoundSizePicker total={total} size={activeSize} onChange={setSize} />
        ) : null}
      </div>

      {total === 0 ? (
        <NothingSelected />
      ) : (
        <>
          {/*
            Keyed on the SELECTION, so changing it reshuffles and returns to the
            start — the same remount the mode toggle does, and the same one the
            kana flashcards do on a deck change. Adding a topic mid-pass and
            carrying on from card 19 of a list that just changed underneath is
            not something anyone asked for.
          */}
          {mode === 'cards' ? (
            <Cards key={scope.key} entries={scope.entries} />
          ) : (
            <Quiz
              key={`${scope.key}::${String(activeSize)}`}
              scope={scope}
              size={activeSize}
            />
          )}

          <p className="m-0 max-w-prose font-sans text-sm text-ink-2">
            From {scope.chosenWeeks.map((week) => week.source).join('; ')}.
          </p>
        </>
      )}
    </section>
  )
}

/**
 * The designed empty state (CLAUDE.md §8). Turning off the last topic is a
 * thing a person does on the way to choosing different ones, so this says what
 * is missing and where the control is, and does not scold.
 */
function NothingSelected() {
  return (
    <div className="flex flex-col items-start gap-3">
      <HeadingLabel>Nothing selected</HeadingLabel>
      <p className="m-0 max-w-prose font-sans text-ink-1">
        Turn on a week, or any topic within one, and the cards and the quiz will follow
        what you chose.
      </p>
    </div>
  )
}

function Cards({ entries }: { entries: VocabEntry[] }) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [cards] = useState<VocabEntry[]>(() => shuffle(entries, systemRng))

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  const card = cards[index]
  if (!card) return null

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
        group={card.groupLabel}
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
    </>
  )
}

function Quiz({ scope, size }: { scope: VocabScope; size: RoundSize }) {
  const [roundId, setRoundId] = useState(0)

  return (
    <Round
      key={roundId}
      scope={scope}
      size={size}
      onAgain={() => {
        setRoundId((n) => n + 1)
      }}
    />
  )
}

function Round({
  scope,
  size,
  onAgain,
}: {
  scope: VocabScope
  size: RoundSize
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<VocabQuizQuestion[]>(() =>
    // The last-resort distractor pool is EVERY registered item, not just the
    // chosen scope's. It is only reached by a group too small to fill four
    // options, and a colliding meaning can never be drawn regardless.
    buildVocabRound(
      scope.entries,
      everyVocabEntry(),
      systemRng,
      roundLength(size, scope.entries.length),
    ),
  )

  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<VocabEntry | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = questions[index]

  if (done || !question) {
    return <RoundSummary score={score} total={questions.length} onAgain={onAgain} />
  }

  const choose = (option: VocabEntry) => {
    if (chosen !== null) return
    setChosen(option)
    if (option.item.id === question.answer.item.id) setScore((s) => s + 1)
    // Hearing it at the moment of the reveal is the point, whether or not they
    // got it right.
    speak(speakable(question.answer.item))
  }

  const next = () => {
    setChosen(null)
    if (index + 1 >= questions.length) setDone(true)
    else setIndex(index + 1)
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Question {index + 1} of {questions.length}
        </HeadingLabel>
        <Chip>{score} correct</Chip>
      </header>

      <VocabQuizCard
        question={question}
        chosen={chosen}
        onChoose={choose}
        onNext={next}
        isLast={index + 1 >= questions.length}
      />

      <PronunciationNote status={status} />
    </>
  )
}

/**
 * The round summary. In component state and gone the moment this route
 * unmounts — a score for the round you just did is not progress tracking, and
 * nothing here is written anywhere (CLAUDE.md §10).
 */
function RoundSummary({
  score,
  total,
  onAgain,
}: {
  score: number
  total: number
  onAgain: () => void
}) {
  return (
    <div className="flex flex-col items-start gap-4">
      <HeadingLabel>Round complete</HeadingLabel>
      <p className="m-0 font-sans text-5xl font-semibold text-ink-0">
        {score} / {total}
      </p>
      <p className="m-0 max-w-prose text-ink-1">
        {score === total
          ? 'Every one. Change the topics, or go again.'
          : 'Nothing is recorded — start another round whenever you like.'}
      </p>
      <Button variant="primary" onClick={onAgain}>
        Go again
      </Button>
    </div>
  )
}
