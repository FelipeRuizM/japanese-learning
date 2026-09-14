import { useMemo, useState } from 'react'
import type { Character } from '../types/characters'
import { characterById, everyCharacter, speakable } from '../characters/registry'
import { useDeck } from '../data/useDeck'
import { buildQuestion, buildRound, type QuizQuestion } from '../lib/quiz'
import { shuffle, systemRng } from '../lib/shuffle'
import { useQuizRound } from '../lib/useQuizRound'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { QuizCard } from '../components/QuizCard'
import { StepNav } from '../components/StepNav'
import { RoundSummary } from '../components/RoundSummary'
import { EmptyDeck } from '../components/EmptyDeck'
import { ButtonLink, Chip, HeadingLabel, Label } from '../components/ui/primitives'
import { PATHS } from '../routes'

export function Quiz() {
  const deck = useDeck()
  const [roundId, setRoundId] = useState(0)
  /**
   * The questions a retry round is built over, TAGGED WITH THE DECK.
   *
   * Held above the round because a round cannot restart itself — remounting is
   * what resets the index and the answers. The tag then stops it outliving the
   * deck it came from: changing the selection mid-retry would otherwise leave
   * you re-answering characters you have just deselected.
   */
  const [retry, setRetry] = useState<{
    deck: string
    questions: QuizQuestion[]
  } | null>(null)

  const selected = useMemo(
    () =>
      [...deck.selected].map((id) => characterById(id)).filter((c) => c !== undefined),
    [deck.selected],
  )

  if (selected.length === 0) return <EmptyDeck activity="quiz yourself" />

  /**
   * The key starts a fresh round when the selection changes, when the learner
   * asks for another, or when they retry what they missed — while answering
   * questions within a round never rebuilds it. Remounting is what resets the
   * index, the answers and the question order in one move.
   */
  const deckKey = [...deck.selected].sort().join(',')

  return (
    <Round
      key={`${roundId}:${deckKey}`}
      deck={selected}
      retryOver={retry?.deck === deckKey ? retry.questions : null}
      onRetry={(missed) => {
        setRetry({ deck: deckKey, questions: missed })
        setRoundId((n) => n + 1)
      }}
      onAgain={() => {
        setRetry(null)
        setRoundId((n) => n + 1)
      }}
    />
  )
}

function Round({
  deck,
  retryOver,
  onRetry,
  onAgain,
}: {
  deck: Character[]
  retryOver: QuizQuestion[] | null
  onRetry: (missed: QuizQuestion[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<QuizQuestion[]>(() =>
    retryOver === null
      ? // The last-resort distractor pool is EVERY registered character, not
        // just the ones sharing a script with the answer. It is only ever
        // reached by a deck too small to fill four options from itself, and a
        // same-sounding character can never be drawn regardless — `collides` is
        // keyed on romaji, so か can no more sit beside カ than お can beside を.
        buildRound(deck, everyCharacter(), systemRng)
      : // A RETRY ASKS THE SAME CHARACTERS AS NEW QUESTIONS. Replaying the
        // identical question lets you answer from where the right option sat
        // last time, which tests recall of a layout rather than of a character.
        // The distractor pool stays the WHOLE deck, so a retry over three
        // characters is not three questions drawn from three options.
        shuffle(retryOver, systemRng).map((q) =>
          buildQuestion(q.answer, deck, everyCharacter(), systemRng),
        ),
  )

  const round = useQuizRound<QuizQuestion, Character>(
    questions,
    (question, choice) => choice.id === question.answer.id,
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
        perfect="Every one. Pick a new row and go again."
      >
        <ButtonLink to={PATHS.characters}>Change selection</ButtonLink>
      </RoundSummary>
    )
  }

  const question = round.question

  const choose = (option: Character) => {
    if (round.chosen !== null) return
    round.answer(option)
    // Hearing the right sound at the moment of the reveal is the point, whether
    // or not they got it right.
    speak(speakable(question.answer))
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <HeadingLabel>
          Question {round.index + 1} of {questions.length}
        </HeadingLabel>
        <div className="flex items-center gap-3">
          {round.isReview ? <Label>Reviewing</Label> : null}
          <Chip>{round.score} correct</Chip>
        </div>
      </header>

      <QuizCard question={question} chosen={round.chosen} onChoose={choose} />

      <StepNav
        label="Questions"
        nextLabel={round.isLast ? 'See how you did' : 'Next'}
        onPrevious={round.previous}
        onNext={round.next}
        canGoBack={round.canGoBack}
        canGoNext={round.canGoNext}
      />

      <PronunciationNote status={status} />
    </section>
  )
}
