import type { Character } from '../types/characters'
import { Glyph } from './ui/primitives'

/**
 * One selectable character.
 *
 * It is a real `<button>` with `aria-pressed`, not a checkbox and not a div
 * with a click handler: the semantics are "a control that is on or off", which
 * is what `aria-pressed` says and what gets keyboard support for free.
 *
 * The accessible name is set explicitly rather than left to the concatenation
 * of the two child elements, which produces "かka" with no separator — correct
 * to the spec, unhelpful when spoken. With the label, a screen reader announces
 * "か ka, pressed".
 *
 * Romaji is also on screen, for the reason a beginner needs it: they cannot yet
 * read the thing they are being asked to choose.
 */
export function GridCell({
  character,
  selected,
  onToggle,
}: {
  character: Character
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={`${character.glyph} ${character.romaji}`}
      onClick={() => onToggle(character.id)}
      className={[
        'flex w-full min-h-14 cursor-pointer flex-col items-center justify-center gap-0.5',
        'rounded-md border px-1 py-2 transition-colors',
        selected
          ? 'border-accent bg-accent text-ground'
          : 'border-rule bg-transparent text-ink-0 hover:bg-accent-soft',
      ].join(' ')}
    >
      <Glyph size="sm">{character.glyph}</Glyph>
      <span
        className={[
          'font-sans text-label tracking-[0.08em]',
          selected ? 'text-ground' : 'text-ink-2',
        ].join(' ')}
      >
        {character.romaji}
      </span>
    </button>
  )
}

/**
 * A gap in the chart — the や-row has no "yi", the わ-row has no "wi".
 *
 * It renders as empty space and is NOT a disabled button: there is no character
 * there to disable. It still occupies its cell, because collapsing the gap
 * would change the shape of the chart, and the shape is part of what is being
 * learned (CLAUDE.md §3.2).
 */
export function GridGap() {
  return <div aria-hidden="true" className="min-h-14" />
}
