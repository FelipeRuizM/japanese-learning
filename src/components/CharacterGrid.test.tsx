import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { CharacterGrid } from './CharacterGrid'
import { DeckProvider } from '../data/DeckProvider'
import { DEFAULT_CHARACTER_SET } from '../characters/registry'
import { FLOW_FIXTURE } from '../characters/flowFixture'
import type { CharacterSet } from '../types/characters'

function renderGrid(set: CharacterSet) {
  return render(
    <DeckProvider>
      <CharacterGrid set={set} />
    </DeckProvider>,
  )
}

/** Every cell button, excluding the row-label select/clear controls. */
function cells() {
  return screen
    .getAllByRole('button')
    .filter((button) => button.getAttribute('aria-pressed') !== null)
}

describe('CharacterGrid — matrix layout', () => {
  it('renders one toggle per character and no button for a gap', () => {
    renderGrid(DEFAULT_CHARACTER_SET)
    expect(cells()).toHaveLength(46)
  })

  it('starts with nothing selected', () => {
    renderGrid(DEFAULT_CHARACTER_SET)
    expect(cells().every((cell) => cell.getAttribute('aria-pressed') === 'false')).toBe(
      true,
    )
  })

  it('selects and deselects a character', async () => {
    const user = userEvent.setup()
    renderGrid(DEFAULT_CHARACTER_SET)

    const ka = screen.getByRole('button', { name: /か ka/ })
    expect(ka).toHaveAttribute('aria-pressed', 'false')

    await user.click(ka)
    expect(ka).toHaveAttribute('aria-pressed', 'true')

    await user.click(ka)
    expect(ka).toHaveAttribute('aria-pressed', 'false')
  })

  it('takes a whole row from its label, then clears it', async () => {
    const user = userEvent.setup()
    renderGrid(DEFAULT_CHARACTER_SET)

    await user.click(screen.getByRole('button', { name: 'Select the K-row' }))
    expect(
      cells().filter((c) => c.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(5)

    // The same control now offers the opposite action — that is the toggle.
    await user.click(screen.getByRole('button', { name: 'Clear the K-row' }))
    expect(
      cells().filter((c) => c.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(0)
  })

  /**
   * The row that has to work is the one with gaps: selecting the や-row must
   * take three characters, not five, and must not crash on the two nulls.
   */
  it('handles a row with gaps', async () => {
    const user = userEvent.setup()
    renderGrid(DEFAULT_CHARACTER_SET)

    await user.click(screen.getByRole('button', { name: 'Select the Y-row' }))
    expect(
      cells().filter((c) => c.getAttribute('aria-pressed') === 'true'),
    ).toHaveLength(3)
  })

  it('shows romaji beside every glyph, so a beginner can read the grid', () => {
    renderGrid(DEFAULT_CHARACTER_SET)
    const ka = screen.getByRole('button', { name: /か ka/ })
    expect(within(ka).getByText('ka')).toBeInTheDocument()
  })
})

describe('CharacterGrid — flow layout', () => {
  /**
   * The kanji path. It exists so that a set with no vowel columns does not
   * force a rewrite, and it is tested here so it is a capability rather than a
   * claim (CLAUDE.md §3.2).
   */
  it('renders a set that has no vowel matrix', async () => {
    const user = userEvent.setup()
    renderGrid(FLOW_FIXTURE)

    expect(FLOW_FIXTURE.columns).toHaveLength(0)
    expect(cells()).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'Select Numbers' }))
    expect(cells().every((c) => c.getAttribute('aria-pressed') === 'true')).toBe(true)
  })
})
