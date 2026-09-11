import { useState } from 'react'
import { buildNumberRound, type NumberQuestion } from '../lib/numbers'
import { systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { NumberCard } from '../components/NumberCard'
import { Button, Chip, HeadingLabel } from '../components/ui/primitives'

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

  return (
    <section className="flex flex-col gap-6">
      <Round
        key={roundId}
        onAgain={() => {
          setRoundId((n) => n + 1)
        }}
      />
    </section>
  )
}

function Round({ onAgain }: { onAgain: () => void }) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would redraw the
  // questions underneath the learner.
  const [questions] = useState<NumberQuestion[]>(() => buildNumberRound(systemRng))

  const [index, setIndex] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)
  const [score, setScore] = useState(0)
  const [done, setDone] = useState(false)

  const question = questions[index]

  if (done || !question) {
    return <RoundSummary score={score} total={questions.length} onAgain={onAgain} />
  }

  const choose = (option: string) => {
    if (chosen !== null) return
    setChosen(option)
    if (option === question.prompt.reading) setScore((s) => s + 1)
    // Hearing the reading at the moment of the reveal is the point, whether or
    // not they got it right. The READING, never the numeral — a ja-JP voice
    // handed "47" would read it, but the drill is about the kana.
    speak({ ja: question.prompt.reading })
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

      <NumberCard
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
          ? 'Every one. The next round draws different numbers.'
          : 'Nothing is recorded — start another round whenever you like.'}
      </p>
      <Button variant="primary" onClick={onAgain}>
        Go again
      </Button>
    </div>
  )
}
