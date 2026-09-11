import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Vocabulary } from './Vocabulary'
import { VOCAB_SETS, allVocab } from '../vocab/registry'
import type { VocabSet } from '../types/vocab'

const speak = vi.fn()
vi.mock('../lib/usePronunciation', () => ({
  usePronunciation: () => ({ status: 'ready', speak: (s: unknown) => speak(s) }),
}))

/**
 * The set is shuffled once per visit, so no test may depend on WHICH card is
 * first. Every assertion below is about the card on screen, whichever it is.
 */
const card = () => screen.getByRole('button', { expanded: false })
const flipped = () => screen.getByRole('button', { expanded: true })

function firstSet(): VocabSet {
  const set = VOCAB_SETS[0]
  if (!set) throw new Error('no vocabulary set is registered')
  return set
}

const PROMPT = 'Show the meaning of '

/**
 * Which item is on screen, read off the card's accessible name.
 *
 * MATCHED EXACTLY, NOT BY `includes`. Three pairs in Week 1 are prefixes of each
 * other — ありがとう/ありがとうございます, おはよう/おはようございます — so a
 * substring search returns the short one whenever the shuffle deals the long
 * one, and the test then fails about one visit in eight. It did.
 */
function currentItem() {
  const name = card().getAttribute('aria-label') ?? ''
  const kana = name.startsWith(PROMPT) ? name.slice(PROMPT.length) : ''
  const item = allVocab(firstSet()).find((i) => i.kana === kana)
  if (!item) throw new Error(`no item matched "${name}"`)
  return item
}

const show = () =>
  render(
    <MemoryRouter>
      <Vocabulary />
    </MemoryRouter>,
  )

beforeEach(() => {
  speak.mockClear()
})

describe('Vocabulary flashcards', () => {
  it('offers every registered set, with the first one pressed', () => {
    show()
    expect(screen.getByRole('group', { name: 'Vocabulary set' })).toBeInTheDocument()

    for (const set of VOCAB_SETS) {
      expect(screen.getByRole('button', { name: set.label })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: firstSet().label })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('counts the cards in the chosen set, and heads the position', () => {
    show()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Card 1 of ${allVocab(firstSet()).length}`,
      }),
    ).toBeInTheDocument()
  })

  /**
   * THE FRONT MUST NOT CARRY THE ANSWER, and an `aria-label` is DOM — the same
   * rule writing practice is built on (CLAUDE.md §1, bite 10). Both faces are
   * rendered so the card has something to flip to, which makes the accessible
   * name the only thing between a screen-reader user and the meaning.
   */
  it('does not name the meaning before the reveal', () => {
    show()
    // `currentItem` throws unless the name is exactly the prompt plus a real
    // item's kana, so resolving one is itself the assertion that nothing else
    // is in there.
    const item = currentItem()
    const name = card().getAttribute('aria-label') ?? ''

    expect(name).toContain(item.kana)
    expect(name).not.toContain(item.english)
    expect(name).not.toContain(item.romaji)
    if (item.note !== undefined) expect(name).not.toContain(item.note)
  })

  it('gives the reading and the meaning once flipped', async () => {
    const user = userEvent.setup()
    show()
    const item = currentItem()

    await user.click(card())

    expect(flipped()).toHaveAccessibleName(
      `${item.kana} is "${item.romaji}" — ${item.english}. Hide the meaning.`,
    )
    expect(screen.getByText(item.english)).toBeInTheDocument()
  })

  /**
   * A category beside a prompt is a hint: "Meals" narrows いただきます to one of
   * two. The group belongs to the reveal, where it is context instead.
   */
  it('withholds the group label until the reveal', async () => {
    const user = userEvent.setup()
    show()
    const groups = firstSet().groups.map((g) => g.label)

    for (const label of groups) {
      expect(screen.queryByText(label)).not.toBeInTheDocument()
    }

    await user.click(card())
    const shown = groups.filter((label) => screen.queryByText(label) !== null)
    expect(shown).toHaveLength(1)
  })

  it('speaks on the reveal and stays silent flipping back', async () => {
    const user = userEvent.setup()
    show()
    const item = currentItem()

    await user.click(card())
    expect(speak).toHaveBeenCalledTimes(1)
    // The KANA, never the romaji — a ja-JP voice reads romaji as English.
    expect(speak).toHaveBeenCalledWith({ ja: item.kana })

    await user.click(flipped())
    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('starts each new card face down', async () => {
    const user = userEvent.setup()
    show()

    await user.click(card())
    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(screen.queryByRole('button', { expanded: true })).not.toBeInTheDocument()
  })

  /**
   * THE TRANSITION LEAK (CLAUDE.md §5, bite 13).
   *
   * Advancing from a revealed card changes the item and clears `revealed` in
   * one render. On a single DOM node the browser animates
   * `rotateY(180deg) → 0deg`, and past the midpoint the face toward the viewer
   * is the back of the card now holding the NEXT item — its meaning, legible in
   * the wobble. A freshly mounted node has no previous value to interpolate
   * from, so there is nothing to animate and nothing to glimpse.
   *
   * jsdom runs no transitions, so this asserts node identity rather than
   * appearance. That identity is what makes the leak impossible.
   */
  it('mounts a new node when advancing from a revealed card', async () => {
    const user = userEvent.setup()
    show()

    await user.click(card())
    const revealedNode = flipped()
    expect(revealedNode.style.transform).toBe('rotateY(180deg)')

    await user.click(screen.getByRole('button', { name: 'Next' }))

    expect(card()).not.toBe(revealedNode)
    expect(card().style.transform).toBe('rotateY(0deg)')
  })

  it('mounts a new node going back, too', async () => {
    const user = userEvent.setup()
    show()

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(card())
    const revealedNode = flipped()

    await user.click(screen.getByRole('button', { name: 'Previous' }))

    expect(card()).not.toBe(revealedNode)
    expect(card().style.transform).toBe('rotateY(0deg)')
  })

  /** A real flip must still animate — it is functional motion, not decoration. */
  it('keeps the same node when flipping one card', async () => {
    const user = userEvent.setup()
    show()

    const front = card()
    await user.click(front)

    expect(flipped()).toBe(front)
    expect(front.style.transform).toBe('rotateY(180deg)')
  })

  it('walks the whole set and stops at both ends', async () => {
    const user = userEvent.setup()
    show()
    const total = allVocab(firstSet()).length

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()

    for (let i = 1; i < total; i++) {
      await user.click(screen.getByRole('button', { name: 'Next' }))
    }

    expect(
      screen.getByRole('heading', { level: 2, name: `Card ${total} of ${total}` }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
  })

  it('switches sets and starts the new one from the top', async () => {
    const user = userEvent.setup()
    show()
    const second = VOCAB_SETS[1]
    if (!second) throw new Error('this test needs a second set')

    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: second.label }))

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: `Card 1 of ${allVocab(second).length}`,
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: second.label })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('cites the class note the set came from', () => {
    show()
    expect(screen.getByText(`From ${firstSet().source}.`)).toBeInTheDocument()
  })
})
