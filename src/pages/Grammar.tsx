import { useState } from 'react'
import { buildClozeQuestion, buildClozeRound, type ClozeQuestion } from '../lib/cloze'
import { CLOZE_ITEMS } from '../grammar/registry'
import { BLANK } from '../types/grammar'
import { shuffle, systemRng } from '../lib/shuffle'
import { usePronunciation } from '../lib/usePronunciation'
import { PronunciationNote } from '../components/SpeakButton'
import { ClozeCard } from '../components/ClozeCard'
import { StepNav } from '../components/StepNav'
import { RoundSummary } from '../components/RoundSummary'
import { useQuizRound } from '../lib/useQuizRound'
import { Chip, HeadingLabel, Label } from '../components/ui/primitives'

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
  /** The questions a retry covers, or `null` for every pattern again. */
  const [retryOver, setRetryOver] = useState<ClozeQuestion[] | null>(null)

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
  retryOver: ClozeQuestion[] | null
  onRetry: (missed: ClozeQuestion[]) => void
  onAgain: () => void
}) {
  const { status, speak } = usePronunciation()

  // Built ONCE per round. `useState` with an initialiser rather than `useMemo`,
  // which React is free to discard and recompute — that would reshuffle the
  // questions underneath the learner.
  const [questions] = useState<ClozeQuestion[]>(() =>
    retryOver === null
      ? buildClozeRound(CLOZE_ITEMS, systemRng)
      : // A RETRY ASKS THE SAME SENTENCES WITH THE OPTIONS REDRAWN. They come
        // one per form group (§11.7), so a rebuilt question offers a different
        // です beside a different particle — the pattern is what is being
        // practised, not the position of four strings.
        shuffle(retryOver, systemRng).map((q) => buildClozeQuestion(q.item, systemRng)),
  )

  const round = useQuizRound<ClozeQuestion, string>(
    questions,
    (question, choice) => choice === question.item.answer,
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
        perfect="Every one. The next round shuffles them again."
      />
    )
  }

  const question = round.question

  const choose = (option: string) => {
    if (round.chosen !== null) return
    round.answer(option)
    // The WHOLE sentence, filled in — hearing わたしはがくせいです as one phrase
    // is what a particle drill is ultimately for. Speaking the bare particle
    // would teach nothing about where it sits.
    speak({ ja: question.item.kana.replace(BLANK, question.item.answer) })
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

      <ClozeCard question={question} chosen={round.chosen} onChoose={choose} />

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
