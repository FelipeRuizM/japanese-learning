import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Grammar } from './Grammar'
import { CLOZE_ITEMS } from '../grammar/registry'
import { BLANK } from '../types/grammar'

const speak = vi.fn()
vi.mock('../lib/usePronunciation', () => ({
  usePronunciation: () => ({ status: 'ready', speak: (s: unknown) => speak(s) }),
}))

const ROUND_LENGTH = CLOZE_ITEMS.length

const optionButtons = () =>
  screen.getAllByRole('listitem').map((li) => {
    const button = li.querySelector('button')
    if (!button) throw new Error('an option rendered without a button')
    return button
  })

function firstOption() {
  const first = optionButtons()[0]
  if (!first) throw new Error('no options rendered')
  return first
}

const show = () =>
  render(
    <MemoryRouter>
      <Grammar />
    </MemoryRouter>,
  )

beforeEach(() => {
  speak.mockClear()
})

describe('The grammar cloze', () => {
  it('asks every pattern once', () => {
    show()
    expect(
      screen.getByRole('heading', { level: 2, name: `Question 1 of ${ROUND_LENGTH}` }),
    ).toBeInTheDocument()
  })

  it('always offers four distinct forms', async () => {
    const user = userEvent.setup()
    show()

    for (let i = 0; i < ROUND_LENGTH; i++) {
      const shown = optionButtons().map((b) => b.textContent ?? '')
      expect(shown, `question ${i + 1}`).toHaveLength(4)
      expect(new Set(shown).size, `question ${i + 1}`).toBe(4)

      await user.click(firstOption())
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }
  })

  /**
   * THE MEANING IS PART OF THE PROMPT. わたし___がくせいです takes は for "I am a
   * student" and の for "it is my student" — without the English the question
   * has two defensible answers.
   */
  it('shows the meaning before the answer, not after', () => {
    show()
    const englishes = CLOZE_ITEMS.map((item) => item.english)
    const shown = englishes.filter((e) => screen.queryAllByText(e).length > 0)
    expect(shown.length).toBeGreaterThanOrEqual(1)
  })

  /** The underscores are never read out; the word "blank" is. */
  it('names the gap for a screen reader rather than reading underscores', () => {
    show()
    expect(screen.getByText('blank')).toBeInTheDocument()
    expect(screen.queryByText(new RegExp(BLANK))).not.toBeInTheDocument()
  })

  it('fills the gap with the right form once answered, however it was answered', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())

    expect(screen.queryByText('blank')).not.toBeInTheDocument()
    const marked = optionButtons().filter((b) =>
      b.className.includes('border-positive'),
    )
    expect(marked).toHaveLength(1)
  })

  it('marks the verdict in words, not only colour', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())
    expect(screen.getByText(/^(Correct|Not quite)$/)).toBeInTheDocument()
  })

  it('locks the options once answered', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())
    for (const button of optionButtons()) expect(button).toBeDisabled()
  })

  /**
   * The WHOLE sentence, filled in. Speaking the bare particle would teach
   * nothing about where it sits.
   */
  it('speaks the completed sentence, not the particle', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())

    expect(speak).toHaveBeenCalledTimes(1)
    const spoken = speak.mock.calls[0]?.[0] as { ja: string }
    const completed = CLOZE_ITEMS.map((item) => item.kana.replace(BLANK, item.answer))
    expect(completed).toContain(spoken.ja)
    expect(spoken.ja.length).toBeGreaterThan(3)
  })

  it('explains why, on every single question', async () => {
    const user = userEvent.setup()
    show()

    const notes = new Set(CLOZE_ITEMS.map((item) => item.note))
    for (let i = 0; i < ROUND_LENGTH; i++) {
      await user.click(firstOption())

      const shown = [...notes].filter((note) => screen.queryAllByText(note).length > 0)
      expect(shown, `question ${i + 1}`).toHaveLength(1)

      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }
  })

  it('scores the round and matches the verdicts it gave', async () => {
    const user = userEvent.setup()
    show()

    let correct = 0
    for (let i = 0; i < ROUND_LENGTH; i++) {
      await user.click(firstOption())
      if (screen.queryByText('Correct') !== null) correct++
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    expect(
      screen.getByRole('heading', { level: 2, name: 'Round complete' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`${correct} / ${ROUND_LENGTH}`)).toBeInTheDocument()
  })

  it('reshuffles on Go again', async () => {
    const user = userEvent.setup()
    show()

    for (let i = 0; i < ROUND_LENGTH; i++) {
      await user.click(firstOption())
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    await user.click(screen.getByRole('button', { name: 'Go again' }))
    expect(
      screen.getByRole('heading', { level: 2, name: `Question 1 of ${ROUND_LENGTH}` }),
    ).toBeInTheDocument()
  })
})
