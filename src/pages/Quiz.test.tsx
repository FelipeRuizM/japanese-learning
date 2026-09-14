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
  await user.click(screen.getByRole('button', { name: `${label} row, select all` }))
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
    await selectRow(user, 'K')

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
    await selectRow(user, 'K')

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
    await selectRow(user, 'K')

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
    await selectRow(user, 'K')

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
    await selectRow(user, 'Y')

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
    await selectRow(user, 'Y')

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

/* ------------------------------------------------------------------------- */

/** Answer the question on screen, deliberately right or deliberately wrong. */
async function answer(
  user: ReturnType<typeof userEvent.setup>,
  how: 'right' | 'wrong',
) {
  const want = expectedLabel(currentAnswer())
  const pick = options().find((o) =>
    how === 'right'
      ? o.getAttribute('aria-label') === want
      : o.getAttribute('aria-label') !== want,
  )
  if (!pick) throw new Error(`no ${how} option on screen`)
  await user.click(pick)
}

const step = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  await user.click(screen.getByRole('button', { name }))
}

describe('paging back and forth', () => {
  it('cannot advance until the question is answered', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await answer(user, 'right')
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled()
  })

  it('cannot go back from the first question', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled()
  })

  /**
   * GOING BACK IS REVIEW, NOT A SECOND ATTEMPT. The options stay locked and the
   * verdict stays as it was, so the score keeps meaning the round you actually
   * did rather than the round you repaired (CLAUDE.md §5).
   */
  it('shows an earlier question with its answer, locked', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    const first = currentAnswer()
    await answer(user, 'wrong')
    await step(user, 'Next')
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()

    await step(user, 'Previous')

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
    expect(currentAnswer()).toStrictEqual(first)
    expect(screen.getByText('Not quite')).toBeInTheDocument()
    for (const option of options()) expect(option).toBeDisabled()
  })

  it('says you are reviewing, rather than leaving it to be inferred', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    expect(screen.queryByText('Reviewing')).toBeNull()
    await answer(user, 'right')
    // Still not reviewing: you are looking at the result of what you just did.
    expect(screen.queryByText('Reviewing')).toBeNull()

    await step(user, 'Next')
    await answer(user, 'right')
    await step(user, 'Previous')
    expect(screen.getByText('Reviewing')).toBeInTheDocument()
  })

  it('keeps the score unchanged across a walk back and forward', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    await answer(user, 'right')
    await step(user, 'Next')
    await answer(user, 'wrong')
    expect(screen.getByText('1 correct')).toBeInTheDocument()

    await step(user, 'Previous')
    await step(user, 'Next')
    expect(screen.getByText('1 correct')).toBeInTheDocument()
  })
})

describe('retrying what you missed', () => {
  /** Answer every question in the round, missing exactly `wrong` of them. */
  async function walk(user: ReturnType<typeof userEvent.setup>, wrong: number) {
    for (let i = 0; i < 5; i++) {
      await answer(user, i < wrong ? 'wrong' : 'right')
      await step(user, i === 4 ? 'See how you did' : 'Next')
    }
  }

  it('offers a retry naming how many there are', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')
    await walk(user, 2)

    expect(screen.getByText('3 / 5')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Retry the 2 you missed' }),
    ).toBeInTheDocument()
  })

  it('offers no retry when nothing was missed', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')
    await walk(user, 0)

    expect(screen.getByText('5 / 5')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Go again' })).toBeInTheDocument()
  })

  it('builds the retry round from exactly the missed characters', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')

    const missed: string[] = []
    for (let i = 0; i < 5; i++) {
      if (i < 2) missed.push(currentAnswer().id)
      await answer(user, i < 2 ? 'wrong' : 'right')
      await step(user, i === 4 ? 'See how you did' : 'Next')
    }

    await step(user, 'Retry the 2 you missed')

    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()
    const asked = [currentAnswer().id]
    await answer(user, 'right')
    await step(user, 'Next')
    asked.push(currentAnswer().id)

    expect([...asked].sort()).toEqual([...missed].sort())
  })

  it('goes back to the full round on Go again', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')
    await walk(user, 2)
    await step(user, 'Retry the 2 you missed')
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()

    await answer(user, 'right')
    await step(user, 'Next')
    await answer(user, 'right')
    await step(user, 'See how you did')
    await step(user, 'Go again')

    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
  })

  /**
   * A retry subset must not outlive the deck it came from. Without the tag on
   * the stored retry, changing the selection mid-retry leaves you answering
   * characters you have just deselected — which looks like a data bug and is
   * really a stale-state one.
   */
  it('drops a pending retry when the deck changes', async () => {
    const user = userEvent.setup()
    renderQuiz()
    await selectRow(user, 'K')
    await walk(user, 2)
    await step(user, 'Retry the 2 you missed')
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument()

    await selectRow(user, 'M')

    // Ten characters, all of them — not the two that were pending.
    expect(screen.getByText('Question 1 of 10')).toBeInTheDocument()
  })
})
