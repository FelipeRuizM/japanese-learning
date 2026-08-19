import type { Character } from '../types/characters'

/**
 * Pronunciation (CLAUDE.md §4).
 *
 * There is no off-the-shelf, openly-licensed, coherently-recorded 46-kana audio
 * set — three candidate sources were checked and ruled out, and §4.1 records
 * which and why. So speech synthesis ships, behind an interface that makes real
 * files a data change rather than a rewrite.
 *
 * `fileProvider` is written and tested here and is NOT wired up. When a
 * licensed set appears, populating `character.audio` and swapping the provider
 * in `usePronunciation` is the whole job.
 */

export type PronunciationProvider = {
  readonly kind: 'speech' | 'file'
  /** Whether the MECHANISM exists at all. Not whether it will produce sound. */
  available: () => boolean
  speak: (character: Character) => Promise<void>
}

/**
 * The subset of `SpeechSynthesis` this module uses, so a test can supply a stub
 * without constructing a browser API.
 */
export type Synth = Pick<
  SpeechSynthesis,
  'getVoices' | 'speak' | 'cancel' | 'addEventListener' | 'removeEventListener'
>

export type UtteranceCtor = new (text: string) => SpeechSynthesisUtterance

export type SpeechDeps = {
  synth: Synth
  Utterance: UtteranceCtor
}

/**
 * Match on what the voice REPORTS, never on which browser is running.
 *
 * Browser sniffing is wrong here twice over: Chrome on iOS uses the WebKit
 * voice list rather than the desktop Chrome one, and a user can install or
 * remove voices at the OS level at any time. The voice list is the only
 * authority.
 *
 * Some platforms report `ja_JP` with an underscore, so it is normalised.
 */
function isJapanese(voice: SpeechSynthesisVoice): boolean {
  return /^ja(-|$)/i.test(voice.lang.replace('_', '-'))
}

function pickJapanese(
  voices: readonly SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  return voices.find(isJapanese) ?? null
}

/**
 * Cached per synth object rather than per module, so each test's stub gets a
 * fresh resolution and no test-only reset hatch has to exist in shipping code.
 */
const voiceCache = new WeakMap<Synth, Promise<SpeechSynthesisVoice | null>>()

/**
 * Resolve a Japanese voice, once.
 *
 * THE TRAP: `getVoices()` returns `[]` on the first call in Chrome — the list
 * loads asynchronously and announces itself with `voiceschanged`. Treating that
 * empty array as "no Japanese voice installed" is the bug this function exists
 * to avoid, and it would show every user the unavailable state on first paint.
 *
 * An empty list means "not loaded yet, wait". A NON-empty list with no Japanese
 * in it is a real answer and returns immediately — no reason to make someone
 * wait out the timeout to be told what is already known.
 */
export function resolveJapaneseVoice(
  synth: Synth,
  timeoutMs = 2000,
): Promise<SpeechSynthesisVoice | null> {
  const cached = voiceCache.get(synth)
  if (cached) return cached

  const resolution = new Promise<SpeechSynthesisVoice | null>((resolve) => {
    const initial = synth.getVoices()
    if (initial.length > 0) {
      resolve(pickJapanese(initial))
      return
    }

    let settled = false
    const finish = (voice: SpeechSynthesisVoice | null) => {
      if (settled) return
      settled = true
      synth.removeEventListener('voiceschanged', onChange)
      clearTimeout(timer)
      resolve(voice)
    }

    const onChange = () => {
      const voices = synth.getVoices()
      // Ignore a spurious event that carries no voices; keep waiting.
      if (voices.length > 0) finish(pickJapanese(voices))
    }

    // A browser that never fires the event must not leave the UI in a
    // permanent "checking" state.
    const timer = setTimeout(() => {
      finish(pickJapanese(synth.getVoices()))
    }, timeoutMs)

    synth.addEventListener('voiceschanged', onChange)
  })

  voiceCache.set(synth, resolution)
  return resolution
}

/** The browser's speech synthesis, or `null` where the API does not exist. */
export function browserSpeechDeps(): SpeechDeps | null {
  if (typeof globalThis.speechSynthesis === 'undefined') return null
  if (typeof globalThis.SpeechSynthesisUtterance === 'undefined') return null
  return {
    synth: globalThis.speechSynthesis,
    Utterance: globalThis.SpeechSynthesisUtterance,
  }
}

export function createSpeechProvider(deps: SpeechDeps): PronunciationProvider {
  return {
    kind: 'speech',
    available: () => true,

    async speak(character: Character) {
      const voice = await resolveJapaneseVoice(deps.synth)
      if (!voice) return

      // Chrome QUEUES utterances rather than replacing them. Without this, a
      // learner clicking through flashcards quickly builds a backlog that keeps
      // talking long after they have moved on.
      deps.synth.cancel()

      // The GLYPH, never the romaji. Handing "ka" to a Japanese voice gets it
      // read as English (CLAUDE.md §4.2).
      const utterance = new deps.Utterance(character.glyph)
      utterance.voice = voice
      utterance.lang = voice.lang
      // A shade under natural pace. These are single morae; at 1.0 a learner
      // gets a syllable and a half of nothing to hold on to.
      utterance.rate = 0.85

      await new Promise<void>((resolve) => {
        utterance.onend = () => {
          resolve()
        }
        // Resolve rather than reject on error: a caller awaiting audio should
        // not have to catch in order to reveal romaji, which never depends on
        // sound (CLAUDE.md §4.2).
        utterance.onerror = () => {
          resolve()
        }
        deps.synth.speak(utterance)
      })
    },
  }
}

export type AudioCtor = new (src: string) => HTMLAudioElement

/**
 * Plays `character.audio`. WRITTEN AND TESTED BUT NOT WIRED UP — it is the
 * receiving end of the decision in §4.1, kept working so that dropping in a
 * licensed audio set is a data change.
 *
 * `base` is the deployed base path, because a bare `/audio/ka.mp3` would 404 on
 * GitHub Pages, which serves this app from a subdirectory.
 */
export function createFileProvider(
  AudioElement: AudioCtor,
  base = import.meta.env.BASE_URL,
): PronunciationProvider {
  return {
    kind: 'file',
    available: () => true,

    async speak(character: Character) {
      const src = character.audio
      // No file for this character is a normal state, not an error: the whole
      // set may be partially recorded.
      if (src === undefined) return

      const audio = new AudioElement(`${base}${src.replace(/^\//, '')}`)
      await new Promise<void>((resolve) => {
        audio.onended = () => {
          resolve()
        }
        audio.onerror = () => {
          resolve()
        }
        void audio.play()?.catch(() => {
          resolve()
        })
      })
    },
  }
}
