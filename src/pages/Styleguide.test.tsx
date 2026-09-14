import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { Styleguide } from './Styleguide'
import { DeckProvider } from '../data/DeckProvider'

/**
 * A SMOKE TEST, and deliberately only that.
 *
 * "A component that is not in the styleguide is not done" (CLAUDE.md §7) had no
 * test behind it, so the page could throw and every other suite would still be
 * green — the styleguide is the one route nothing else renders. That went
 * unnoticed until two LIVE demos landed here: a demo that holds real state can
 * break in ways a static swatch cannot.
 *
 * It asserts the page renders and that each section exists, NOT what any
 * section looks like. The components' own tests cover behaviour, and a
 * styleguide test that duplicated them would be a second place to update every
 * time a label changes — which is how a styleguide stops being kept current.
 */
describe('the styleguide', () => {
  it('renders every section without throwing', () => {
    render(
      <MemoryRouter>
        <DeckProvider>
          <Styleguide />
        </DeckProvider>
      </MemoryRouter>,
    )

    for (const title of [
      'Surfaces',
      'Ink ramp',
      'Accent and semantics',
      'Pronunciation',
      'Flashcard',
      'Vocabulary card',
      'Vocabulary quiz card',
      'Numbers card',
      'Cloze card',
      'Quiz card',
      'Empty deck',
      'Grid cell',
      'Sound cell',
      'Set picker',
      'Toggle',
      'Scope picker and round size',
      'Grid: the flow layout',
      'Type',
      'Glyph scale',
      'Controls',
    ]) {
      expect(screen.getByText(title), `section "${title}"`).toBeInTheDocument()
    }
  })

  /**
   * The live demos are the ones worth a second look: they hold state, so they
   * are the only things here that can be wrong rather than merely ugly.
   */
  it('renders the live pickers in a usable state', () => {
    render(
      <MemoryRouter>
        <DeckProvider>
          <Styleguide />
        </DeckProvider>
      </MemoryRouter>,
    )

    // All three toggle states, which is the whole point of showing them.
    const states = ['true', 'false', 'mixed'].map(
      (state) => document.querySelectorAll(`[aria-pressed="${state}"]`).length,
    )
    for (const count of states) expect(count).toBeGreaterThan(0)
  })
})
