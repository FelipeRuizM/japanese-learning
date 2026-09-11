import { renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePronunciation } from './usePronunciation'

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

function installSynth(voices: { lang: string }[]) {
  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    speak: () => undefined,
    cancel: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  })
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('usePronunciation', () => {
  /**
   * jsdom has no Web Speech API at all, and neither do some embedded browsers.
   * That must resolve to a definite answer rather than sitting in `checking`
   * forever, because the control stays disabled until it does.
   */
  it('reports unavailable where the API does not exist', async () => {
    const { result } = renderHook(() => usePronunciation())
    await waitFor(() => {
      expect(result.current.status).toBe('unavailable')
    })
  })

  it('reports ready when a Japanese voice is present', async () => {
    installSynth([{ lang: 'en-US' }, { lang: 'ja-JP' }])
    const { result } = renderHook(() => usePronunciation())
    await waitFor(() => {
      expect(result.current.status).toBe('ready')
    })
  })

  it('reports unavailable when voices are loaded but none is Japanese', async () => {
    installSynth([{ lang: 'en-US' }, { lang: 'de-DE' }])
    const { result } = renderHook(() => usePronunciation())
    await waitFor(() => {
      expect(result.current.status).toBe('unavailable')
    })
  })

  /** Nothing in the UI awaits audio, so `speak` must not throw at any status. */
  it('is safe to call speak before a provider exists', async () => {
    const { result } = renderHook(() => usePronunciation())
    await waitFor(() => {
      expect(result.current.status).toBe('unavailable')
    })
    expect(() => {
      result.current.speak({ ja: 'か' })
    }).not.toThrow()
  })
})
