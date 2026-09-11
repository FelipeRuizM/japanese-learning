import { describe, expect, it, vi } from 'vitest'
import {
  createFileProvider,
  createSpeechProvider,
  resolveJapaneseVoice,
  type Synth,
} from './pronunciation'
import type { Speakable } from './pronunciation'

// `script` comes from the registry rather than a literal: a lib test
// hardcoding a ScriptId is exactly the coupling the leak test guards against,
// and it caught this one.
const KA: Speakable = { ja: 'か' }

function voice(lang: string, name = lang): SpeechSynthesisVoice {
  return {
    lang,
    name,
    default: false,
    localService: true,
    voiceURI: name,
  } as SpeechSynthesisVoice
}

/**
 * A stub of just the surface `pronunciation.ts` uses. Modelling the real API's
 * behaviour — including that `getVoices()` can start empty — is the point.
 */
function stubSynth(initial: SpeechSynthesisVoice[]) {
  const listeners = new Set<() => void>()
  let voices = initial
  const spoken: SpeechSynthesisUtterance[] = []
  let cancels = 0

  const synth: Synth = {
    getVoices: () => voices,
    speak: (utterance) => {
      spoken.push(utterance)
      // The real API fires onend asynchronously.
      queueMicrotask(() => utterance.onend?.(new Event('end') as SpeechSynthesisEvent))
    },
    cancel: () => {
      cancels += 1
    },
    addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
      listeners.add(listener as () => void)
    },
    removeEventListener: (
      _type: string,
      listener: EventListenerOrEventListenerObject,
    ) => {
      listeners.delete(listener as () => void)
    },
  }

  return {
    synth,
    spoken,
    get cancels() {
      return cancels
    },
    /** What the browser does once the voice list has loaded. */
    loadVoices(next: SpeechSynthesisVoice[]) {
      voices = next
      for (const listener of listeners) listener()
    },
    get listenerCount() {
      return listeners.size
    },
  }
}

class FakeUtterance {
  lang = ''
  rate = 1
  voice: SpeechSynthesisVoice | null = null
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  text: string
  // Field declared and assigned rather than a parameter property:
  // `erasableSyntaxOnly` forbids the shorthand.
  constructor(text: string) {
    this.text = text
  }
}

const Utterance = FakeUtterance as unknown as new (
  text: string,
) => SpeechSynthesisUtterance

describe('resolveJapaneseVoice', () => {
  it('finds a Japanese voice that is already loaded', async () => {
    const { synth } = stubSynth([voice('en-US'), voice('ja-JP', 'Nanami')])
    expect((await resolveJapaneseVoice(synth))?.name).toBe('Nanami')
  })

  /**
   * THE TRAP (CLAUDE.md §4.2). Chrome returns [] from the first `getVoices()`
   * call and announces the real list later with `voiceschanged`. Treating that
   * empty array as "none installed" would show every user the unavailable
   * state on first paint.
   */
  it('waits through an empty first call rather than concluding "none"', async () => {
    const stub = stubSynth([])
    const pending = resolveJapaneseVoice(stub.synth)

    expect(stub.listenerCount).toBe(1)
    stub.loadVoices([voice('en-GB'), voice('ja-JP', 'Kyoko')])

    expect((await pending)?.name).toBe('Kyoko')
    // The listener is torn down once it has served its purpose.
    expect(stub.listenerCount).toBe(0)
  })

  it('ignores a voiceschanged event that carries no voices', async () => {
    const stub = stubSynth([])
    const pending = resolveJapaneseVoice(stub.synth)

    stub.loadVoices([])
    expect(stub.listenerCount).toBe(1) // still waiting

    stub.loadVoices([voice('ja-JP', 'Kyoko')])
    expect((await pending)?.name).toBe('Kyoko')
  })

  /**
   * A loaded list with no Japanese in it is a real answer. Making someone wait
   * out the timeout to be told what is already known is just a slow no.
   */
  it('answers immediately when the list is loaded but has no Japanese', async () => {
    const { synth } = stubSynth([voice('en-US'), voice('fr-FR')])
    expect(await resolveJapaneseVoice(synth)).toBeNull()
  })

  it('gives up after the timeout rather than hanging forever', async () => {
    vi.useFakeTimers()
    const stub = stubSynth([])
    const pending = resolveJapaneseVoice(stub.synth, 2000)

    vi.advanceTimersByTime(2000)
    expect(await pending).toBeNull()
    vi.useRealTimers()
  })

  it('matches an underscore locale, and never sniffs the browser', async () => {
    const { synth } = stubSynth([voice('ja_JP', 'Underscore')])
    expect((await resolveJapaneseVoice(synth))?.name).toBe('Underscore')
  })

  it('resolves once per synth and reuses the answer', async () => {
    const stub = stubSynth([voice('ja-JP', 'Nanami')])
    const a = resolveJapaneseVoice(stub.synth)
    const b = resolveJapaneseVoice(stub.synth)
    expect(a).toBe(b)
    await a
  })
})

describe('the speech provider', () => {
  it('speaks the GLYPH, never the romaji', async () => {
    const stub = stubSynth([voice('ja-JP', 'Nanami')])
    await createSpeechProvider({ synth: stub.synth, Utterance }).speak(KA)

    expect(stub.spoken).toHaveLength(1)
    // Handing "ka" to a Japanese voice gets it read as English.
    expect(stub.spoken[0]?.text).toBe('か')
    expect(stub.spoken[0]?.text).not.toBe('ka')
  })

  it('sets the resolved voice, its language, and a learner-friendly rate', async () => {
    const stub = stubSynth([voice('ja-JP', 'Nanami')])
    await createSpeechProvider({ synth: stub.synth, Utterance }).speak(KA)

    expect(stub.spoken[0]?.voice?.name).toBe('Nanami')
    expect(stub.spoken[0]?.lang).toBe('ja-JP')
    expect(stub.spoken[0]?.rate).toBeLessThan(1)
  })

  /**
   * Chrome queues utterances rather than replacing them, so a learner clicking
   * quickly through flashcards builds a backlog that keeps talking after they
   * have moved on.
   */
  it('cancels anything in flight before speaking', async () => {
    const stub = stubSynth([voice('ja-JP')])
    const provider = createSpeechProvider({ synth: stub.synth, Utterance })

    await provider.speak(KA)
    await provider.speak(KA)

    expect(stub.cancels).toBe(2)
    expect(stub.spoken).toHaveLength(2)
  })

  it('stays quiet, and does not throw, when there is no Japanese voice', async () => {
    const stub = stubSynth([voice('en-US')])
    await expect(
      createSpeechProvider({ synth: stub.synth, Utterance }).speak(KA),
    ).resolves.toBeUndefined()
    expect(stub.spoken).toHaveLength(0)
  })

  /**
   * A caller awaiting audio must not have to catch in order to reveal romaji.
   * The reveal never depends on sound.
   */
  it('resolves rather than rejecting when the utterance errors', async () => {
    const stub = stubSynth([voice('ja-JP')])
    const failing: Synth = {
      ...stub.synth,
      speak: (utterance) => {
        queueMicrotask(() =>
          utterance.onerror?.(new Event('error') as SpeechSynthesisErrorEvent),
        )
      },
    }
    await expect(
      createSpeechProvider({ synth: failing, Utterance }).speak(KA),
    ).resolves.toBeUndefined()
  })
})

/**
 * The file provider is not wired up (CLAUDE.md §4.2). It is tested so that
 * dropping in a licensed audio set stays a data change rather than a rewrite —
 * an untested receiving end would have rotted by then.
 */
describe('the file provider', () => {
  class FakeAudio {
    onended: (() => void) | null = null
    onerror: (() => void) | null = null
    static created: string[] = []
    src: string
    constructor(src: string) {
      this.src = src
      FakeAudio.created.push(src)
    }
    play() {
      queueMicrotask(() => this.onended?.())
      return Promise.resolve()
    }
  }

  const Audio = FakeAudio as unknown as new (src: string) => HTMLAudioElement

  it('plays the character audio under the deployed base path', async () => {
    FakeAudio.created = []
    const provider = createFileProvider(Audio, '/japanese-learning/')
    await provider.speak({ ...KA, audio: 'audio/ka.mp3' })

    // A bare /audio/ka.mp3 would 404 on Pages, which serves from a subdirectory.
    expect(FakeAudio.created).toEqual(['/japanese-learning/audio/ka.mp3'])
  })

  it('does nothing for an entry with no recording', async () => {
    FakeAudio.created = []
    await createFileProvider(Audio, '/japanese-learning/').speak(KA)
    // A partially-recorded set is a normal state, not an error.
    expect(FakeAudio.created).toEqual([])
  })
})
