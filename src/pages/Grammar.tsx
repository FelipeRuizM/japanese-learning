import { useState } from 'react'
import { buildClozeRound, type ClozeQuestion } from '../lib/cloze'
import { CLOZE_ITEMS } from '../grammar/registry'
import { BLANK } from '../types/grammar'
import { systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { ClozeCard } from '../components/ClozeCard'
import { Button, Chip, HeadingLabel } from '../components/ui/primitives'

/**
 * The grammar cloze (CLAUDE.md §11.7).
 *
 * No picker and no mode toggle. です and の are mixed deliberately: telling them
 * apart is the skill, and a round that announced which point it was drilling
 * would answer half of every question in advance.
 *
 * A round is every pattern once, unlike the numbers drill — the patterns are a
 * finite authored list rather than a generated range, and there are few enough
 * that leaving one out would mean skipping something the class taught.
 */
export function Grammar() {
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
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<ClozeQuestion[]>(() =>
    buildClozeRound(CLOZE_ITEMS, systemRng),
  )

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
    if (option === question.item.answer) setScore((s) => s + 1)
    // The WHOLE sentence, filled in — hearing わたしはがくせいです as one phrase
    // is what a particle drill is ultimately for. Speaking the bare particle
    // would teach nothing about where it sits.
    speak({ ja: question.item.kana.replace(BLANK, question.item.answer) })
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

      <ClozeCard
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
          ? 'Every one. The next round shuffles them again.'
          : 'Nothing is recorded — start another round whenever you like.'}
      </p>
      <Button variant="primary" onClick={onAgain}>
        Go again
      </Button>
    </div>
  )
}
