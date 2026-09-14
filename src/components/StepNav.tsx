import { Button } from './ui/primitives'

/**
 * Previous and Next, for anything you page through.
 *
 * THE QUIZZES MOVED THEIR "NEXT" OUT OF THE CARD TO GET HERE, and that was the
 * point rather than a side effect. It used to live inside the reveal, which
 * meant it existed only once a question was answered — so there was nowhere for
 * a "Previous" to go, and no way back off an unanswered question at all. A nav
 * that is always on screen has room for both, and it makes a quiz page and a
 * flashcard page work the same way, which they visibly did not before.
 *
 * Next is disabled rather than hidden while a question is unanswered: a control
 * that vanishes reads as "this screen has no next", which is not what happened.
 */
export function StepNav({
  label,
  nextLabel,
  onPrevious,
  onNext,
  canGoBack,
  canGoNext = true,
}: {
  /** Names the landmark — "Cards", "Questions". */
  label: string
  /** "Next", or what the last step says instead. */
  nextLabel: string
  onPrevious: () => void
  onNext: () => void
  canGoBack: boolean
  canGoNext?: boolean
}) {
  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3">
      <Button onClick={onPrevious} disabled={!canGoBack}>
        Previous
      </Button>
      <Button variant="primary" onClick={onNext} disabled={!canGoNext}>
        {nextLabel}
      </Button>
    </nav>
  )
}
