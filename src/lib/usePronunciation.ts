import { useCallback, useEffect, useRef, useState } from 'react'
import {
  browserSpeechDeps,
  createSpeechProvider,
  resolveJapaneseVoice,
  type PronunciationProvider,
  type Speakable,
} from './pronunciation'

/**
 * `checking` is a real state, not a nicety.
 *
 * CLAUDE.md §4.2 originally specified two — ready and unavailable — but voice
 * resolution is asynchronous, and `getVoices()` is empty on the first call in
 * Chrome. Collapsing "still looking" into "unavailable" would flash "No
 * Japanese voice on this device" at every user on first paint, then take it
 * back. The spec now names all three.
 */
export type PronunciationStatus = 'checking' | 'ready' | 'unavailable'

export type Pronunciation = {
  status: PronunciationStatus
  speak: (subject: Speakable) => void
}

/**
 * Resolve the provider once per module load. Swapping to the file provider
 * later is this function and nothing else (CLAUDE.md §4.2).
 */
function selectProvider(): PronunciationProvider | null {
  const deps = browserSpeechDeps()
  return deps ? createSpeechProvider(deps) : null
}

export function usePronunciation(): Pronunciation {
  const providerRef = useRef<PronunciationProvider | null>(null)

  /**
   * Whether the API EXISTS is a synchronous fact, so it decides the initial
   * value during render rather than in an effect. Setting it from an effect
   * would start a second render for something already knowable — and no
   * browser without the API can ever leave this state.
   *
   * Only the voice lookup is async, and only that updates from the effect.
   */
  const [status, setStatus] = useState<PronunciationStatus>(() =>
    browserSpeechDeps() ? 'checking' : 'unavailable',
  )

  useEffect(() => {
    const deps = browserSpeechDeps()
    if (!deps) return

    providerRef.current = selectProvider()

    let live = true
    void resolveJapaneseVoice(deps.synth).then((voice) => {
      if (live) setStatus(voice ? 'ready' : 'unavailable')
    })

    return () => {
      live = false
    }
  }, [])

  const speak = useCallback((subject: Speakable) => {
    // Fire and forget. Nothing in the UI waits on audio finishing, and romaji
    // never depends on it (CLAUDE.md §4.2).
    void providerRef.current?.speak(subject)
  }, [])

  return { status, speak }
}
