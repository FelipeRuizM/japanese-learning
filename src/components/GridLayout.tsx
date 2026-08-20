import type { ReactNode } from 'react'
import type { Character, CharacterRow, CharacterSet } from '../types/characters'

/**
 * The chart shape, with no opinion about what a cell DOES.
 *
 * Two grids consume it — the deck selector and the pronunciation chart — and
 * they share the layout precisely so it cannot drift. Duplicating the matrix
 * and flow branches would mean a future kanji set (which uses `flow`) had to be
 * made to work twice, which is the sort of drift this project's abstraction
 * exists to prevent.
 *
 * `layout` is a property of the SET, not of this component (CLAUDE.md §3.2).
 * Two branches, and no more.
 */
export function GridLayout({
  set,
  renderCell,
  renderRowLabel,
}: {
  set: CharacterSet
  renderCell: (character: Character) => ReactNode
  /** The leading column in a matrix, or the group heading in a flow. */
  renderRowLabel: (row: CharacterRow) => ReactNode
}) {
  return set.layout === 'matrix' ? (
    <Matrix set={set} renderCell={renderCell} renderRowLabel={renderRowLabel} />
  ) : (
    <Flow set={set} renderCell={renderCell} renderRowLabel={renderRowLabel} />
  )
}

/** Column template: one narrow label column, then one per vowel. */
function columnStyle(columns: number) {
  return { gridTemplateColumns: `3.25rem repeat(${columns}, minmax(0, 1fr))` }
}

function Matrix({
  set,
  renderCell,
  renderRowLabel,
}: {
  set: CharacterSet
  renderCell: (character: Character) => ReactNode
  renderRowLabel: (row: CharacterRow) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Column headers. Presentational — the vowel is already part of every
          cell's accessible name through its romaji, so repeating it here would
          just make each cell announce twice. */}
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

      {set.rows.map((row) => (
        <div
          key={row.id}
          className="grid gap-1.5"
          style={columnStyle(set.columns.length)}
        >
          {renderRowLabel(row)}
          {row.cells.map((cell, index) =>
            cell === null ? (
              /*
                A gap is empty space, not a disabled control: there is no
                character there to disable, and collapsing it would change the
                shape of the chart — which is part of what is being learned.
              */
              <div
                key={`${row.id}-gap-${String(index)}`}
                aria-hidden="true"
                className="min-h-14"
              />
            ) : (
              <div key={cell.id}>{renderCell(cell)}</div>
            ),
          )}
        </div>
      ))}
    </div>
  )
}

/** The no-matrix layout: rows become named groups rather than vowel columns. */
function Flow({
  set,
  renderCell,
  renderRowLabel,
}: {
  set: CharacterSet
  renderCell: (character: Character) => ReactNode
  renderRowLabel: (row: CharacterRow) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-6">
      {set.rows.map((row) => (
        <section key={row.id} className="flex flex-col gap-2">
          {renderRowLabel(row)}
          <div className="flex flex-wrap gap-1.5">
            {row.cells
              .filter((cell) => cell !== null)
              .map((cell) => (
                <div key={cell.id} className="w-16">
                  {renderCell(cell)}
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  )
}
