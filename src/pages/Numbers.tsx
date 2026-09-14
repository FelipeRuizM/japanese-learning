import { useState } from 'react'
import {
  buildNumberQuestion,
  buildNumberRound,
  type NumberQuestion,
} from '../lib/numbers'
import { shuffle, systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { NumberCard } from '../components/NumberCard'
import { StepNav } from '../components/StepNav'
import { RoundSummary } from '../components/RoundSummary'
import { useQuizRound } from '../lib/useQuizRound'
import { Chip, HeadingLabel, Label } from '../components/ui/primitives'

/**
 * The numbers drill (CLAUDE.md §11.3, §11.7).
 *
 * A ROUND IS A SAMPLE, NOT AN ENUMERATION. Everywhere else in this app a round
 * is "one question per thing you selected", because the things are a finite set
 * someone chose. Numbers are generated from a rule, so there is no set to
 * enumerate and no deck to fill — a round is twelve questions drawn across the
 * range, and "Go again" draws twelve more.
 *
 * There is no set picker and no mode toggle, because there is nothing to pick:
 * the proportions are fixed so that every round exercises all three forms
 * (`ROUND_SHAPE`). A uniform draw would regularly deal a round with no ages in
 * it, and the age irregulars are the hardest part of the topic.
 */
export function Numbers() {
  const [roundId, setRoundId] = useState(0)
  /** The questions a retry covers, or `null` for a freshly drawn round. */
  const [retryOver, setRetryOver] = useState<NumberQuestion[] | null>(null)

  return (
    <section className="flex flex-col gap-6">
      <Round
        key={roundId}
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
    </section>
  )
}

function Round({
  retryOver,
  onRetry,
  onAgain,
}: {
  retryOver: NumberQuestion[] | null
  onRetry: (missed: NumberQuestion[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would redraw the
  // questions underneath the learner.
  const [questions] = useState<NumberQuestion[]>(() =>
    retryOver === null
      ? buildNumberRound(systemRng)
      : // A RETRY ASKS THE SAME NUMBERS WITH NEW OPTIONS. Redrawing the
        // distractors matters more here than anywhere else: they are the
        // predicted mistakes (§11.6), so seeing the same four again teaches
        // which of four strings was right rather than how the reading is built.
        shuffle(retryOver, systemRng).map((q) =>
          buildNumberQuestion(q.prompt, systemRng),
        ),
  )

  const round = useQuizRound<NumberQuestion, string>(
    questions,
    (question, choice) => choice === question.prompt.reading,
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
        perfect="Every one. The next round draws different numbers."
      />
    )
  }

  const question = round.question

  const choose = (option: string) => {
    if (round.chosen !== null) return
    round.answer(option)
    // Hearing the reading at the moment of the reveal is the point, whether or
    // not they got it right. The READING, never the numeral — a ja-JP voice
    // handed "47" would read it, but the drill is about the kana.
    speak({ ja: question.prompt.reading })
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

      <NumberCard question={question} chosen={round.chosen} onChoose={choose} />

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
