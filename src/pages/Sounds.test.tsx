import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Sounds } from './Sounds'
import {
  allCharacters,
  CHARACTER_SETS,
  DEFAULT_CHARACTER_SET,
} from '../characters/registry'

const [FIRST, SECOND] = CHARACTER_SETS

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

/** Installs a synth with a Japanese voice and records what gets spoken. */
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

const renderSounds = () =>
  render(
    <MemoryRouter>
      <Sounds />
    </MemoryRouter>,
  )

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('the pronunciation chart', () => {
  it('shows the whole set, not a deck', () => {
    renderSounds()
    // No selection needed: this is a reference, so every character is present
    // without anything having been chosen first.
    expect(screen.getAllByRole('button', { name: /, play$/ })).toHaveLength(71)
  })

  it('speaks the glyph when a character is tapped', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderSounds()

    await user.click(screen.getByRole('button', { name: 'か ka, play' }))

    // The glyph, never the romaji — a Japanese voice reads "ka" as English.
    expect(spoken).toEqual(['か'])
  })

  it('echoes what was tapped, with its reading and an example word', async () => {
    installVoice()
    const user = userEvent.setup()
    renderSounds()

    await user.click(screen.getByRole('button', { name: 'ね ne, play' }))

    const live = screen.getByText('ねこ').closest<HTMLElement>('[aria-live]')
    expect(live).not.toBeNull()
    if (!live) return
    expect(within(live).getByText('neko')).toBeInTheDocument()
    expect(within(live).getByText('cat')).toBeInTheDocument()
  })

  /**
   * The point of this screen is sound, so a device with no Japanese voice would
   * otherwise get silence and nothing else. A tap must still tell you something
   * (CLAUDE.md §4.2).
   */
  it('still answers a tap when there is no Japanese voice', async () => {
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => [{ lang: 'en-US', name: 'English' }],
      speak: () => undefined,
      cancel: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    })
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)

    const user = userEvent.setup()
    renderSounds()

    const cell = screen.getByRole('button', { name: 'ね ne, play' })
    expect(cell).toBeEnabled()

    await user.click(cell)
    expect(screen.getByText('ねこ')).toBeInTheDocument()
    expect(
      await screen.findByText(/no Japanese voice is installed/i),
    ).toBeInTheDocument()
  })

  it('marks the character that was last tapped', async () => {
    installVoice()
    const user = userEvent.setup()
    renderSounds()

    const ka = screen.getByRole('button', { name: 'か ka, play' })
    const ki = screen.getByRole('button', { name: 'き ki, play' })

    // `classList.contains` and not a substring check: every cell carries
    // `hover:bg-accent-soft`, which contains "bg-accent" and made the first
    // version of this test pass for the wrong reason.
    await user.click(ka)
    expect(ka.classList.contains('bg-accent')).toBe(true)
    expect(ki.classList.contains('bg-accent')).toBe(false)

    await user.click(ki)
    expect(ki.classList.contains('bg-accent')).toBe(true)
    expect(ka.classList.contains('bg-accent')).toBe(false)
  })

  /**
   * A cell here performs an action; it is not a toggle. Announcing "pressed"
   * for something that plays a sound and returns to rest would misdescribe it.
   */
  it('does not pretend its cells are toggles', () => {
    renderSounds()
    for (const cell of screen.getAllByRole('button', { name: /, play$/ })) {
      expect(cell).not.toHaveAttribute('aria-pressed')
    }
  })

  it('keeps every character of the set reachable, gaps included', () => {
    renderSounds()
    for (const character of allCharacters(DEFAULT_CHARACTER_SET)) {
      expect(
        screen.getByRole('button', {
          name: `${character.glyph} ${character.romaji}, play`,
        }),
      ).toBeInTheDocument()
    }
  })
})

describe('the chart picker', () => {
  it('swaps which chart is on the reference', async () => {
    const user = userEvent.setup()
    renderSounds()
    expect(SECOND).toBeDefined()
    if (!SECOND || !FIRST) return

    expect(screen.getByRole('button', { name: 'か ka, play' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: SECOND.label }))

    expect(
      screen.queryByRole('button', { name: 'か ka, play' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'カ ka, play' })).toBeInTheDocument()
    // One chart at a time — the second is a swap, not an addition.
    expect(screen.getAllByRole('button', { name: /, play$/ })).toHaveLength(71)

    for (const character of allCharacters(SECOND)) {
      expect(
        screen.getByRole('button', {
          name: `${character.glyph} ${character.romaji}, play`,
        }),
      ).toBeInTheDocument()
    }
  })

  it('speaks the character belonging to the chart on screen', async () => {
    const spoken = installVoice()
    const user = userEvent.setup()
    renderSounds()
    if (!SECOND) return

    await user.click(screen.getByRole('button', { name: SECOND.label }))
    await user.click(screen.getByRole('button', { name: 'カ ka, play' }))

    expect(spoken).toEqual(['カ'])
  })

  /**
   * The echo below the chart is what you last tapped. After a swap that
   * character is no longer on the chart in front of you, and leaving it there
   * would read as belonging to the set you are now looking at.
   */
  it('clears the echo when the chart changes', async () => {
    installVoice()
    const user = userEvent.setup()
    renderSounds()
    if (!SECOND || !FIRST) return

    await user.click(screen.getByRole('button', { name: 'ね ne, play' }))
    expect(screen.getByText('ねこ')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: SECOND.label }))
    expect(screen.queryByText('ねこ')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: FIRST.label }))
    expect(screen.queryByText('ねこ')).not.toBeInTheDocument()
  })
})
