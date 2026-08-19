import type { CharacterRow, CharacterSet } from '../types/characters'
import { useDeck } from '../data/useDeck'
import { hasAll } from '../data/deck'
import { GridCell, GridGap } from './GridCell'

/**
 * The character grid.
 *
 * It takes a `CharacterSet` and knows nothing about which script it is showing
 * — that is the whole point of the abstraction, and `tests/abstraction.test.ts`
 * enforces it.
 *
 * It branches on `set.layout`, a property of the SET rather than of this
 * component. A grid that hardcoded a five-column matrix is exactly what would
 * need rewriting when kanji arrives, so both branches exist now and both are
 * exercised — the `flow` branch by a fixture on /styleguide, so it is not
 * theoretical (CLAUDE.md §3.2).
 */
export function CharacterGrid({ set }: { set: CharacterSet }) {
  return set.layout === 'matrix' ? <MatrixGrid set={set} /> : <FlowGrid set={set} />
}

function idsIn(row: CharacterRow): string[] {
  return row.cells.filter((cell) => cell !== null).map((cell) => cell.id)
}

/** Column template: one narrow label column, then one per vowel. */
function columnStyle(columns: number) {
  return { gridTemplateColumns: `3.25rem repeat(${columns}, minmax(0, 1fr))` }
}

function MatrixGrid({ set }: { set: CharacterSet }) {
  const deck = useDeck()

  return (
    <div className="flex flex-col gap-2">
      {/* Column headers. Presentational — the vowel is already part of every
          cell's accessible name through its romaji, so repeating it here would
          just make each button announce twice. */}
      <div
        className="grid gap-1.5"
        style={columnStyle(set.columns.length)}
        aria-hidden="true"
      >
        <span />
        {set.columns.map((vowel) => (
          <span
            key={vowel}
            className="text-center font-sans text-label tracking-[0.08em] text-ink-2 uppercase"
          >
            {vowel}
          </span>
        ))}
      </div>

      {set.rows.map((row) => {
        const ids = idsIn(row)
        const full = hasAll(deck.selected, ids)

        return (
          <div
            key={row.id}
            className="grid gap-1.5"
            style={columnStyle(set.columns.length)}
          >
            <button
              type="button"
              onClick={() => (full ? deck.deselect(ids) : deck.select(ids))}
              aria-label={`${full ? 'Clear' : 'Select'} the ${row.label}`}
              className="flex cursor-pointer items-center justify-center rounded-sm px-0.5 text-center font-sans text-label leading-tight tracking-[0.08em] text-ink-2 uppercase transition-colors hover:bg-accent-soft hover:text-ink-0"
            >
              {/* The row label is the control. "K-row" reads as a heading but
                  behaves as select/clear, which the aria-label makes explicit. */}
              {row.label.replace('-row', '')}
            </button>

            {row.cells.map((cell, index) =>
              cell === null ? (
                <GridGap key={`${row.id}-gap-${String(index)}`} />
              ) : (
                <GridCell
                  key={cell.id}
                  character={cell}
                  selected={deck.has(cell.id)}
                  onToggle={deck.toggle}
                />
              ),
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * The no-matrix layout. Kanji has no vowel columns, so its characters simply
 * flow; rows become named groups rather than a grid of vowels.
 */
function FlowGrid({ set }: { set: CharacterSet }) {
  const deck = useDeck()

  return (
    <div className="flex flex-col gap-6">
      {set.rows.map((row) => {
        const ids = idsIn(row)
        const full = hasAll(deck.selected, ids)

        return (
          <section key={row.id} className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => (full ? deck.deselect(ids) : deck.select(ids))}
              aria-label={`${full ? 'Clear' : 'Select'} ${row.label}`}
              className="self-start cursor-pointer rounded-sm font-sans text-label tracking-[0.08em] text-ink-2 uppercase transition-colors hover:text-ink-0"
            >
              {row.label}
            </button>
            <div className="flex flex-wrap gap-1.5">
              {row.cells
                .filter((cell) => cell !== null)
                .map((cell) => (
                  <div key={cell.id} className="w-16">
                    <GridCell
                      character={cell}
                      selected={deck.has(cell.id)}
                      onToggle={deck.toggle}
                    />
                  </div>
                ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
