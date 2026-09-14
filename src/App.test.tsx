import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { APP_VERSION } from './version'

describe('App shell', () => {
  it('renders the header and the version', async () => {
    render(<App />)

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Japanese practice' }),
    ).toBeInTheDocument()
    expect(screen.getByText(`v${APP_VERSION}`)).toBeInTheDocument()
  })

  /**
   * The grouping is the feature, so the test asserts the grouping rather than a
   * flat list of links. A link that moved from one pillar to the other would
   * pass a "does this link exist" check and be exactly the regression worth
   * catching.
   */
  it.each([
    ['Kana', ['Characters', 'Flashcards', 'Quiz', 'Sounds', 'Writing']],
    ['Course', ['Vocabulary', 'Numbers', 'Grammar']],
  ])('groups the %s routes into their own landmark', async (group, labels) => {
    render(<App />)

    const nav = await screen.findByRole('navigation', { name: group })
    for (const label of labels) {
      expect(within(nav).getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(within(nav).getAllByRole('link')).toHaveLength(labels.length)
  })

  it('names each landmark with text that is actually on screen', async () => {
    // `aria-labelledby`, not `aria-label`: a voice-control user says what they
    // can read (CLAUDE.md §8). A divergence here is invisible in a browser.
    render(<App />)
    for (const group of ['Kana', 'Course']) {
      const nav = await screen.findByRole('navigation', { name: group })
      expect(within(nav).getByText(group)).toBeInTheDocument()
    }
  })

  it('lands on the characters route', async () => {
    render(<App />)
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Choose what to study' }),
    ).toBeInTheDocument()
  })
})
