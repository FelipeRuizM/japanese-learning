import type { ClozeQuestion } from '../lib/cloze'
import { alsoCorrect } from '../lib/cloze'
import { BLANK } from '../types/grammar'
import { Verdict } from './ChoiceFeedback'
import { optionButtonClasses } from './optionStyles'
import { Button, Glyph, Label } from './ui/primitives'

/**
 * One cloze question: a sentence with a hole in it, its meaning, and four forms
 * that could fill the hole.
 *
 * THE MEANING IS PART OF THE PROMPT, not the reveal. Without it the question is
 * often unanswerable rather than merely hard: わたし___がくせいです takes は for
 * "I am a student" and の for "it is my student", and both are real sentences.
 * The English is what picks one, so it sits with the question.
 *
 * The blank fills in with the CORRECT form once answered, whatever was picked.
 * A learner who got it wrong still needs to see the finished sentence, which is
 * the thing they came for — the same reason the other quizzes mark the right
 * option rather than only the chosen one.
 */
export function ClozeCard({
  question,
  chosen,
  onChoose,
  onNext,
  isLast,
}: {
  question: ClozeQuestion
  /** `null` until the learner commits to an answer. */
  chosen: string | null
  onChoose: (option: string) => void
  onNext: () => void
  isLast: boolean
}) {
  const answered = chosen !== null
  const { item } = question
  const correct = chosen === item.answer
  const [before = '', after = ''] = item.kana.split(BLANK)
  const equally = alsoCorrect(item)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Label>Which one fills the gap?</Label>

        <p className="m-0 flex flex-wrap items-center justify-center gap-1">
          <Glyph size="sm">{before}</Glyph>
          {answered ? (
            <Glyph size="sm" className="text-accent">
              {item.answer}
            </Glyph>
          ) : (
            <span className="inline-flex items-center">
              {/*
                A screen reader would otherwise read three underscores, or
                nothing at all. The dashes are decoration; the word is the
                content.
              */}
              <span className="sr-only">blank</span>
              <span
                aria-hidden="true"
                className="inline-block w-12 border-b-2 border-dashed border-ink-3"
              />
            </span>
          )}
          <Glyph size="sm">{after}</Glyph>
        </p>

        <p className="m-0 max-w-prose font-sans text-lg text-ink-1">{item.english}</p>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {question.options.map((option) => {
          const isAnswer = option === item.answer
          const isChosen = option === chosen

          return (
            <li key={option}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onChoose(option)}
                className={[
                  'flex min-h-20 w-full cursor-pointer items-center justify-center',
                  'rounded-md border px-3 py-3 text-center transition-colors',
                  optionButtonClasses({ answered, isAnswer, isChosen }),
                ].join(' ')}
              >
                <Glyph size="sm">{option}</Glyph>
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div className="flex flex-col gap-4">
          {/* aria-live so the verdict reaches a screen reader without moving
              focus away from where the learner is. */}
          <div aria-live="polite" className="flex flex-col gap-3">
            <Verdict correct={correct} />

            <p className="m-0 font-sans text-lg text-ink-0">{item.romaji}</p>
            <p className="m-0 max-w-prose font-sans text-ink-1">{item.note}</p>

            {/*
              Not a rescue for a marked-wrong answer — the two halves of a pair
              are never offered together, so that cannot happen. This exists
              because the class taught both forms, and a drill that only ever
              showed one of them would quietly teach that the other is wrong.
            */}
            {equally.length > 0 && (
              <p className="m-0 max-w-prose font-sans text-sm text-ink-2">
                {equally.join(' / ')} would be just as correct here — a little more
                formal, and the same meaning.
              </p>
            )}
          </div>

          <Button variant="primary" onClick={onNext} autoFocus>
            {isLast ? 'See how you did' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  )
}
