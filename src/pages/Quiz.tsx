import { useMemo, useState } from 'react'
import type { Character } from '../types/characters'
import {
  allCharacters,
  characterById,
  DEFAULT_CHARACTER_SET,
} from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { buildRound, type QuizQuestion } from '../lib/quiz'
import { systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { QuizCard } from '../components/QuizCard'
import { EmptyDeck } from '../components/EmptyDeck'
import { Button, ButtonLink, Chip, Label } from '../components/ui/primitives'

export function Quiz() {
  const deck = useDeck()
  const [roundId, setRoundId] = useState(0)

  const selected = useMemo(
    () =>
      [...deck.selected].map((id) => characterById(id)).filter((c) => c !== undefined),
    [deck.selected],
  )

  if (selected.length === 0) return <EmptyDeck activity="quiz yourself" />

  /**
   * The key starts a fresh round when the selection changes, or when the
   * learner asks for another — while answering questions within a round never
   * rebuilds it. Remounting is what resets the index, the score and the
   * question order in one move.
   */
  const key = `${roundId}:${[...deck.selected].sort().join(',')}`

  return (
    <Round
      key={key}
      deck={selected}
      onAgain={() => {
        setRoundId((n) => n + 1)
      }}
    />
  )
}

function Round({ deck, onAgain }: { deck: Character[]; onAgain: () => void }) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<QuizQuestion[]>(() =>
    buildRound(deck, allCharacters(DEFAULT_CHARACTER_SET), systemRng),
  )

  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<Character | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = questions[index]

  if (done || !question) {
    return <RoundSummary score={score} total={questions.length} onAgain={onAgain} />
  }

  const choose = (option: Character) => {
    if (chosen !== null) return
    setChosen(option)
    if (option.id === question.answer.id) setScore((s) => s + 1)
    // Hearing the right sound at the moment of the reveal is the point, whether
    // or not they got it right.
    speak(question.answer)
  }

  const next = () => {
    setChosen(null)
    if (index + 1 >= questions.length) setDone(true)
    else setIndex(index + 1)
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <Label>
          Question {index + 1} of {questions.length}
        </Label>
        <Chip>{score} correct</Chip>
      </header>

      <QuizCard
        question={question}
        chosen={chosen}
        onChoose={choose}
        onNext={next}
        isLast={index + 1 >= questions.length}
      />

      <PronunciationNote status={status} />
    </section>
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
    <section className="flex flex-col items-start gap-4">
      <Label>Round complete</Label>
      <p className="m-0 font-sans text-5xl font-semibold text-ink-0">
        {score} / {total}
      </p>
      <p className="m-0 max-w-prose text-ink-1">
        {score === total
          ? 'Every one. Pick a new row and go again.'
          : 'Nothing is recorded — start another round whenever you like.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {/* Remounts the round. NOT a page reload: the deck lives in memory by
            design, so reloading would throw the selection away and drop the
            learner back on an empty grid. */}
        <Button variant="primary" onClick={onAgain}>
          Go again
        </Button>
        <ButtonLink to="/">Change selection</ButtonLink>
      </div>
    </section>
  )
}
