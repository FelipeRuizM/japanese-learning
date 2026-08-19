import type { Character } from '../types/characters'
import type { QuizQuestion } from '../lib/quiz'
import { displayValue } from '../lib/quiz'
import { Button, Glyph, Label } from './ui/primitives'

/**
 * One question: a prompt, four options, and — once answered — the truth plus an
 * example word.
 *
 * Feedback carries a WORD and a MARK, never colour alone (CLAUDE.md §7). The
 * semantic pair is separated by lightness rather than hue precisely because the
 * hue axis collapses for a protanope, and even then colour is only ever the
 * third channel.
 */
export function QuizCard({
  question,
  chosen,
  onChoose,
  onNext,
  isLast,
}: {
  question: QuizQuestion
  /** `null` until the learner commits to an answer. */
  chosen: Character | null
  onChoose: (option: Character) => void
  onNext: () => void
  isLast: boolean
}) {
  const answered = chosen !== null
  const correct = chosen?.id === question.answer.id
  const promptIsGlyph = question.direction === 'glyph-to-romaji'

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3">
        <Label>
          {promptIsGlyph ? 'Which sound is this?' : 'Which character is this?'}
        </Label>
        {promptIsGlyph ? (
          <Glyph size="lg">{question.answer.glyph}</Glyph>
        ) : (
          <p className="m-0 font-sans text-5xl font-semibold text-ink-0">
            {question.answer.romaji}
          </p>
        )}
      </div>

      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
        {question.options.map((option) => {
          const isAnswer = option.id === question.answer.id
          const isChosen = option.id === chosen?.id

          return (
            <li key={option.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onChoose(option)}
                aria-label={optionLabel(option, question)}
                className={[
                  'flex min-h-20 w-full cursor-pointer items-center justify-center',
                  'rounded-md border px-2 py-3 transition-colors',
                  optionClasses({ answered, isAnswer, isChosen }),
                ].join(' ')}
              >
                {promptIsGlyph ? (
                  <span className="font-sans text-2xl font-medium">
                    {option.romaji}
                  </span>
                ) : (
                  <Glyph size="md">{option.glyph}</Glyph>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      {answered && (
        <div className="flex flex-col gap-4">
          {/* aria-live so the verdict reaches a screen reader without moving
              focus away from where the learner is. */}
          <div aria-live="polite" className="flex flex-col gap-2">
            <p
              className={[
                'm-0 flex items-center gap-2 border-l-2 pl-3 font-sans font-medium',
                correct
                  ? 'border-positive text-positive'
                  : 'border-negative text-negative',
              ].join(' ')}
            >
              {correct ? <CheckMark /> : <CrossMark />}
              {correct ? 'Correct' : 'Not quite'}
            </p>

            {/* The answer is always restated, even when they got it right —
                reading it back is what makes the pairing stick. */}
            <p className="m-0 flex flex-wrap items-baseline gap-2 text-ink-1">
              <Glyph size="sm">{question.answer.glyph}</Glyph>
              <span className="font-sans text-lg text-ink-0">
                {question.answer.romaji}
              </span>
            </p>

            <ExampleWords character={question.answer} />
          </div>

          <Button variant="primary" onClick={onNext} autoFocus>
            {isLast ? 'See how you did' : 'Next'}
          </Button>
        </div>
      )}
    </div>
  )
}

/**
 * The example word, revealed on answering (CLAUDE.md §3.4). It is the context
 * that makes a sound more than a sound — and this is one of only two places it
 * appears.
 */
function ExampleWords({ character }: { character: Character }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0">
      {character.examples.map((example) => (
        <li key={example.kana} className="flex flex-wrap items-baseline gap-x-2">
          <Glyph size="sm">{example.kana}</Glyph>
          <span className="font-sans text-ink-1">{example.romaji}</span>
          <span className="font-sans text-ink-2">— {example.english}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * After answering, both the right answer and a wrong choice are marked. Showing
 * only what they picked leaves someone who guessed wrong without the thing they
 * came for.
 */
function optionClasses({
  answered,
  isAnswer,
  isChosen,
}: {
  answered: boolean
  isAnswer: boolean
  isChosen: boolean
}): string {
  if (!answered) {
    return 'border-rule bg-transparent text-ink-0 hover:border-accent hover:bg-accent-soft'
  }
  if (isAnswer) {
    // Semantic colour is text and a rule, never a fill (CLAUDE.md §7).
    return 'border-positive bg-transparent text-positive'
  }
  if (isChosen) return 'border-negative bg-transparent text-negative'
  return 'border-rule bg-transparent text-ink-3'
}

/** Spoken names, so an option is never announced as a bare kana. */
function optionLabel(option: Character, question: QuizQuestion): string {
  const shown = displayValue(option, question.direction)
  return question.direction === 'glyph-to-romaji'
    ? shown
    : `${option.glyph} ${option.romaji}`
}

/* Inline SVG — emoji as iconography is banned (CLAUDE.md §7). */
function CheckMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 8.5l3.5 3.5L13 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function CrossMark() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
