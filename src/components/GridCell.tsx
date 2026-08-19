import type { Character } from '../types/characters'
import { Glyph } from './ui/primitives'

/**
 * One selectable character.
 *
 * It is a real `<button>` with `aria-pressed`, not a checkbox and not a div
 * with a click handler: the semantics are "a control that is on or off", which
 * is what `aria-pressed` says and what gets keyboard support for free.
 *
 * The two children are separated by a real space in the DOM, so the computed
 * accessible name is "か ka" and a screen reader announces "か ka, pressed"
 * rather than running them together as "かka".
 *
 * An explicit `aria-label` did the same job until the Phase 7 audit caught what
 * it cost: the VISIBLE text was still "かka", so the label no longer matched it,
 * and a voice-control user saying what they can see would miss. Fixing the
 * source of the name rather than overriding it keeps both readings identical.
 *
 * Romaji is on screen for the reason a beginner needs it: they cannot yet read
 * the thing they are being asked to choose.
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
      {/* A real space, so the accessible name is "か ka" and not "かka". */}{' '}
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
