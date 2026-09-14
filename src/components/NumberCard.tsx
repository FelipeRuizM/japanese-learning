import type { NumberQuestion } from '../lib/numbers'
import { Verdict } from './ChoiceFeedback'
import { optionButtonClasses } from './optionStyles'
import { Glyph, Label } from './ui/primitives'

const ASKED = {
  count: 'How do you say this number?',
  age: 'How do you say this age?',
  year: 'How do you say this year in school?',
} as const

/**
 * One numbers question: a numeral, four readings, and the truth once answered.
 *
 * The prompt is the only one in the app that is NOT Japanese — it is a numeral
 * or a short English phrase, and the four options are the kana. That is the
 * right way round: a learner meets 47 on a price tag and has to produce
 * よんじゅうなな, not the reverse. Reading kana back into a number is the kana
 * quiz's job, not this drill's.
 *
 * Options are plain strings rather than model objects, because a reading is all
 * there is — the answer to "how do you say 47" is not an entity with an id, it
 * is a string the generator produced. The distinctness that makes the question
 * answerable is guaranteed in `numbers.ts`, not here.
 */
export function NumberCard({
  question,
  chosen,
  onChoose,
}: {
  question: NumberQuestion
  /** `null` until the learner commits to an answer. */
  chosen: string | null
  onChoose: (option: string) => void
}) {
  const answered = chosen !== null
  const { prompt } = question
  const correct = chosen === prompt.reading

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Label>{ASKED[prompt.kind]}</Label>
        <p className="m-0 font-sans text-6xl font-semibold text-ink-0">
          {prompt.label}
        </p>
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {question.options.map((option) => {
          const isAnswer = option === prompt.reading
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
                {/*
                  No `aria-label` here, unlike the other two quizzes. Theirs
                  exist to stop a screen reader running a glyph and its romaji
                  together; a reading is one run of kana inside a `lang="ja"`
                  span, which is already announced correctly. An added label
                  would only risk drifting from the visible text, which is the
                  defect the grid cell shipped in v1.3 (§8).
                */}
                <Glyph size="sm">{option}</Glyph>
              </button>
            </li>
          )
        })}
      </ul>

      {/* aria-live so the verdict reaches a screen reader without moving focus
          away from the option they just pressed. Navigation is a separate,
          always-present control now, so nothing steals focus on answering. */}
      {answered && (
        <div aria-live="polite" className="flex flex-col gap-3">
          <Verdict correct={correct} />

          {/* Always restated, even when they got it right — reading it back
                is what makes the pairing stick. */}
          <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-ink-1">
            <span className="font-sans text-lg text-ink-0">{prompt.label}</span>
            <Glyph size="sm">{prompt.reading}</Glyph>
          </p>
        </div>
      )}
    </div>
  )
}
