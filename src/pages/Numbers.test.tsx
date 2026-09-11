import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Numbers } from './Numbers'
import { ageReading, countReading, ROUND_SHAPE, yearReading } from '../lib/numbers'

const speak = vi.fn()
vi.mock('../lib/usePronunciation', () => ({
  usePronunciation: () => ({ status: 'ready', speak: (s: unknown) => speak(s) }),
}))

const ROUND_LENGTH = ROUND_SHAPE.reduce((sum, part) => sum + part.count, 0)

/** Every CORRECT reading the drill can produce. Distractors are not in here. */
const EVERY_READING = new Set<string>([
  ...Array.from({ length: 100 }, (_, i) => countReading(i + 1)),
  ...Array.from({ length: 100 }, (_, i) => ageReading(i + 1)),
  ...Array.from({ length: 6 }, (_, i) => yearReading(i + 1)),
])

const KANA_ONLY = /^[ぁ-ゟ]+$/u

const optionButtons = () =>
  screen.getAllByRole('listitem').map((li) => {
    const button = li.querySelector('button')
    if (!button) throw new Error('an option rendered without a button')
    return button
  })

const show = () =>
  render(
    <MemoryRouter>
      <Numbers />
    </MemoryRouter>,
  )

/**
 * The first option on screen.
 *
 * These tests answer by position rather than by working out which option is
 * right. Whether the pick is correct is not the point — the wiring is: four
 * distinct options, a verdict, a locked question, a score that agrees with the
 * verdicts. `numbers.test.ts` is where the readings themselves are pinned.
 */
function firstOption() {
  const first = optionButtons()[0]
  if (!first) throw new Error('no options rendered')
  return first
}

beforeEach(() => {
  speak.mockClear()
})

describe('The numbers drill', () => {
  it('draws a fixed-length round rather than enumerating the range', () => {
    show()
    expect(
      screen.getByRole('heading', { level: 2, name: `Question 1 of ${ROUND_LENGTH}` }),
    ).toBeInTheDocument()
  })

  it('always offers four distinct readings', async () => {
    const user = userEvent.setup()
    show()

    for (let i = 0; i < ROUND_LENGTH; i++) {
      const shown = optionButtons().map((b) => b.textContent ?? '')
      expect(shown, `question ${i + 1}`).toHaveLength(4)
      expect(new Set(shown).size, `question ${i + 1}`).toBe(4)

      // Kana, and nothing else — no romaji and no numerals among the answers.
      //
      // NOT "every option is a valid reading": the first draft asserted that
      // and failed on ろくじゅうくさい, which is 69 with the DISCOURAGED く for
      // きゅう. The distractors are wrong readings on purpose, so a test
      // demanding they all be right contradicts the drill. What is correct is
      // pinned in `numbers.test.ts`.
      for (const reading of shown) {
        expect(reading, `"${reading}"`).toMatch(KANA_ONLY)
      }

      await user.click(firstOption())
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }
  })

  /**
   * The prompt is the only one in the app that is not Japanese — a numeral or a
   * short English phrase — and the options are the kana. That is the direction
   * the skill runs in: you meet 47 on a price tag and have to produce
   * よんじゅうなな.
   */
  it('asks in numerals and answers in kana', async () => {
    const user = userEvent.setup()
    show()

    const kinds = new Set<string>()
    for (let i = 0; i < ROUND_LENGTH; i++) {
      if (screen.queryByText('How do you say this number?')) kinds.add('count')
      if (screen.queryByText('How do you say this age?')) kinds.add('age')
      if (screen.queryByText('How do you say this year in school?')) kinds.add('year')

      await user.click(firstOption())
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    // Fixed proportions mean every round exercises all three forms.
    expect([...kinds].sort()).toEqual(['age', 'count', 'year'])
  })

  it('marks the right answer in words, not only colour', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())

    expect(screen.getByText(/^(Correct|Not quite)$/)).toBeInTheDocument()
    const marked = optionButtons().filter((b) =>
      b.className.includes('border-positive'),
    )
    expect(marked).toHaveLength(1)
  })

  it('locks the options once answered', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())
    for (const button of optionButtons()) expect(button).toBeDisabled()
  })

  /** The READING, never the numeral — a ja-JP voice would read "47" as a number. */
  it('speaks the reading on answering', async () => {
    const user = userEvent.setup()
    show()

    await user.click(firstOption())

    expect(speak).toHaveBeenCalledTimes(1)
    const spoken = speak.mock.calls[0]?.[0] as { ja: string }
    expect(EVERY_READING.has(spoken.ja), spoken.ja).toBe(true)
  })

  it('restates the answer even when it was right', async () => {
    const user = userEvent.setup()
    show()

    const marked = () =>
      optionButtons().find((b) => b.className.includes('border-positive'))

    await user.click(firstOption())
    const reading = marked()?.textContent ?? ''
    expect(reading).not.toBe('')

    // Once in the options, once in the restatement below the verdict.
    expect(screen.getAllByText(reading).length).toBeGreaterThanOrEqual(2)
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

  it('draws a fresh round on Go again', async () => {
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
