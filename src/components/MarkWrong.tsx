import { Toggle } from './ui/primitives'

/**
 * "I got that one wrong."
 *
 * ONE-SIDED, because grading forty-four cards you knew is work nobody will do.
 * Every card counts as right until this is pressed, so there is no "I got it
 * right" control and no third, unset state to explain.
 *
 * IT IS AN ACCENT TOGGLE, NOT A RED ONE, and that is a rule rather than a
 * preference: semantic colour is reserved for quiz feedback and may never fill
 * (CLAUDE.md §7). This is a selection — the same "this one is on" every other
 * toggle in the app expresses — and what makes it mean *wrong* is the word on
 * it, which is also the channel that survives a colour-blind reader.
 *
 * ALWAYS ON SCREEN, not only after the reveal. Paging back to a card has to
 * show whether it is marked, and a control that appears only once you have
 * flipped would hide that until you flipped it again.
 */
export function MarkWrong({
  marked,
  onToggle,
}: {
  marked: boolean
  onToggle: () => void
}) {
  return (
    <Toggle size="sm" pressed={marked} onClick={onToggle}>
      {marked ? 'Marked wrong' : 'Mark wrong'}
    </Toggle>
  )
}
