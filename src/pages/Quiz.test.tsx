import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Quiz } from './Quiz'
import { DeckProvider } from '../data/DeckProvider'
import { CharacterGrid } from '../components/CharacterGrid'
import { allCharacters, DEFAULT_CHARACTER_SET } from '../characters/registry'
import type { Character } from '../types/characters'

/**
 * The grid is rendered alongside the quiz so the deck can be filled the way a
 * person fills it, rather than by reaching into the provider. That keeps the
 * test honest about the wiring between the two.
 */
function renderQuiz() {
  return render(
    <MemoryRouter>
      <DeckProvider>
        <CharacterGrid set={DEFAULT_CHARACTER_SET} />
        <Quiz />
      </DeckProvider>
    </MemoryRouter>,
  )
}

const selectRow = async (user: ReturnType<typeof userEvent.setup>, label: string) => {
  await user.click(screen.getByRole('button', { name: `Select the ${label}` }))
}

/**
 * Which character the current question is about, read off the prompt rather
 * than assumed — the direction is chosen at random per question.
 */
function currentAnswer(): Character {
  const glyphPrompt = screen.queryByText('Which sound is this?')
  const all = allCharacters(DEFAULT_CHARACTER_SET)

  if (glyphPrompt) {
    const shown = document.querySelector('.text-glyph-lg')?.textContent ?? ''
    const found = all.find((c) => c.glyph === shown)
    if (!found) throw new Error(`Prompt glyph "${shown}" is not in the set`)
    return found
  }

  const shown = document.querySelector('.text-5xl')?.textContent ?? ''
  const found = all.find((c) => c.romaji === shown)
  if (!found) throw new Error(`Prompt romaji "${shown}" is not in the set`)
  return found
}

/** The accessible name QuizCard gives an option, in the current direction. */
function expectedLabel(character: Character): string {
  return screen.queryByText('Which sound is this?')
    ? character.romaji
    : `${character.glyph} ${character.romaji}`
}

/** The four answer buttons, which are the only ones inside a list item. */
function options() {
  return screen
    .getAllByRole('listitem')
    .map((item) => within(item).queryByRole('button'))
    .filter((button) => button !== null)
}

describe('the quiz', () => {
  /**
   * Nothing persists between sessions by design, so this is a primary screen
   * rather than an edge case — every refresh lands here.
   */
  it('explains itself when the deck is empty', () => {
    renderQuiz()
    expect(screen.getByText('Your deck is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Choose characters' })).toBeInTheDocument()
  })

  it('starts a round once characters are selected', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K-row')

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(options()).toHaveLength(4)
  })

  /**
   * Answers CORRECTLY on purpose rather than clicking the first option and
   * accepting either verdict: the example-word reveal is a stated requirement
   * (CLAUDE.md §3.4) and only a deliberate right answer proves it.
   */
  it('marks a correct answer and reveals an example word', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K-row')

    const answer = currentAnswer()
    const correct = options().find(
      (o) => o.getAttribute('aria-label') === expectedLabel(answer),
    )
    if (!correct) throw new Error(`No option matched the answer ${answer.glyph}`)

    await user.click(correct)

    expect(screen.getByText('Correct')).toBeInTheDocument()
    expect(screen.queryByText('Not quite')).not.toBeInTheDocument()

    // The example word for that character, on screen.
    const example = answer.examples[0]
    if (!example) throw new Error('character has no example word')
    expect(screen.getByText(example.kana)).toBeInTheDocument()
    expect(screen.getByText(example.english, { exact: false })).toBeInTheDocument()
  })

  it('marks a wrong answer without hiding the right one', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K-row')

    const answer = currentAnswer()
    const wrong = options().find(
      (o) => o.getAttribute('aria-label') !== expectedLabel(answer),
    )
    if (!wrong) throw new Error('every option matched the answer')

    await user.click(wrong)

    expect(screen.getByText('Not quite')).toBeInTheDocument()
    // Someone who guessed wrong still needs the thing they came for.
    const example = answer.examples[0]
    if (!example) throw new Error('character has no example word')
    expect(screen.getByText(example.kana)).toBeInTheDocument()
  })

  it('locks the options once an answer is committed', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K-row')

    const [first] = options()
    expect(first).toBeDefined()
    if (!first) return
    await user.click(first)

    for (const option of options()) expect(option).toBeDisabled()
  })

  it('walks the whole deck and then reports a score', async () => {
    const user = userEvent.setup()
    renderQuiz()
    // Three characters keeps the walk short; the や-row has gaps too.
    await selectRow(user, 'Y-row')

    for (let i = 0; i < 3; i++) {
      expect(screen.getByText(`Question ${String(i + 1)} of 3`)).toBeInTheDocument()
      const [first] = options()
      if (!first) throw new Error('no options rendered')
      await user.click(first)
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    expect(screen.getByText('Round complete')).toBeInTheDocument()
    expect(screen.getByText(/^\d+ \/ 3$/)).toBeInTheDocument()
  })

  /**
   * "Go again" must remount the round, NOT reload the page: the deck lives in
   * memory by design, so a reload would throw the selection away and strand the
   * learner on an empty grid.
   */
  it('starts a fresh round without losing the deck', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'Y-row')

    for (let i = 0; i < 3; i++) {
      const [first] = options()
      if (!first) throw new Error('no options rendered')
      await user.click(first)
      await user.click(screen.getByRole('button', { name: /Next|See how you did/ }))
    }

    await user.click(screen.getByRole('button', { name: 'Go again' }))

    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument()
    expect(screen.queryByText('Your deck is empty')).not.toBeInTheDocument()
  })

  /**
   * A deck this small cannot fill four options from itself. The question must
   * still be a question (CLAUDE.md §6).
   */
  it('still asks a four-option question from a two-character deck', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await user.click(screen.getByRole('button', { name: 'か ka' }))
    await user.click(screen.getByRole('button', { name: 'ぬ nu' }))

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    const shown = options().map((o) => o.getAttribute('aria-label'))
    expect(shown).toHaveLength(4)
    expect(new Set(shown).size).toBe(4)
  })
})
