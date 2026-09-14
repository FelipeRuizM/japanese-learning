import { useState } from 'react'
import type { VocabEntry } from '../types/vocab'
import { everyVocabEntry, speakable } from '../vocab/registry'
import { useVocabScope } from '../lib/useVocabScope'
import { shuffle, systemRng } from '../lib/shuffle'
import {
  buildVocabQuestion,
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
import { MarkWrong } from '../components/MarkWrong'
import { StepNav } from '../components/StepNav'
import { RoundSummary } from '../components/RoundSummary'
import { PassSummary } from '../components/PassSummary'
import { useCardPass } from '../lib/useCardPass'
import { useQuizRound } from '../lib/useQuizRound'
import { Chip, HeadingLabel, Label } from '../components/ui/primitives'

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
            <CardsMode key={scope.key} entries={scope.entries} />
          ) : (
            <Quiz
              key={`${scope.key}::${String(activeSize)}`}
              size={activeSize}
              entries={scope.entries}
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

/**
 * A pass, and the redo passes that follow it.
 *
 * THE REDO SUBSET LIVES HERE, one level above the pass itself, for the reason
 * every "go again" in this app needs a wrapper: a component cannot remount
 * itself, and remounting is what resets the position, the marks and the
 * shuffle in one move.
 *
 * It is keyed on the SCOPE by its caller, so turning a topic on mid-redo throws
 * the redo away rather than leaving you in a three-card pass drawn from a
 * selection you no longer have.
 */
function CardsMode({ entries }: { entries: VocabEntry[] }) {
  const [passId, setPassId] = useState(0)
  /** The cards a redo pass covers, or `null` for the whole selection. */
  const [redoOver, setRedoOver] = useState<VocabEntry[] | null>(null)

  return (
    <Cards
      key={passId}
      entries={redoOver ?? entries}
      onRedo={(missed) => {
        setRedoOver(missed)
        setPassId((n) => n + 1)
      }}
      onAgain={() => {
        setRedoOver(null)
        setPassId((n) => n + 1)
      }}
    />
  )
}

function Cards({
  entries,
  onRedo,
  onAgain,
}: {
  entries: VocabEntry[]
  onRedo: (missed: VocabEntry[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [cards] = useState<VocabEntry[]>(() => shuffle(entries, systemRng))

  const pass = useCardPass(
    cards,
    (entry) => entry.item.id,
    (entry) => {
      speak(speakable(entry.item))
    },
  )

  if (pass.done || pass.card === undefined) {
    return (
      <PassSummary
        total={cards.length}
        marked={pass.markedCount}
        onRedo={() => {
          onRedo(pass.missed)
        }}
        onAgain={onAgain}
      />
    )
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Card {pass.index + 1} of {cards.length}
        </HeadingLabel>
        <div className="flex items-center gap-3">
          {pass.markedCount > 0 ? <Chip>{pass.markedCount} marked</Chip> : null}
          <Label>
            {pass.revealed ? 'Showing the meaning' : 'Tap the card to reveal'}
          </Label>
        </div>
      </header>

      <VocabCard
        item={pass.card.item}
        group={pass.card.groupLabel}
        revealed={pass.revealed}
        onFlip={pass.flip}
        pronunciationStatus={status}
        onSpeak={speak}
      />

      {/* Below the card, not on its back face: a button cannot contain another
          button, the same constraint that puts the replay control here (§5). */}
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
    </>
  )
}

function Quiz({ size, entries }: { size: RoundSize; entries: VocabEntry[] }) {
  const [roundId, setRoundId] = useState(0)
  /** The questions a retry covers, or `null` for a fresh round over the scope. */
  const [retryOver, setRetryOver] = useState<VocabQuizQuestion[] | null>(null)

  return (
    <Round
      key={roundId}
      size={size}
      entries={entries}
      retryOver={retryOver}
      onRetry={(missed) => {
        setRetryOver(missed)
        setRoundId((n) => n + 1)
      }}
      onAgain={() => {
        setRetryOver(null)
        setRoundId((n) => n + 1)
      }}
    />
  )
}

function Round({
  size,
  entries,
  retryOver,
  onRetry,
  onAgain,
}: {
  size: RoundSize
  entries: VocabEntry[]
  retryOver: VocabQuizQuestion[] | null
  onRetry: (missed: VocabQuizQuestion[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<VocabQuizQuestion[]>(() =>
    retryOver === null
      ? // The last-resort distractor pool is EVERY registered item, not just the
        // chosen scope's. It is only reached by a group too small to fill four
        // options, and a colliding meaning can never be drawn regardless.
        buildVocabRound(
          entries,
          everyVocabEntry(),
          systemRng,
          roundLength(size, entries.length),
        )
      : // A RETRY ASKS THE SAME WORDS AS NEW QUESTIONS, and the round length
        // does not apply — you asked for the ones you missed, all of them.
        // Distractors still come from the WHOLE scope, so a retry over three
        // words is not three words shown to each other.
        shuffle(retryOver, systemRng).map((q) =>
          buildVocabQuestion(q.answer, entries, everyVocabEntry(), systemRng),
        ),
  )

  const round = useQuizRound<VocabQuizQuestion, VocabEntry>(
    questions,
    (question, choice) => choice.item.id === question.answer.item.id,
  )

  if (round.done || round.question === undefined) {
    return (
      <RoundSummary
        score={round.score}
        total={questions.length}
        missed={round.missed.length}
        onRetry={() => {
          onRetry(round.missed)
        }}
        onAgain={onAgain}
        perfect="Every one. Change the topics, or go again."
      />
    )
  }

  const question = round.question

  const choose = (option: VocabEntry) => {
    if (round.chosen !== null) return
    round.answer(option)
    // Hearing it at the moment of the reveal is the point, whether or not they
    // got it right.
    speak(speakable(question.answer.item))
  }

  return (
    <>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Question {round.index + 1} of {questions.length}
        </HeadingLabel>
        <div className="flex items-center gap-3">
          {round.isReview ? <Label>Reviewing</Label> : null}
          <Chip>{round.score} correct</Chip>
        </div>
      </header>

      <VocabQuizCard question={question} chosen={round.chosen} onChoose={choose} />

      <StepNav
        label="Questions"
        nextLabel={round.isLast ? 'See how you did' : 'Next'}
        onPrevious={round.previous}
        onNext={round.next}
        canGoBack={round.canGoBack}
        canGoNext={round.canGoNext}
      />

      <PronunciationNote status={status} />
    </>
  )
}
