import type { VocabEntry } from '../types/vocab'
import type { VocabQuizQuestion } from '../lib/vocabQuiz'
import { vocabDisplayValue } from '../lib/vocabQuiz'
import { Button, Glyph, Label } from './ui/primitives'

/**
 * One vocabulary question: a prompt, four options, and — once answered — the
 * truth plus the usage note and the example sentence.
 *
 * The sibling of `QuizCard`, for the same reason `VocabCard` is a sibling of
 * `Flashcard` (CLAUDE.md §11.4). The difference that matters is the OPTIONS:
 * a character quiz shows four glyphs or four short romaji, and this one may
 * show four English sentences — "I'm off — I'll go and come back" beside
 * "Take care — go and come back safely". That is a different layout problem,
 * not a different value in the same one, so the options here wrap and set in a
 * smaller face rather than sitting centred on one line.
 *
 * Feedback carries a WORD and a MARK, never colour alone (CLAUDE.md §7), and
 * semantic colour is text and a rule, never a fill.
 */
export function VocabQuizCard({
  question,
  chosen,
  onChoose,
  onNext,
  isLast,
}: {
  question: VocabQuizQuestion
  /** `null` until the learner commits to an answer. */
  chosen: VocabEntry | null
  onChoose: (option: VocabEntry) => void
  onNext: () => void
  isLast: boolean
}) {
  const answered = chosen !== null
  const correct = chosen?.item.id === question.answer.item.id
  const promptIsKana = question.direction === 'kana-to-english'
  const { item } = question.answer

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Label>{promptIsKana ? 'What does this mean?' : 'How is this written?'}</Label>
        {promptIsKana ? (
          <Glyph size="md">{item.kana}</Glyph>
        ) : (
          <p className="m-0 font-sans text-3xl font-semibold text-ink-0">
            {item.english}
          </p>
        )}
      </div>

      <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0 sm:grid-cols-2">
        {question.options.map((option) => {
          const isAnswer = option.item.id === question.answer.item.id
          const isChosen = option.item.id === chosen?.item.id

          return (
            <li key={option.item.id}>
              <button
                type="button"
                disabled={answered}
                onClick={() => onChoose(option)}
                aria-label={optionLabel(option, question)}
                className={[
                  'flex min-h-20 w-full cursor-pointer items-center justify-center',
                  'rounded-md border px-3 py-3 text-center transition-colors',
                  optionClasses({ answered, isAnswer, isChosen }),
                ].join(' ')}
              >
                {promptIsKana ? (
                  <span className="font-sans text-base font-medium text-balance">
                    {option.item.english}
                  </span>
                ) : (
                  <Glyph size="sm">{option.item.kana}</Glyph>
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
          <div aria-live="polite" className="flex flex-col gap-3">
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
            <p className="m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-ink-1">
              <Glyph size="sm">{item.kana}</Glyph>
              <span className="font-sans text-lg text-ink-0">{item.romaji}</span>
              <span className="font-sans text-ink-1">{item.english}</span>
            </p>

            {item.note !== undefined && (
              <p className="m-0 font-sans text-sm text-ink-2">{item.note}</p>
            )}

            {item.example !== undefined && (
              <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Glyph size="sm">{item.example.kana}</Glyph>
                <span className="font-sans text-ink-1">{item.example.romaji}</span>
                <span className="font-sans text-ink-2">— {item.example.english}</span>
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

/**
 * Spoken names, so a kana option is never announced as a bare string of
 * syllables. In the other direction the English already reads as itself.
 */
function optionLabel(option: VocabEntry, question: VocabQuizQuestion): string {
  const shown = vocabDisplayValue(option, question.direction)
  return question.direction === 'kana-to-english'
    ? shown
    : `${option.item.kana} ${option.item.romaji}`
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
