import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Writing } from './Writing'
import { DeckProvider } from '../data/DeckProvider'
import { CharacterGrid } from '../components/CharacterGrid'
import { allCharacters, DEFAULT_CHARACTER_SET } from '../characters/registry'

class FakeUtterance {
  lang = ''
  rate = 1
  voice: SpeechSynthesisVoice | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  text: string
  constructor(text: string) {
    this.text = text
  }
}

function installVoice() {
  const spoken: string[] = []
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => [{ lang: 'ja-JP', name: 'Test' }],
    speak: (u: SpeechSynthesisUtterance) => {
      spoken.push(u.text)
      queueMicrotask(() => u.onend?.(new Event('end') as SpeechSynthesisEvent))
    },
    cancel: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  return spoken
}

/**
 * Writing alone. The grid is deliberately NOT rendered here: every one of its
 * cells carries `lang="ja"` and a single kana, so a document-wide search for
 * the revealed glyph finds seventy-one decoys and the reveal assertions pass
 * for the wrong reason. `renderWithGrid` exists only for the deck test.
 */
const renderWriting = () =>
  render(
    <MemoryRouter>
      <DeckProvider>
        <Writing />
      </DeckProvider>
    </MemoryRouter>,
  )

const renderWithGrid = () =>
  render(
    <MemoryRouter>
      <DeckProvider>
        <CharacterGrid set={DEFAULT_CHARACTER_SET} />
        <Writing />
      </DeckProvider>
    </MemoryRouter>,
  )

const ALL = allCharacters(DEFAULT_CHARACTER_SET)
const GLYPHS = new Set(ALL.map((c) => c.glyph))

/**
 * The kana inside the REVEAL, if the reveal is showing at all. Scoped to that
 * region rather than the document, so nothing else on the page can answer for
 * it.
 */
function revealedGlyph(): string | null {
  const region = screen.queryByText('You should have written')?.closest('div')
  if (!region) return null
  for (const el of region.querySelectorAll('[lang="ja"]')) {
    const text = el.textContent ?? ''
    if (text.length === 1 && GLYPHS.has(text)) return text
  }
  return null
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('writing practice', () => {
  it('starts with nothing given away', () => {
    renderWriting()
    expect(
      screen.getByRole('button', { name: 'Play a random sound' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Write this')).not.toBeInTheDocument()
  })

  it('plays a sound and shows the romaji as the prompt', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))

    expect(screen.getByText('Write this')).toBeInTheDocument()
    // It spoke the glyph, never the romaji.
    expect(spoken).toHaveLength(1)
    expect(GLYPHS.has(spoken[0] ?? '')).toBe(true)
  })

  /**
   * THE WHOLE EXERCISE. If the character is on screen before the reveal, this
   * stops being writing practice and becomes copying — so it must not be in the
   * DOM at all, not merely hidden with CSS, which would still leave it for a
   * screen reader to read out.
   */
  it('does not show the character until it is revealed', async () => {
    installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    expect(revealedGlyph()).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Show the character' }))
    expect(revealedGlyph()).not.toBeNull()
  })

  it('reveals the character that was actually spoken', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    await user.click(screen.getByRole('button', { name: 'Show the character' }))

    expect(revealedGlyph()).toBe(spoken[0])
  })

  it('hides the answer again on the next sound', async () => {
    installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    await user.click(screen.getByRole('button', { name: 'Show the character' }))
    expect(revealedGlyph()).not.toBeNull()

    await user.click(screen.getByRole('button', { name: 'Next sound' }))
    expect(revealedGlyph()).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Show the character' }),
    ).toBeInTheDocument()
  })

  /** Drawing the same character twice running reads as a broken button. */
  it('never repeats the character it just showed', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    for (let i = 0; i < 25; i++) {
      await user.click(screen.getByRole('button', { name: 'Next sound' }))
    }

    for (let i = 1; i < spoken.length; i++) {
      expect(spoken[i]).not.toBe(spoken[i - 1])
    }
  })

  it('draws from the whole set when nothing is selected', () => {
    renderWriting()
    expect(screen.getByText(/Drawing from all 71 characters/)).toBeInTheDocument()
  })

  /**
   * A selection is clearly what you want to practise, but requiring one before
   * the first sound would be friction for no gain — so the pool follows the
   * deck when there is one, and the screen says which it is using.
   */
  it('narrows to the deck once characters are selected', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderWithGrid()

    await user.click(screen.getByRole('button', { name: 'K row, select all' }))
    expect(
      screen.getByText('Drawing from the 5 characters you selected.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    for (let i = 0; i < 12; i++) {
      await user.click(screen.getByRole('button', { name: 'Next sound' }))
    }

    const kRow = new Set(ALL.filter((c) => c.rowId === 'k').map((c) => c.glyph))
    for (const glyph of spoken) expect(kRow.has(glyph)).toBe(true)
  })

  it('offers a replay without advancing', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderWriting()

    await user.click(screen.getByRole('button', { name: 'Play a random sound' }))
    await user.click(screen.getByRole('button', { name: /Play the pronunciation of/ }))

    expect(spoken).toHaveLength(2)
    expect(spoken[1]).toBe(spoken[0])
  })
})
