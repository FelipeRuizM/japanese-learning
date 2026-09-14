import type { ReactNode } from 'react'
import { Button, HeadingLabel } from './ui/primitives'

/**
 * The end of a quiz round, for all four quizzes.
 *
 * In component state and gone the moment the route unmounts — a score for the
 * round you just did is not progress tracking, and nothing here is written
 * anywhere (CLAUDE.md §10). THE RETRY DOES NOT CHANGE THAT: it is built from
 * the answers you gave in the round you are still in, and closing the tab ends
 * it.
 *
 * THE RETRY IS THE PRIMARY ACTION WHEN THERE IS ONE, and "Go again" steps down
 * to quiet. Someone who just missed six has a more useful next move than
 * re-drawing a full round, and the button that says what it will do — with the
 * number in it — is the one worth the accent.
 */
export function RoundSummary({
  score,
  total,
  missed,
  onRetry,
  onAgain,
  perfect,
  children,
}: {
  score: number
  total: number
  /** How many were answered wrongly. Zero hides the retry entirely. */
  missed: number
  onRetry: () => void
  onAgain: () => void
  /** What to say when they got everything right — each drill's own next step. */
  perfect: string
  /** Any further action this drill offers, such as changing the selection. */
  children?: ReactNode
}) {
  const flawless = missed === 0

  return (
    <div className="flex flex-col items-start gap-4">
      <HeadingLabel>Round complete</HeadingLabel>
      <p className="m-0 font-sans text-5xl font-semibold text-ink-0">
        {score} / {total}
      </p>
      <p className="m-0 max-w-prose text-ink-1">
        {flawless ? perfect : 'Nothing is recorded — go again whenever you like.'}
      </p>
      <div className="flex flex-wrap gap-3">
        {flawless ? null : (
          <Button variant="primary" onClick={onRetry}>
            {/* The count is in the label because "Retry" alone does not say how
                much work it is, and six is a different decision from one. */}
            Retry the {missed} you missed
          </Button>
        )}
        <Button variant={flawless ? 'primary' : 'quiet'} onClick={onAgain}>
          Go again
        </Button>
        {children}
      </div>
    </div>
  )
}
