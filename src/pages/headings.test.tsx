import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Characters } from './Characters'
import { Flashcards } from './Flashcards'
import { Quiz } from './Quiz'
import { NotFound } from './NotFound'
import { DeckProvider } from '../data/DeckProvider'
import { CharacterGrid } from '../components/CharacterGrid'
import { DEFAULT_CHARACTER_SET } from '../characters/registry'
import type { ReactNode } from 'react'

/**
 * Every route needs a heading of its own beneath the site-wide `h1`.
 *
 * This was NOT caught by axe — a missing heading is not a WCAG violation, so
 * both Flashcards and the quiz shipped with only the site `h1` until an audit
 * of the document outline found it. This test is the guard.
 */
function withDeck(children: ReactNode) {
  return render(
    <MemoryRouter>
      <DeckProvider>
        <CharacterGrid set={DEFAULT_CHARACTER_SET} />
        {children}
      </DeckProvider>
    </MemoryRouter>,
  )
}

const h2s = () => screen.getAllByRole('heading', { level: 2 })

describe('document outline', () => {
  it('gives the grid a heading', () => {
    withDeck(<Characters />)
    expect(h2s().length).toBeGreaterThanOrEqual(1)
  })

  it('gives the 404 page a heading', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )
    expect(h2s()).toHaveLength(1)
  })

  it('gives the empty states a heading', () => {
    withDeck(<Flashcards />)
    expect(
      screen.getByRole('heading', { level: 2, name: 'Your deck is empty' }),
    ).toBeInTheDocument()
  })

  it('gives flashcards a heading once a deck exists', async () => {
    const user = userEvent.setup()
    withDeck(<Flashcards />)
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Card 1 of 5' }),
    ).toBeInTheDocument()
  })

  it('gives the quiz a heading once a deck exists', async () => {
    const user = userEvent.setup()
    withDeck(<Quiz />)
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    expect(
      screen.getByRole('heading', { level: 2, name: 'Question 1 of 5' }),
    ).toBeInTheDocument()
  })

  it('gives the round summary a heading', async () => {
    const user = userEvent.setup()
    withDeck(<Quiz />)
    await user.click(screen.getByRole('button', { name: 'Y row, select all' }))

    for (let i = 0; i < 3; i++) {
      const option = screen.getAllByRole('listitem')[0]?.querySelector('button')
      if (!option) throw new Error('no option rendered')
      await user.click(option)
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    expect(
      screen.getByRole('heading', { level: 2, name: 'Round complete' }),
    ).toBeInTheDocument()
  })
})
