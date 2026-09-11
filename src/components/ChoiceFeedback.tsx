/**
 * The parts every four-option question shares.
 *
 * There are three of these now — characters, vocabulary and numbers — and the
 * verdict line, the option states and the two marks were identical in all
 * three. That was tolerable at two and is not at three, so the literally
 * duplicated pieces live here.
 *
 * `optionButtonClasses` lives next door in `optionStyles.ts` rather than here:
 * a module that exports both a component and a plain function defeats fast
 * refresh, and the lint rule that says so is right.
 *
 * WHAT IS NOT HERE IS THE CARD ITSELF. Each quiz still owns its own layout,
 * because the thing they genuinely differ in is the options: four glyphs, four
 * English sentences, four kana readings. A shared card would have to take the
 * prompt, the option renderer, the reveal and the labelling as parameters,
 * which is a parameter list wearing a component's clothes. This is the same
 * split `GridLayout` makes — share the shape, keep the behaviour separate.
 */

/**
 * The verdict, as a word and a mark.
 *
 * Colour is NEVER the only channel (CLAUDE.md §7). The semantic pair is
 * separated by lightness rather than hue because the hue axis collapses under
 * protanopia, and even then it is the third channel, after the word and the
 * mark. Semantic colour is text and a rule, never a fill.
 */
export function Verdict({ correct }: { correct: boolean }) {
  return (
    <p
      className={[
        'm-0 flex items-center gap-2 border-l-2 pl-3 font-sans font-medium',
        correct ? 'border-positive text-positive' : 'border-negative text-negative',
      ].join(' ')}
    >
      {correct ? <CheckMark /> : <CrossMark />}
      {correct ? 'Correct' : 'Not quite'}
    </p>
  )
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
