import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Flashcards } from './Flashcards'
import { DeckProvider } from '../data/DeckProvider'
import { CharacterGrid } from '../components/CharacterGrid'
import { allCharacters, DEFAULT_CHARACTER_SET } from '../characters/registry'

/** The grid fills the deck the way a person would, rather than by faking state. */
function renderCards() {
  return render(
    <MemoryRouter>
      <DeckProvider>
        <CharacterGrid set={DEFAULT_CHARACTER_SET} />
        <Flashcards />
      </DeckProvider>
    </MemoryRouter>,
  )
}

const card = () => screen.getByRole('button', { expanded: false })
const flippedCard = () => screen.getByRole('button', { expanded: true })

describe('flashcards', () => {
  /**
   * A primary screen: nothing persists between sessions by design, so every
   * refresh lands here.
   */
  it('explains itself when the deck is empty', () => {
    renderCards()
    expect(screen.getByText('Your deck is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choose characters' })).toBeInTheDocument()
  })

  it('shows one card per selected character', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    expect(screen.getByText('Card 1 of 5')).toBeInTheDocument()
  })

  /**
   * Both faces are in the DOM so the card has something to flip to, which means
   * the reading must NOT reach a screen reader until it is revealed — otherwise
   * there is nothing left to practise.
   */
  it('keeps the reading out of the accessible name until it is revealed', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    expect(card()).toHaveAccessibleName(/^Show the reading for .$/)

    await user.click(card())
    expect(flippedCard()).toHaveAccessibleName(/is ".+"\. Hide the reading\./)
  })

  it('reveals the example words only once flipped', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    expect(screen.queryByText('Used in')).not.toBeInTheDocument()

    await user.click(card())
    expect(screen.getByText('Used in')).toBeInTheDocument()
    // Every character carries at least one example, with its English meaning.
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
  })

  it('offers a replay control on the revealed side', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))
    await user.click(card())

    expect(screen.getByText('Play again')).toBeInTheDocument()
  })

  it('walks forward and back, and stops at both ends', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'Y row, select all' }))

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Card 2 of 3')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByText('Card 3 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(screen.getByText('Card 2 of 3')).toBeInTheDocument()
  })

  /** Carrying the flip across would hand over the next answer for free. */
  it('turns the next card face down', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'Y row, select all' }))

    await user.click(card())
    expect(screen.getByText('Used in')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.queryByText('Used in')).not.toBeInTheDocument()
    expect(card()).toBeInTheDocument()
  })

  /**
   * THE ANSWER MUST NEVER BE VISIBLE BEFORE IT IS EARNED, INCLUDING IN MOTION.
   *
   * Advancing from a revealed card used to leave the flip on the same DOM node,
   * so the browser animated rotateY(180deg) → 0deg — and past the halfway point
   * of that 300ms rotation the face toward the viewer was the back of the card
   * now holding the NEXT character. The next reading was readable in the wobble.
   *
   * jsdom runs no transitions, so this asserts the MECHANISM that makes one
   * impossible: the card that arrives is a different element, already at 0deg.
   * A CSS transition needs a previous value on the same node to interpolate
   * from, and a freshly mounted node has none.
   */
  it('mounts a new card rather than un-flipping the old one', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    await user.click(card())
    const revealedNode = flippedCard()
    expect(revealedNode.style.transform).toBe('rotateY(180deg)')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    const nextNode = card()
    expect(nextNode.style.transform).toBe('rotateY(0deg)')
    // The assertion that matters: nothing to animate FROM.
    expect(nextNode).not.toBe(revealedNode)
    expect(revealedNode).not.toBeInTheDocument()
  })

  /** The same, going backwards — Previous is no safer than Next. */
  it('mounts a new card when stepping backwards too', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(card())
    const revealedNode = flippedCard()

    await user.click(screen.getByRole('button', { name: 'Previous' }))
    expect(card()).not.toBe(revealedNode)
    expect(card().style.transform).toBe('rotateY(0deg)')
  })

  /**
   * The flip itself must still animate: it is functional motion, showing that
   * the two faces are one thing. Same card, same node, transform changes.
   */
  it('keeps the real flip on one node, so it still animates', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    const front = card()
    await user.click(front)
    expect(flippedCard()).toBe(front)
    expect(front.style.transform).toBe('rotateY(180deg)')
  })

  it('flips back to the front', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'K row, select all' }))

    await user.click(card())
    await user.click(flippedCard())

    expect(screen.queryByText('Used in')).not.toBeInTheDocument()
  })

  it('draws its cards from the deck, and only the deck', async () => {
    const user = userEvent.setup()
    renderCards()
    await user.click(screen.getByRole('button', { name: 'Y row, select all' }))

    const yRow = allCharacters(DEFAULT_CHARACTER_SET).filter((c) => c.rowId === 'y')
    const glyphs = new Set(yRow.map((c) => c.glyph))

    for (let i = 0; i < 3; i++) {
      const name = card().getAttribute('aria-label') ?? ''
      const shown = name.replace('Show the reading for ', '')
      expect(glyphs.has(shown)).toBe(true)
      if (i < 2) await user.click(screen.getByRole('button', { name: 'Next' }))
    }
  })
})
