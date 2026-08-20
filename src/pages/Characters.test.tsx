import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Characters } from './Characters'
import { DeckProvider } from '../data/DeckProvider'

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
