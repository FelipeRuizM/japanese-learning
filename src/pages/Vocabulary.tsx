import { useState } from 'react'
import type { VocabEntry, VocabSet } from '../types/vocab'
import { VOCAB_SETS, everyVocabEntry, speakable, vocabEntries } from '../vocab/registry'
import { useVocabSet } from '../lib/useVocabSet'
import { shuffle, systemRng } from '../lib/shuffle'
import { buildVocabRound, type VocabQuizQuestion } from '../lib/vocabQuiz'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { SetPicker } from '../components/SetPicker'
import { VocabCard } from '../components/VocabCard'
import { VocabQuizCard } from '../components/VocabQuizCard'
import { Button, Chip, HeadingLabel, Label } from '../components/ui/primitives'

/**
 * Vocabulary (CLAUDE.md §11.4).
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
 * kana quiz cannot receive a vocabulary item (CLAUDE.md §10, bite 11).
 *
 * CARDS AND QUIZ ARE ONE ROUTE WITH A MODE, not two routes.
 *
 * The kana half gives each activity its own nav entry, and copying that here
 * would put a second "Quiz" in the nav — seven entries, two of them ambiguous.
 * It would also throw away the chosen set on the way between them, since which
 * set you are reading is per-page state (`useVocabSet`) exactly as which chart
 * you are reading is. Studying a set and then testing yourself on the same set
 * is one sitting, so it is one screen.
 */
const MODES = [
  { id: 'cards', label: 'Cards' },
  { id: 'quiz', label: 'Quiz' },
] as const

type Mode = (typeof MODES)[number]['id']

export function Vocabulary() {
  const { set, choose } = useVocabSet()
  const [mode, setMode] = useState<Mode>('cards')

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <SetPicker
          sets={VOCAB_SETS}
          activeId={set?.id ?? ''}
          onChange={choose}
          label="Vocabulary set"
        />
        <SetPicker
          sets={MODES}
          activeId={mode}
          onChange={setMode}
          label="Practice mode"
        />
      </div>

      {set === null ? (
        <p className="m-0 max-w-prose font-sans text-ink-1">
          No vocabulary has been added yet.
        </p>
      ) : (
        <>
          {/*
            Remounting on a set OR mode change reshuffles and resets the
            position in one move, the same way the kana flashcards remount on a
            deck change. Switching mode and coming back is a fresh pass, which
            is what someone switching mode is asking for.
          */}
          {mode === 'cards' ? (
            <Cards key={set.id} set={set} />
          ) : (
            <Quiz key={set.id} set={set} />
          )}

          <p className="m-0 max-w-prose font-sans text-sm text-ink-2">
            From {set.source}.
          </p>
        </>
      )}
    </section>
  )
}

function Cards({ set }: { set: VocabSet }) {
  const { status, speak } = usePronunciation()

  /**
   * Shuffled ONCE per visit (CLAUDE.md §5). `useState`'s initialiser rather
   * than `useMemo`, which React may discard and recompute — that would reorder
   * the cards underneath the learner mid-pass.
   */
  const [cards] = useState<VocabEntry[]>(() => shuffle(vocabEntries(set), systemRng))

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

function Quiz({ set }: { set: VocabSet }) {
  const [roundId, setRoundId] = useState(0)

  return (
    <Round
      key={roundId}
      set={set}
      onAgain={() => {
        setRoundId((n) => n + 1)
      }}
    />
  )
}

function Round({ set, onAgain }: { set: VocabSet; onAgain: () => void }) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<VocabQuizQuestion[]>(() =>
    // The last-resort distractor pool is EVERY registered item, not just this
    // set's. It is only reached by a group too small to fill four options, and
    // a colliding meaning can never be drawn regardless.
    buildVocabRound(vocabEntries(set), everyVocabEntry(), systemRng),
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
          ? 'Every one. Try another set, or go again.'
          : 'Nothing is recorded — start another round whenever you like.'}
      </p>
      <Button variant="primary" onClick={onAgain}>
        Go again
      </Button>
    </div>
  )
}
