import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Characters } from './Characters'
import { DeckProvider } from '../data/DeckProvider'
import { CHARACTER_SETS } from '../characters/registry'

const [FIRST, SECOND] = CHARACTER_SETS

function renderPage() {
  return render(
    <MemoryRouter>
      <DeckProvider>
        <Characters />
      </DeckProvider>
    </MemoryRouter>,
  )
}

describe('the characters page', () => {
  it('opens with an empty deck', () => {
    renderPage()
    expect(screen.getByText('0 of 71 selected')).toBeInTheDocument()
  })

  /**
   * With nothing selected these links would open onto an empty state, so they
   * are absent rather than disabled. The primary nav still carries both routes
   * for anyone who wants to look.
   */
  it('offers no through-links until something is selected', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByRole('link', { name: /flashcards/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /quiz/i })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'か ka' }))

    expect(screen.getByText('1 of 71 selected')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Study 1 as flashcards' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Quiz me' })).toBeInTheDocument()
  })

  it('selects every character, then clears them', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByText('71 of 71 selected')).toBeInTheDocument()

    // The same control flips to the opposite action once the deck is full.
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('0 of 71 selected')).toBeInTheDocument()
  })

  it('keeps the count in step with a row selection', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: 'S row, select all' }))
    expect(screen.getByText('5 of 71 selected')).toBeInTheDocument()

    // The や-row has two gaps, so it contributes three, not five.
    await user.click(screen.getByRole('button', { name: 'Y row, select all' }))
    expect(screen.getByText('8 of 71 selected')).toBeInTheDocument()
  })
})

/**
 * The picker and the deck under it.
 *
 * The deck is ONE deck across every chart — an id is script-qualified, so あ
 * and ア can both sit in it and the quiz can ask you to tell them apart. That
 * makes the counting rules the thing worth pinning: what belongs to the chart
 * on screen, what belongs to the deck, and which control wipes which.
 */
describe('two charts, one deck', () => {
  it('swaps the chart without touching what is selected', async () => {
    const user = userEvent.setup()
    renderPage()
    expect(SECOND).toBeDefined()
    if (!SECOND || !FIRST) return

    await user.click(screen.getByRole('button', { name: 'か ka' }))
    expect(screen.getByText('1 of 71 selected')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: SECOND.label }))

    // A different chart: the cell that was there is gone, its counterpart is
    // present, and neither is selected.
    expect(screen.queryByRole('button', { name: 'か ka' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'カ ka' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )

    // Nothing selected HERE, but the deck still holds what it held.
    expect(screen.getByText('0 of 71 selected')).toBeInTheDocument()
    expect(screen.getByText('+1 on another chart')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Study 1 as flashcards' }),
    ).toBeInTheDocument()
  })

  it('holds the same reading from both charts at once', async () => {
    const user = userEvent.setup()
    renderPage()
    if (!SECOND || !FIRST) return

    await user.click(screen.getByRole('button', { name: 'か ka' }))
    await user.click(screen.getByRole('button', { name: SECOND.label }))
    await user.click(screen.getByRole('button', { name: 'カ ka' }))

    // Two characters, one reading, one deck. This is the pair the quiz exists
    // to drill, and it is only possible because ids are script-qualified.
    expect(screen.getByText('1 of 71 selected')).toBeInTheDocument()
    expect(screen.getByText('+1 on another chart')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Study 2 as flashcards' }),
    ).toBeInTheDocument()
  })

  /**
   * "Select all" is about the chart you can see. Making it wipe the other half
   * of a deck you cannot see would be a surprise, so clearing everything is a
   * separate control that says so.
   */
  it('scopes select-all to the visible chart, and names the wider clear', async () => {
    const user = userEvent.setup()
    renderPage()
    if (!SECOND || !FIRST) return

    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByText('71 of 71 selected')).toBeInTheDocument()
    // Nothing else is selected, so a second clear control would be redundant.
    expect(screen.queryByRole('button', { name: 'Clear deck' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: SECOND.label }))
    await user.click(screen.getByRole('button', { name: 'Select all' }))
    expect(screen.getByText('71 of 71 selected')).toBeInTheDocument()
    expect(screen.getByText('+71 on another chart')).toBeInTheDocument()

    // Clears this chart only. The other 71 survive.
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect(screen.getByText('0 of 71 selected')).toBeInTheDocument()
    expect(screen.getByText('+71 on another chart')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Clear deck' }))
    expect(screen.getByText('0 of 71 selected')).toBeInTheDocument()
    expect(screen.queryByText(/on another chart/)).not.toBeInTheDocument()
  })
})
