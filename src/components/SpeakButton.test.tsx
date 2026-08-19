import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PronunciationNote, SpeakButton } from './SpeakButton'
import { DEFAULT_CHARACTER_SET } from '../characters/registry'
import { allCharacters } from '../characters/registry'
import type { Character } from '../types/characters'

const KA = allCharacters(DEFAULT_CHARACTER_SET).find(
  (c) => c.romaji === 'ka',
) as Character

describe('SpeakButton', () => {
  it('plays the character when it is ready', async () => {
    const user = userEvent.setup()
    const onSpeak = vi.fn()
    render(<SpeakButton character={KA} status="ready" onSpeak={onSpeak} />)

    await user.click(screen.getByRole('button'))
    expect(onSpeak).toHaveBeenCalledWith(KA)
  })

  it('names what it will do, rather than just showing an icon', () => {
    render(<SpeakButton character={KA} status="ready" onSpeak={() => undefined} />)
    expect(
      screen.getByRole('button', { name: `Play the pronunciation of ${KA.glyph}` }),
    ).toBeInTheDocument()
  })

  /**
   * Disabled and explaining itself, not hidden: an absent button reads as
   * "this app has no audio", which is not what happened (CLAUDE.md §4.2).
   */
  it('is disabled and says why when there is no Japanese voice', () => {
    render(
      <SpeakButton character={KA} status="unavailable" onSpeak={() => undefined} />,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAccessibleName(/no Japanese voice on this device/i)
  })

  /** Nothing to say yet — pressing it would be a no-op with no feedback. */
  it('is disabled while the voice list is still resolving', () => {
    render(<SpeakButton character={KA} status="checking" onSpeak={() => undefined} />)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})

describe('PronunciationNote', () => {
  it('appears only when pronunciation is genuinely unavailable', () => {
    const { rerender, container } = render(<PronunciationNote status="ready" />)
    expect(container).toBeEmptyDOMElement()

    rerender(<PronunciationNote status="checking" />)
    expect(container).toBeEmptyDOMElement()

    rerender(<PronunciationNote status="unavailable" />)
    expect(screen.getByText(/no Japanese voice is installed/i)).toBeInTheDocument()
  })

  it('promises romaji regardless, because the reveal never depends on sound', () => {
    render(<PronunciationNote status="unavailable" />)
    expect(screen.getByText(/romaji still shows/i)).toBeInTheDocument()
  })
})
