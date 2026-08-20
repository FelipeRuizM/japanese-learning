import type { CharacterRow, CharacterSet } from '../types/characters'
import { useDeck } from '../data/useDeck'
import { hasAll } from '../data/deck'
import { GridCell } from './GridCell'
import { GridLayout } from './GridLayout'

/**
 * The deck selector.
 *
 * It takes a `CharacterSet` and knows nothing about which script it is showing
 * — that is the point of the abstraction, and `tests/abstraction.test.ts`
 * enforces it. The chart SHAPE lives in `GridLayout`, shared with the
 * pronunciation chart so the two cannot drift.
 */
export function CharacterGrid({ set }: { set: CharacterSet }) {
  const deck = useDeck()

  const idsIn = (row: CharacterRow): string[] =>
    row.cells.filter((cell) => cell !== null).map((cell) => cell.id)

  /**
   * "K-row" reads as a heading in the chart but only "K" fits the label column.
   * The accessible name is built from this same string so the two never
   * diverge — the Phase 7 audit caught them doing exactly that.
   */
  const shortLabel = (label: string): string => label.replace('-row', '')

  return (
    <GridLayout
      set={set}
      renderRowLabel={(row) => {
        const ids = idsIn(row)
        const full = hasAll(deck.selected, ids)
        const matrix = set.layout === 'matrix'
        const label = matrix ? shortLabel(row.label) : row.label

        return (
          <button
            type="button"
            onClick={() => (full ? deck.deselect(ids) : deck.select(ids))}
            // Opens with the VISIBLE text, so the accessible name and what a
            // voice-control user can read agree.
            aria-label={`${label}${matrix ? ' row' : ''}, ${full ? 'clear all' : 'select all'}`}
            className={
              matrix
                ? 'flex cursor-pointer items-center justify-center rounded-sm px-0.5 text-center font-sans text-label leading-tight tracking-[0.08em] text-ink-2 uppercase transition-colors hover:bg-accent-soft hover:text-ink-0'
                : 'cursor-pointer self-start rounded-sm font-sans text-label tracking-[0.08em] text-ink-2 uppercase transition-colors hover:text-ink-0'
            }
          >
            {label}
          </button>
        )
      }}
      renderCell={(character) => (
        <GridCell
          character={character}
          selected={deck.has(character.id)}
          onToggle={deck.toggle}
        />
      )}
    />
  )
}
