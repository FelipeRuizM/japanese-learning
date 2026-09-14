import { Button, HeadingLabel, Label } from './ui/primitives'

/**
 * The end of a pass through a stack of flashcards.
 *
 * THE BIG NUMBER IS WHAT YOU DID NOT MARK, not what you did. Marking is
 * one-sided — every card counts as right unless you say otherwise — so the
 * figure that answers "how did that go" is the unmarked count, and showing the
 * marked count large would read as a score where a bigger number is worse.
 *
 * The assumption is stated on screen rather than left to be inferred. A learner
 * who paged past ten cards without flipping them will see those ten counted as
 * right, and should be told that is what the number means rather than working
 * it out from a discrepancy.
 */
export function PassSummary({
  total,
  marked,
  onRedo,
  onAgain,
}: {
  total: number
  marked: number
  onRedo: () => void
  onAgain: () => void
}) {
  const clean = marked === 0

  return (
    <div className="flex flex-col items-start gap-4">
      <HeadingLabel>Pass complete</HeadingLabel>
      <p className="m-0 font-sans text-5xl font-semibold text-ink-0">
        {total - marked} / {total}
      </p>
      <Label>Unmarked cards count as right</Label>
      <p className="m-0 max-w-prose text-ink-1">
        {clean
          ? 'You marked nothing. Go again whenever you like — nothing is recorded.'
          : `You marked ${marked} to come back to.`}
      </p>
      <div className="flex flex-wrap gap-3">
        {clean ? null : (
          <Button variant="primary" onClick={onRedo}>
            {/* A redo pass can itself be marked, so this narrows each time
                rather than being a single second chance. */}
            Redo the {marked} you marked
          </Button>
        )}
        <Button variant={clean ? 'primary' : 'quiet'} onClick={onAgain}>
          Go again
        </Button>
      </div>
    </div>
  )
}
